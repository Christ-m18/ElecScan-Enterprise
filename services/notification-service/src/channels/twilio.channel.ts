const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_FROM;
const SMS_TO = process.env.ALARM_SMS_TO;
const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
const WHATSAPP_TO = process.env.ALARM_WHATSAPP_TO;

function twilioAvailable(): boolean {
  return Boolean(ACCOUNT_SID && AUTH_TOKEN && FROM_NUMBER);
}

async function twilioSend(to: string, from: string, body: string): Promise<void> {
  if (!ACCOUNT_SID || !AUTH_TOKEN) return;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  } catch {
    // Twilio unreachable — silent
  }
}

export async function sendSms(body: string): Promise<void> {
  if (!twilioAvailable() || !SMS_TO || !FROM_NUMBER) return;
  await twilioSend(SMS_TO, FROM_NUMBER, body);
}

export async function sendWhatsApp(body: string): Promise<void> {
  if (!twilioAvailable() || !WHATSAPP_TO || !WHATSAPP_FROM) return;
  await twilioSend(`whatsapp:${WHATSAPP_TO}`, `whatsapp:${WHATSAPP_FROM}`, body);
}
