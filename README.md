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

This is a long-lived Node process — pick one:

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

Edit the `KEYWORD_GROUPS` patterns in [src/filter.js](src/filter.js) to add,
remove, or broaden the terms matched against job titles (e.g. add `network
security`, `penetration test`, `SOC 2` variants, etc.).

## Notes

- Seen job IDs are stored locally in `data/seen.json` so you don't get
  re-notified about the same posting across polls. Safe to delete if you want
  a fresh backfill.
- BirJob's scrapers run ~3x/day (Baku time), so hourly polling is more than
  enough to catch new postings promptly.
