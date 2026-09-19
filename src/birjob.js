// BirJob retired its authenticated v1 API (HTTP 410 since 2026-07-31). The
// replacement is a single public endpoint returning the 50 most recent active
// listings as JSON — no API key, 10-minute edge cache.
const JOBS_URL = 'https://www.birjob.com/api/llm/jobs';

// Normalize to the shape the rest of the bot expects (id for dedup in
// store.js, apply_link for telegram.js). The canonical job slug from
// apply_url (e.g. "qalan-az-8421480") serves as a stable id.
function normalize(job) {
  const slug = (job.apply_url || '').match(/\/jobs\/([^/?#]+)/)?.[1];
  return {
    id: slug || `${job.title}|${job.company}|${job.posted_at}`,
    title: job.title,
    company: job.company,
    location: job.location,
    source: job.source,
    posted_at: job.posted_at,
    apply_link: job.apply_url,
  };
}

export async function fetchRecentJobs() {
  const res = await fetch(JOBS_URL, { headers: { Accept: 'application/json' } });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`BirJob API error ${res.status}: ${body}`);
  }

  const payload = await res.json();
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  return jobs.map(normalize);
}
