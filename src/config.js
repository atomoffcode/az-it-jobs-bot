import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

export const config = {
  telegramBotToken: required('TELEGRAM_BOT_TOKEN'),
  telegramChatId: required('TELEGRAM_CHAT_ID'),
  birjobApiKey: required('BIRJOB_API_KEY'),
  pollIntervalMinutes: Number(process.env.POLL_INTERVAL_MINUTES || 60),
  maxPages: Number(process.env.MAX_PAGES || 3),
  postedWithin: process.env.POSTED_WITHIN || '24h',
};
