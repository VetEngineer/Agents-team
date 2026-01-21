const slackWebhook = process.env.SLACK_WEBHOOK_URL;
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

export async function notifySlack(message: string) {
  if (!slackWebhook) return;
  await fetch(slackWebhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });
}

export async function notifyTelegram(message: string) {
  if (!telegramToken || !telegramChatId) return;
  await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: telegramChatId, text: message }),
  });
}
