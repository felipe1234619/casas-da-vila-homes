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
      page = ''
    } = req.body || {};

    const clean = (value) => String(value || '').trim();

    const payload = {
      locale: clean(locale),
      name: clean(name),
      email: clean(email),
      phone: clean(phone),
      interest: clean(interest),
      message: clean(message),
      page: clean(page)
    };

    console.log('CONTACT PAYLOAD', {
      locale: payload.locale,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      interest: payload.interest,
      page: payload.page,
      messageLength: payload.message.length
    });

    if (!payload.name || !payload.email || !payload.interest || !payload.message) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid email'
      });
    }

    if (payload.message.length < 5) {
      return res.status(400).json({
        ok: false,
        error: 'Message too short'
      });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL || 'homes@casasdavila.com';
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev';

    if (!resendApiKey) {
      console.error('CONTACT ERROR: missing RESEND_API_KEY');
      return res.status(500).json({
        ok: false,
        error: 'Missing RESEND_API_KEY'
      });
    }

    const subject =
      payload.locale === 'pt'
        ? `Casas da Vila Homes | Novo contato privado: ${payload.interest}`
        : `Casas da Vila Homes | New private inquiry: ${payload.interest}`;

    const submittedAt = new Date().toLocaleString(
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
    console.log('RESEND RESPONSE', resendData);

    if (!resendResponse.ok) {
      console.error('CONTACT ERROR: resend failed', resendData);
      return res.status(500).json({
        ok: false,
        error: resendData?.message || 'Email sending failed'
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('CONTACT ERROR: unexpected', error);
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