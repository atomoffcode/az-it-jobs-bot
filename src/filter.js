// Keyword patterns per target category. Matched against job title + job_function.
// Includes both English and Azerbaijani terms, since most postings on AZ boards
// (Glorri, CareerA, etc.) are in Azerbaijani.

const HELPDESK_PATTERNS = [
  /help[\s-]?desk/i,
  /it\s+support/i,
  /technical\s+support/i,
  /service\s?desk/i,
  /desktop\s+support/i,
  /texniki\s+dəstək/i, // "technical support"
  /\b(IT|İT)\b.*dəstək/, // "IT ... support" — case-sensitive to avoid matching "it" (dog)
  /dəstək.*\b(IT|İT)\b/,
];

// Unambiguous single patterns — a match on any of these alone is enough.
const SECURITY_OR_PATTERNS = [
  /cyber\s?security/i,
  /blue\s?team/i,
  /soc\s+analy/i,
  /security\s+operations/i,
  /information\s+security/i,
  /security\s+analyst/i,
  /security\s+engineer/i,
  /incident\s+response/i,
  /\bsiem\b/i,
  /threat\s+(detection|hunting|intel)/i,
  /kiber\s?təhlükəsizl/i, // "cyber security"
  /informasiya\s+təhlükəsizl/i, // "information security"
];

// "təhlükəsizlik" (security) alone is too broad (physical security, guards,
// safety) so it only counts combined with a security-operations-ish qualifier,
// in either word order.
const SECURITY_AND_GROUPS = [
  [/təhlükəsizl/i, /əməliyyat/i], // "security operations"
  [/təhlükəsizl/i, /analitik/i], // "security analyst"
];

export function categorize(job) {
  const haystack = `${job.title || ''} ${job.job_function || ''}`;

  if (HELPDESK_PATTERNS.some((re) => re.test(haystack))) return 'Helpdesk';

  if (SECURITY_OR_PATTERNS.some((re) => re.test(haystack))) {
    return 'Cyber Security (Blue Team)';
  }
  if (SECURITY_AND_GROUPS.some((group) => group.every((re) => re.test(haystack)))) {
    return 'Cyber Security (Blue Team)';
  }

  return null;
}

export function filterRelevantJobs(jobs) {
  return jobs
    .map((job) => ({ job, category: categorize(job) }))
    .filter(({ category }) => category !== null);
}
