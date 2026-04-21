export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const {
      locale = 'en',
      name = '',
      email = '',
      phone = '',
      interest = '',
      message = '',
      page = '',
      company = '',
      website = '',
      formStartedAt = '',
      interest_type = '',
      budget_range = '',
      timeline = ''
    } = req.body || {};

    const clean = (value) => String(value || '').trim();

    const payload = {
      locale: clean(locale),
      name: clean(name),
      email: clean(email),
      phone: clean(phone),
      interest: clean(interest),
      message: clean(message),
      page: clean(page),
      company: clean(company),
      website: clean(website),
      formStartedAt: clean(formStartedAt),
      interest_type: clean(interest_type),
      budget_range: clean(budget_range),
      timeline: clean(timeline)
    };

    console.log('CONTACT PAYLOAD', payload);

    // anti-spam honeypot
    if (payload.company || payload.website) {
      return res.status(200).json({ ok: true });
    }

    // anti-bot time trap
    const startedAt = Number(payload.formStartedAt || 0);
    if (Number.isFinite(startedAt) && startedAt > 0) {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 1500) {
        return res.status(200).json({ ok: true });
      }
    }

    // validations
    if (!payload.name || !payload.email || !payload.interest || !payload.message) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return res.status(400).json({ ok: false, error: 'Invalid email' });
    }

    if (payload.message.length < 5) {
      return res.status(400).json({ ok: false, error: 'Message too short' });
    }

    // normalization
    const normalizedInterestType =
      payload.interest_type || inferInterestType(payload.interest, payload.message);

    const normalizedBudgetRange =
      payload.budget_range || inferBudgetRange(payload.message);

    const normalizedTimeline =
      payload.timeline || inferTimeline(payload.message);

    const score = calculateLeadScore({
      interest_type: normalizedInterestType,
      budget_range: normalizedBudgetRange,
      timeline: normalizedTimeline,
      interest: payload.interest,
      message: payload.message
    });

    const tier = getLeadTier(score);

    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL;
    const fromEmail = process.env.CONTACT_FROM_EMAIL;

    if (!resendApiKey || !toEmail || !fromEmail) {
      console.error('Missing env variables');
      return res.status(500).json({ ok: false, error: 'Server config error' });
    }

    const submittedAt = new Date().toLocaleString();

    const subject =
      payload.locale === 'pt'
        ? `[${tier}] Casas da Vila Homes | Novo contato`
        : `[${tier}] Casas da Vila Homes | New inquiry`;

    const html = buildPremiumInternalEmail({
      payload,
      submittedAt,
      score,
      tier,
      interest_type: normalizedInterestType,
      budget_range: normalizedBudgetRange,
      timeline: normalizedTimeline
    });

    // send email
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: payload.email,
        subject,
        html
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend error', resendData);
      return res.status(500).json({ ok: false, error: 'Email failed' });
    }

    // supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          message: payload.message,
          interest: payload.interest,
          interest_type: normalizedInterestType,
          budget_range: normalizedBudgetRange,
          timeline: normalizedTimeline,
          score,
          tier,
          source: payload.locale === 'pt' ? 'site_pt' : 'site_en',
          status: 'new'
        })
      });
    }

    return res.status(200).json({ ok: true, score, tier });

  } catch (error) {
    console.error('CONTACT ERROR', error);
    return res.status(500).json({ ok: false, error: 'Unexpected error' });
  }
}

/* =========================
   SCORING
========================= */

function calculateLeadScore({ interest_type, budget_range, timeline, interest, message }) {
  let score = 0;

  if (interest_type === 'investment') score += 40;
  if (interest_type === 'purchase') score += 30;
  if (interest_type === 'stay') score += 10;

  if (budget_range === 'ultra') score += 35;
  if (budget_range === 'high') score += 20;

  if (timeline === 'immediate') score += 20;
  if (timeline === '3-6m') score += 10;

  const text = `${interest} ${message}`.toLowerCase();

  if (text.includes('invest')) score += 10;
  if (text.includes('buy') || text.includes('comprar')) score += 10;

  return Math.min(score, 100);
}

function getLeadTier(score) {
  if (score >= 70) return 'A';
  if (score >= 40) return 'B';
  return 'C';
}

/* =========================
   INFERENCE
========================= */

function inferInterestType(interest, message) {
  const text = `${interest} ${message}`.toLowerCase();

  if (text.includes('invest')) return 'investment';
  if (text.includes('buy') || text.includes('comprar')) return 'purchase';
  if (text.includes('stay') || text.includes('rental')) return 'stay';

  return 'unknown';
}

function inferBudgetRange(message) {
  const text = message.toLowerCase();

  if (text.includes('5m') || text.includes('r$ 5')) return 'ultra';
  if (text.includes('2m') || text.includes('r$ 2')) return 'high';

  return 'unknown';
}

function inferTimeline(message) {
  const text = message.toLowerCase();

  if (text.includes('immediate') || text.includes('agora')) return 'immediate';
  if (text.includes('3') || text.includes('6')) return '3-6m';

  return 'long';
}

/* =========================
   EMAIL TEMPLATE
========================= */

function buildPremiumInternalEmail({
  payload,
  submittedAt,
  score,
  tier,
  interest_type,
  budget_range,
  timeline
}) {
  return `
    <div style="font-family:Arial;padding:24px;background:#f6f2eb">
      <h2>Casas da Vila Homes</h2>
      <p><strong>Tier:</strong> ${tier} | Score: ${score}</p>

      <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(payload.phone)}</p>

      <p><strong>Interest:</strong> ${escapeHtml(payload.interest)}</p>
      <p><strong>Type:</strong> ${interest_type}</p>
      <p><strong>Budget:</strong> ${budget_range}</p>
      <p><strong>Timeline:</strong> ${timeline}</p>

      <p><strong>Message:</strong><br>${escapeHtml(payload.message)}</p>

      <p><small>${submittedAt}</small></p>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}