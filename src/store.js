import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const SEEN_FILE = path.join(DATA_DIR, 'seen.json');
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // prune ids older than 14 days

function load() {
  if (!fs.existsSync(SEEN_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function save(map) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SEEN_FILE, JSON.stringify(map));
}

export function filterUnseen(jobs) {
  const seen = load();
  return jobs.filter((job) => !seen[job.id]);
}

export function markSeen(jobs) {
  const seen = load();
  const now = Date.now();
  for (const job of jobs) seen[job.id] = now;
  for (const [id, ts] of Object.entries(seen)) {
    if (now - ts > MAX_AGE_MS) delete seen[id];
  }
  save(seen);
}
