// =============================================================
// Envio de e-mail — código OTP de recuperação de senha
//
// MODO DEV (padrão): se nenhuma credencial estiver no .env, o código
// é impresso no console do backend. Útil para desenvolver/testar sem
// depender de provedor de e-mail.
//
// MODO REAL: defina no .env do backend:
//   RESEND_API_KEY=re_xxx          (https://resend.com — grátis 100/dia)
//   RESEND_FROM="Acessecidade <onboarding@resend.dev>"
// e o envio passa a ser feito de verdade, sem precisar instalar nada
// (usa a API REST do Resend via fetch).
// =============================================================

const EXP_MIN = 10;

export async function sendPasswordResetCode(email, code) {
  const subject = 'Seu código de recuperação de senha';
  const text =
    `Seu código de recuperação é: ${code}\n\n` +
    `Ele expira em ${EXP_MIN} minutos. Se você não pediu isso, ignore este e-mail.`;
  const html =
    `<p>Seu código de recuperação é:</p>` +
    `<p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>` +
    `<p>Ele expira em ${EXP_MIN} minutos. Se você não pediu isso, ignore este e-mail.</p>`;

  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? 'Acessecidade <onboarding@resend.dev>',
        to: email,
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Falha ao enviar e-mail: ${res.status} ${detail}`);
    }
    return;
  }

  // ---- MODO DEV: sem provedor configurado, imprime no console ----
  console.log(
    `\n┌─────────────────────────────────────────────\n` +
      `│ [mailer:DEV] Código de recuperação\n` +
      `│ Para:   ${email}\n` +
      `│ Código: ${code}\n` +
      `│ Expira: em ${EXP_MIN} minutos\n` +
      `└─────────────────────────────────────────────\n`
  );
}
