const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 min
const RATE_LIMIT_MAX_REQUESTS = 5;

const rateStore = global.__contactRateStore || new Map();
global.__contactRateStore = rateStore;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const ip = getClientIp(req);
    const now = Date.now();

    cleanupRateStore(now);
    const rate = consumeRate(ip, now);

    if (rate.count > RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({
        ok: false,
        error: 'Too many requests. Please try again shortly.'
      });
    }

    const {
      locale = 'en',
      name = '',
      email = '',
      phone = '',
      interest = '',
      message = '',
      page = '',
      company = '',     // honeypot
      website = '',     // honeypot
      formStartedAt = '' // time trap
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
      formStartedAt: clean(formStartedAt)
    };

    // Honeypot: bot preenche campos invisíveis
    if (payload.company || payload.website) {
      return res.status(200).json({ ok: true });
    }

    // Time trap: bot enviou rápido demais
const startedAt = Number(payload.formStartedAt);

if (!Number.isFinite(startedAt) || startedAt <= 0) {
  console.log('CONTACT DEBUG: missing or invalid formStartedAt', {
    formStartedAt: payload.formStartedAt
  });
} else {
  const elapsed = now - startedAt;

  if (elapsed < 2500) {
    console.log('CONTACT DEBUG: blocked by time trap', { elapsed });
    return res.status(200).json({ ok: true });
  }
}
    if (!payload.name || !payload.email || !payload.interest || !payload.message) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields'
      });
    }

    if (payload.name.length > 120) {
      return res.status(400).json({ ok: false, error: 'Invalid name length' });
    }

    if (payload.email.length > 160) {
      return res.status(400).json({ ok: false, error: 'Invalid email length' });
    }

    if (payload.phone.length > 40) {
      return res.status(400).json({ ok: false, error: 'Invalid phone length' });
    }

    if (payload.interest.length > 120) {
      return res.status(400).json({ ok: false, error: 'Invalid interest length' });
    }

    if (payload.message.length < 10 || payload.message.length > 4000) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid message length'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid email'
      });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL || 'homes@casasdavila.com';
    const fromEmail =
      process.env.CONTACT_FROM_EMAIL || 'Casas da Vila Homes <onboarding@resend.dev>';

    if (!resendApiKey) {
      return res.status(500).json({
        ok: false,
        error: 'Missing RESEND_API_KEY'
      });
    }

    const subject =
      payload.locale === 'pt'
        ? `Casas da Vila Homes | Novo contato privado: ${payload.interest}`
        : `Casas da Vila Homes | New private inquiry: ${payload.interest}`;

    const submittedAt = new Date(now).toLocaleString(
      payload.locale === 'pt' ? 'pt-BR' : 'en-US',
      { dateStyle: 'medium', timeStyle: 'short' }
    );

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif; color:#1d1d1d; line-height:1.6;">
        <h2 style="margin:0 0 18px;">Casas da Vila Homes</h2>
        <p style="margin:0 0 18px;">
          ${payload.locale === 'pt' ? 'Novo contato recebido pelo site.' : 'New contact received through the website.'}
        </p>

        <table cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:720px; border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0; border-bottom:1px solid #e8e2d8; width:180px;"><strong>${payload.locale === 'pt' ? 'Nome' : 'Name'}</strong></td>
            <td style="padding:10px 0; border-bottom:1px solid #e8e2d8;">${escapeHtml(payload.name)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; border-bottom:1px solid #e8e2d8;"><strong>Email</strong></td>
            <td style="padding:10px 0; border-bottom:1px solid #e8e2d8;">${escapeHtml(payload.email)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; border-bottom:1px solid #e8e2d8;"><strong>${payload.locale === 'pt' ? 'Telefone' : 'Phone'}</strong></td>
            <td style="padding:10px 0; border-bottom:1px solid #e8e2d8;">${escapeHtml(payload.phone || '—')}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; border-bottom:1px solid #e8e2d8;"><strong>${payload.locale === 'pt' ? 'Interesse' : 'Interest'}</strong></td>
            <td style="padding:10px 0; border-bottom:1px solid #e8e2d8;">${escapeHtml(payload.interest)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; border-bottom:1px solid #e8e2d8;"><strong>${payload.locale === 'pt' ? 'Página' : 'Page'}</strong></td>
            <td style="padding:10px 0; border-bottom:1px solid #e8e2d8;">${escapeHtml(payload.page || '—')}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; border-bottom:1px solid #e8e2d8;"><strong>${payload.locale === 'pt' ? 'IP' : 'IP'}</strong></td>
            <td style="padding:10px 0; border-bottom:1px solid #e8e2d8;">${escapeHtml(ip || 'unknown')}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; border-bottom:1px solid #e8e2d8;"><strong>${payload.locale === 'pt' ? 'Enviado em' : 'Submitted at'}</strong></td>
            <td style="padding:10px 0; border-bottom:1px solid #e8e2d8;">${escapeHtml(submittedAt)}</td>
          </tr>
          <tr>
            <td style="padding:14px 0 10px; vertical-align:top;"><strong>${payload.locale === 'pt' ? 'Mensagem' : 'Message'}</strong></td>
            <td style="padding:14px 0 10px;">${escapeHtml(payload.message).replace(/\n/g, '<br>')}</td>
          </tr>
        </table>
      </div>
    `;

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
      return res.status(500).json({
        ok: false,
        error: resendData?.message || 'Email sending failed'
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'Unexpected server error'
    });
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getClientIp(req) {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string' && xForwardedFor.length) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = req.headers['x-real-ip'];
  if (typeof xRealIp === 'string' && xRealIp.length) {
    return xRealIp.trim();
  }

  return req.socket?.remoteAddress || 'unknown';
}

function cleanupRateStore(now) {
  for (const [key, value] of rateStore.entries()) {
    if (now - value.firstSeen > RATE_LIMIT_WINDOW_MS) {
      rateStore.delete(key);
    }
  }
}

function consumeRate(ip, now) {
  const existing = rateStore.get(ip);

  if (!existing) {
    const value = { count: 1, firstSeen: now };
    rateStore.set(ip, value);
    return value;
  }

  if (now - existing.firstSeen > RATE_LIMIT_WINDOW_MS) {
    const value = { count: 1, firstSeen: now };
    rateStore.set(ip, value);
    return value;
  }

  existing.count += 1;
  return existing;
}