import 'dotenv/config';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Set TELEGRAM_BOT_TOKEN in .env first.');
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const data = await res.json();

if (!data.ok) {
  console.error('Telegram API error:', data);
  process.exit(1);
}

if (!data.result.length) {
  console.log(
    'No messages found yet. Open your bot in Telegram, send it /start (or any message), then run this again.'
  );
  process.exit(0);
}

for (const update of data.result) {
  const chat = update.message?.chat || update.channel_post?.chat;
  if (chat) {
    console.log(`Chat ID: ${chat.id}  (${chat.type}, ${chat.first_name || chat.title || ''})`);
  }
}
