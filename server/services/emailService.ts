// Email is handled entirely by Firebase Authentication (sendEmailVerification,
// sendPasswordResetEmail). No custom email sending is needed.
// This file is kept as a no-op so any remaining imports don't break the build.

export async function sendOtpEmail(
  _email: string,
  _otp: string,
  _type: "email_verify" | "password_reset"
): Promise<{ devOtp?: string }> {
  return {};
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
