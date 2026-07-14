// Keyword patterns per target category. Matched against job title + job_function.
const KEYWORD_GROUPS = {
  Helpdesk: [
    /help[\s-]?desk/i,
    /it\s+support/i,
    /technical\s+support/i,
    /service\s?desk/i,
    /desktop\s+support/i,
  ],
  'Cyber Security (Blue Team)': [
    /cyber\s?security/i,
    /blue\s?team/i,
    /soc\s+analyst/i,
    /security\s+operations/i,
    /information\s+security/i,
    /security\s+analyst/i,
    /security\s+engineer/i,
    /incident\s+response/i,
    /\bsiem\b/i,
    /threat\s+(detection|hunting|intel)/i,
  ],
};

export function categorize(job) {
  const haystack = `${job.title || ''} ${job.job_function || ''}`;
  for (const [category, patterns] of Object.entries(KEYWORD_GROUPS)) {
    if (patterns.some((re) => re.test(haystack))) return category;
  }
  return null;
}

export function filterRelevantJobs(jobs) {
  return jobs
    .map((job) => ({ job, category: categorize(job) }))
    .filter(({ category }) => category !== null);
}
