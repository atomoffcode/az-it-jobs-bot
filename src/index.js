import { config } from './config.js';
import { fetchRecentJobs } from './birjob.js';
import { filterRelevantJobs } from './filter.js';
import { filterUnseen, markSeen } from './store.js';
import { formatJobMessage, sendTelegramMessage } from './telegram.js';

async function runOnce() {
  console.log(`[${new Date().toISOString()}] Checking for new vacancies...`);

  const jobs = await fetchRecentJobs();
  console.log(`Fetched ${jobs.length} recent jobs`);

  const relevant = filterRelevantJobs(jobs);
  const unseenIds = new Set(filterUnseen(relevant.map((r) => r.job)).map((j) => j.id));
  const toNotify = relevant.filter(({ job }) => unseenIds.has(job.id));

  console.log(`${relevant.length} match keywords, ${toNotify.length} are new`);

  for (const { job, category } of toNotify) {
    try {
      await sendTelegramMessage(formatJobMessage(job, category));
      await new Promise((r) => setTimeout(r, 500)); // gentle pacing to avoid Telegram flood limits
    } catch (err) {
      console.error(`Failed to send job ${job.id}:`, err.message);
    }
  }

  markSeen(toNotify.map(({ job }) => job));
  console.log(`Done. Sent ${toNotify.length} notification(s).`);
}

async function main() {
  const once = process.argv.includes('--once');

  // Fail the Cloud Run execution on error so broken runs are visible in the
  // console instead of counting as successes.
  await runOnce().catch((err) => {
    console.error('Run failed:', err.message);
    process.exitCode = 1;
  });

  if (once) return;

  const intervalMs = config.pollIntervalMinutes * 60 * 1000;
  console.log(`Polling every ${config.pollIntervalMinutes} minute(s). Press Ctrl+C to stop.`);
  setInterval(() => {
    runOnce().catch((err) => console.error('Run failed:', err.message));
  }, intervalMs);
}

main();
