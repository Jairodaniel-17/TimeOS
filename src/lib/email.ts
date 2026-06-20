// Email service — graceful by design.
// - If RESEND_API_KEY is set, sends via the Resend HTTP API (no SDK/dep needed).
// - Otherwise (dev / no creds), logs the email and returns it so flows still work
//   (e.g. the password-reset route can surface the link in dev).
//
// To enable real delivery: set RESEND_API_KEY and EMAIL_FROM in the environment.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'TimeOS <onboarding@resend.dev>';

export interface EmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  sent: boolean;       // true if actually delivered via a provider
  provider: 'resend' | 'log';
  id?: string;
  error?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailInput): Promise<EmailResult> {
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: EMAIL_FROM, to, subject, html, text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { sent: false, provider: 'resend', error: err.message || `HTTP ${res.status}` };
      }
      const data = await res.json().catch(() => ({}));
      return { sent: true, provider: 'resend', id: data.id };
    } catch (e) {
      return { sent: false, provider: 'resend', error: e instanceof Error ? e.message : 'send failed' };
    }
  }

  // No provider configured — log (visible in server console) so dev flows work.
  console.log(`\n[email:log] to=${to} subject="${subject}"\n${text || html}\n`);
  return { sent: false, provider: 'log' };
}

// ── Templates ──────────────────────────────────────────────────────────────
const wrap = (title: string, body: string) => `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
    <h2 style="color:#227e9e;margin:0 0 16px">${title}</h2>
    ${body}
    <p style="margin-top:24px;font-size:12px;color:#888">TimeOS · Orvanta ERP</p>
  </div>`;

export function passwordResetEmail(name: string, link: string): EmailInput {
  return {
    to: '',
    subject: 'Restablece tu contraseña — TimeOS',
    text: `Hola ${name}, restablece tu contraseña aquí: ${link} (válido por 1 hora).`,
    html: wrap('Restablece tu contraseña', `
      <p>Hola ${name},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. El enlace vence en 1 hora.</p>
      <p><a href="${link}" style="display:inline-block;background:#227e9e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Restablecer contraseña</a></p>
      <p style="font-size:12px;color:#888">Si no fuiste tú, ignora este correo.</p>`),
  };
}

export function welcomeEmail(name: string, orgName: string): EmailInput {
  return {
    to: '',
    subject: '¡Bienvenido a TimeOS!',
    text: `Hola ${name}, tu organización "${orgName}" está lista en TimeOS.`,
    html: wrap('¡Bienvenido a TimeOS!', `
      <p>Hola ${name},</p>
      <p>Tu organización <strong>${orgName}</strong> ya está lista. Ya puedes invitar a tu equipo y registrar tiempos.</p>`),
  };
}

export function inviteEmail(inviterName: string, orgName: string, link: string): EmailInput {
  return {
    to: '',
    subject: `${inviterName} te invitó a ${orgName} en TimeOS`,
    text: `${inviterName} te invitó a unirte a ${orgName}: ${link}`,
    html: wrap('Te invitaron a TimeOS', `
      <p><strong>${inviterName}</strong> te invitó a unirte a <strong>${orgName}</strong>.</p>
      <p><a href="${link}" style="display:inline-block;background:#227e9e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Unirme</a></p>`),
  };
}
