# az-it-jobs-bot

Telegram bot that alerts you when a new **Helpdesk** or **Cyber Security (Blue Team)**
IT vacancy appears in Azerbaijan. It polls the [BirJob](https://www.birjob.com) API,
which aggregates ~91 Azerbaijani job sites (boss.az, hellojob.az, glorri.az,
jobsearch.az, ejob.az, and more) into a single feed, filters listings by keyword,
and pushes new matches to your Telegram chat.

LinkedIn is intentionally not included — it has no official API/RSS for job search,
and scraping it violates its ToS. BirJob's aggregation already covers the local
market comprehensively.

## Setup

### 1. Install dependencies

```
npm install
```

### 2. Create a Telegram bot

1. Open Telegram, message [@BotFather](https://t.me/BotFather).
2. Send `/newbot` and follow the prompts.
3. Copy the token it gives you (looks like `123456789:AA...`).

### 3. Get your chat ID

1. Copy `.env.example` to `.env` and paste in your `TELEGRAM_BOT_TOKEN`.
2. In Telegram, open your new bot and send it any message (e.g. `/start`).
3. Run:

   ```
   npm run get-chat-id
   ```

4. Copy the printed `Chat ID` into `TELEGRAM_CHAT_ID` in `.env`.

### 4. Get a BirJob API key

1. Sign up at https://www.birjob.com/developers/keys.
2. Copy the generated key into `BIRJOB_API_KEY` in `.env` (shown only once).

### 5. Run it

```
npm run once    # single check, good for testing
npm start        # runs forever, checks every POLL_INTERVAL_MINUTES (default 60)
```

The first run will backfill anything posted in the last 24h that matches, so
expect a batch of messages the first time you run it. After that you'll only
get notified about genuinely new postings.

## Keeping it running

**Deployed:** this bot runs as a [Cloud Run Job](https://cloud.google.com/run/docs/create-jobs)
(`az-it-jobs-bot`, project `project-41a3b98d-9769-4076-bb0`, region `europe-west1`),
triggered hourly by a Cloud Scheduler job (`az-it-jobs-bot-hourly`, `0 * * * *` UTC).
Each execution runs `node src/index.js --once` in the container built from the
`Dockerfile`, with `data/` mounted to a GCS bucket
(`az-it-jobs-bot-data-424894387810`) via Cloud Storage FUSE so the seen-jobs
dedup state survives between runs (each execution otherwise gets a fresh,
ephemeral filesystem).

To redeploy after a code change:

```
gcloud run jobs deploy az-it-jobs-bot --source=. --region=europe-west1
```

(env vars and the volume mount are already baked into the job config, so a
redeploy only needs `--source`.)

For local development instead, pick one:

- **Simplest:** leave a terminal open with `npm start` running.
- **Windows Task Scheduler:** create a task that runs `npm run once` on a
  schedule (e.g. every hour) instead of using the built-in interval loop.
- **pm2** (`npm install -g pm2`): `pm2 start src/index.js --name az-jobs-bot`
  keeps it running in the background and restarts it on crash/reboot.

## Configuration (`.env`)

| Variable | Purpose | Default |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | required |
| `TELEGRAM_CHAT_ID` | Your chat ID | required |
| `BIRJOB_API_KEY` | BirJob API key | required |
| `POLL_INTERVAL_MINUTES` | Minutes between checks | `60` |
| `MAX_PAGES` | Pages of recent jobs scanned per check (100 jobs/page) | `3` |
| `POSTED_WITHIN` | BirJob recency filter: `24h` or `7d` | `24h` |

## Adjusting keywords

Most listings on Azerbaijani job boards are in Azerbaijani, not English, so
`src/filter.js` matches both languages. It's split into:

- `HELPDESK_PATTERNS` / `SECURITY_OR_PATTERNS` — single regexes, any match is
  enough (e.g. `cyber\s?security`, `kiber\s?təhlükəsizl`).
- `SECURITY_AND_GROUPS` — pairs of regexes that must **both** match, used for
  ambiguous Azerbaijani terms like bare `təhlükəsizlik` ("security"), which
  also shows up in unrelated physical-security/guard job titles. It only
  counts combined with a qualifier like `əməliyyat` (operations) or `analitik`
  (analyst).

Edit these lists to add, remove, or broaden matched terms.

## Notes

- Seen job IDs are stored in `data/seen.json` (a GCS-backed mount in
  production, a local file in dev) so you don't get re-notified about the
  same posting across runs.
- BirJob's scrapers run ~3x/day (Baku time), so hourly polling is more than
  enough to catch new postings promptly.
