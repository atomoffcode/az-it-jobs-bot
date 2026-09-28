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

// Offensive-security roles (any level: full-time, internship, junior, etc. —
// the level words appear alongside these terms in titles, so matching the
// discipline term alone covers them all).
const RED_TEAM_PATTERNS = [
  /red\s?team/i,
  /penetration\s+test/i, // "penetration tester/testing"
  /\bpen[\s-]?test/i, // "pentest", "pen test", "pen-tester" (\b: not "Open Testing")
  /offensive\s+security/i,
  /ethical\s+hack/i, // "ethical hacker/hacking"
  /\bvapt\b/i, // vulnerability assessment & penetration testing
  /vulnerability\s+(assess|research)/i,
  /bug\s+bounty/i,
  /exploit\s+develop/i,
  /\boscp\b/i,
  /penetrasiya\s+test/i, // AZ: "penetration test"
  /sızma\s+test/i, // AZ/TR: "penetration (infiltration) test"
  /etik\s+hak/i, // AZ: "ethical hacker"
];

// Security governance, risk & compliance. Unambiguous GRC terms and frameworks
// match alone.
const GRC_OR_PATTERNS = [
  /\bgrc\b/i,
  /governance,?\s+risk/i, // "Governance, Risk and Compliance"
  /security\s+(compliance|governance|audit|risk)/i,
  /\biso\s?(\/?\s?iec\s?)?27001/i,
  /\bisms\b/i,
  /pci[\s-]?dss/i,
  /data\s+protection\s+officer/i,
  /\b(cisa|cism|crisc)\b/i, // GRC certifications
];

// "compliance", "risk", "audit", "governance" alone are mostly banking and
// finance roles, so they only count alongside an IT / infosec qualifier. Bare
// "təhlükəsizlik" is deliberately not a qualifier: it also means occupational
// and fire safety (HSE), which is common in AZ oil & gas postings.
const GRC_TERM = /compliance|governance|audit|\brisk|uyğunluq/i;
const GRC_AND_GROUPS = [
  [GRC_TERM, /\b(IT|İT)\b/], // case-sensitive to avoid matching "it" (pronoun)
  [GRC_TERM, /information\s+security|cyber|informasiya\s+təhlükəsizl|kiber\s?təhlükəsizl/i],
];

export function categorize(job) {
  const haystack = `${job.title || ''} ${job.job_function || ''}`;

  if (HELPDESK_PATTERNS.some((re) => re.test(haystack))) return 'Helpdesk';

  // Red team first: titles like "Offensive Security Engineer" also contain
  // blue-team OR patterns ("security engineer") and would misclassify.
  if (RED_TEAM_PATTERNS.some((re) => re.test(haystack))) {
    return 'Cyber Security (Red Team)';
  }

  // GRC before blue team: "Information Security Compliance Officer" also
  // matches the blue-team pattern "information security".
  if (
    GRC_OR_PATTERNS.some((re) => re.test(haystack)) ||
    GRC_AND_GROUPS.some((group) => group.every((re) => re.test(haystack)))
  ) {
    return 'Cyber Security (GRC)';
  }

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
