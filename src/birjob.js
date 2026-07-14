import { config } from './config.js';

const BASE_URL = 'https://www.birjob.com/api/v1';

function extractJobs(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.jobs)) return payload.jobs;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

async function fetchPage(page) {
  const url = new URL(`${BASE_URL}/jobs`);
  url.searchParams.set('posted_within', config.postedWithin);
  url.searchParams.set('limit', '100');
  url.searchParams.set('page', String(page));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${config.birjobApiKey}` },
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('Retry-After') || 60);
    console.warn(`BirJob rate limited, waiting ${retryAfter}s before retrying page ${page}`);
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return fetchPage(page);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`BirJob API error ${res.status}: ${body}`);
  }

  return res.json();
}

// Fetches recently posted jobs across all ~91 aggregated AZ sources, paginating
// up to config.maxPages (100 jobs/page) to bound API quota usage per check.
export async function fetchRecentJobs() {
  const jobs = [];
  for (let page = 1; page <= config.maxPages; page++) {
    const payload = await fetchPage(page);
    const pageJobs = extractJobs(payload);
    jobs.push(...pageJobs);
    if (pageJobs.length < 100) break; // no more pages
  }
  return jobs;
}
