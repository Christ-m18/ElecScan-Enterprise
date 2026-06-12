import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? 'ElecScan <noreply@elecscan.io>';
const SMTP_TO = process.env.ALARM_EMAIL_TO;

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_TO) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendEmail(subject: string, html: string): Promise<void> {
  const t = getTransporter();
  if (!t || !SMTP_TO) return;
  try {
    await t.sendMail({ from: SMTP_FROM, to: SMTP_TO, subject, html });
  } catch {
    // SMTP unavailable — silent
  }
}
