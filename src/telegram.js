import { config } from './config.js';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatJobMessage(job, category) {
  const title = escapeHtml(job.title || 'Untitled role');
  const company = escapeHtml(job.company || 'Unknown company');
  const location = escapeHtml(job.location || 'Azerbaijan');
  const source = escapeHtml(job.source || '');
  const link = job.apply_link;

  return [
    `🆕 <b>${title}</b>`,
    `🏢 ${company}`,
    `📍 ${location}`,
    `🏷 ${category}`,
    source ? `🌐 Source: ${source}` : null,
    link ? `🔗 <a href="${link}">Apply</a>` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: config.telegramChatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Telegram API error ${res.status}: ${body}`);
  }
}
