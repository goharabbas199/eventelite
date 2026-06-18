import nodemailer from "nodemailer";

const smtpConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

let transporter: nodemailer.Transporter | null = null;

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function otpEmailHtml(otp: string, type: "email_verify" | "password_reset") {
  const isVerify = type === "email_verify";
  const title = isVerify ? "Verify your email address" : "Reset your password";
  const body = isVerify
    ? "Enter the code below to verify your EventElite account:"
    : "Enter the code below to reset your EventElite password:";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f5f8; margin: 0; padding: 40px 20px; }
  .card { background: #fff; border-radius: 16px; max-width: 420px; margin: 0 auto; padding: 40px 32px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
  .logo { font-size: 18px; font-weight: 800; color: #4f46e5; margin-bottom: 28px; }
  h2 { font-size: 20px; font-weight: 700; color: #111; margin: 0 0 8px; }
  p { font-size: 14px; color: #64748b; margin: 0 0 24px; line-height: 1.6; }
  .otp { display: block; text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; background: #f0f0ff; border-radius: 12px; padding: 18px 24px; margin: 0 0 24px; }
  .expiry { font-size: 12px; color: #94a3b8; text-align: center; }
  .footer { font-size: 11px; color: #cbd5e1; text-align: center; margin-top: 32px; }
</style></head>
<body>
  <div class="card">
    <div class="logo">⚡ EventElite</div>
    <h2>${title}</h2>
    <p>${body}</p>
    <span class="otp">${otp}</span>
    <p class="expiry">This code expires in 10 minutes. Do not share it with anyone.</p>
    <div class="footer">If you didn't request this, you can safely ignore this email.</div>
  </div>
</body>
</html>`;
}

export async function sendOtpEmail(
  email: string,
  otp: string,
  type: "email_verify" | "password_reset"
): Promise<{ devOtp?: string }> {
  const subject =
    type === "email_verify"
      ? "Your EventElite verification code"
      : "Your EventElite password reset code";

  if (smtpConfigured && transporter) {
    await transporter.sendMail({
      from: `"EventElite" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: otpEmailHtml(otp, type),
    });
    return {};
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`[EventElite Auth] OTP for ${email} (${type}): ${otp}`);
  console.log(
    `[EventElite Auth] Set SMTP_HOST/SMTP_USER/SMTP_PASS to send real emails`
  );
  console.log(`${"=".repeat(50)}\n`);

  return { devOtp: otp };
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
