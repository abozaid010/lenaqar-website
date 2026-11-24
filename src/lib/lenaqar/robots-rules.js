/**
 * robots.txt rules for the public site, as plain data so they can be tested
 * (src/lib/lenaqar/__tests__/robots-rules.test.js) without Next.
 */

/**
 * Retired CRM route segments, disallowed so crawlers stop requesting dead
 * URLs. A segment that is public again must not be listed here: `/projects`
 * was, and it blocked every developer-project page (PR #63 review).
 */
export const ADMIN_PATHS = [
  'dashboard',
  'campaigns',
  'campaign-chat',
  'schedule',
  'analytics',
  'units',
  'team',
  'myProjects',
  'developers',
  'news',
  'map',
  'notifications',
  'social-media',
  'market-index',
  'locations',
  'tools',
  'matching',
  'clients',
  'admin',
];

/**
 * Retired CRM segments that are now also a public top-level route. Only the
 * tenant-prefixed form (`/<client>/projects`) stays disallowed.
 */
export const ADMIN_PATHS_TENANT_ONLY = ['projects'];

/**
 * Non-CRM routes that must stay out of the index: internals, private links.
 *
 * Deliberately NOT disallowed:
 * - `/_next/` serves CSS/JS and every listing/guide photo (`/_next/image`).
 *   Blocking it hides all property images from image search and AI crawlers
 *   and stops Google from rendering the page as users see it.
 * - Legacy `/properties/`, `/property/`, `/unit/` answer 308 to
 *   `/opportunities/<code>` (or 404 when the unit is gone). Crawlers must be
 *   able to fetch them to follow the redirect and consolidate old links.
 */
export const PRIVATE_PATHS = [
  '/api/',
  '/lenaqar',
  '/match/',
  '/network/signup',
  '/network/login',
  '/network/pending',
  '/internal/',
];

/**
 * Answer-engine and AI-search crawlers. These are granted the same access as
 * Googlebot rather than the blanket block a CDN turns on by default: LenaQar's
 * guides and listing data are meant to be quotable in AI answers.
 */
export const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
  'Amazonbot',
  'CCBot',
  'Bytespider',
  'cohere-ai',
];

export function buildDisallow() {
  // Prefix match: `/units` already covers `/units` and everything beneath it,
  // so no `/*` twin is needed. No public route shares a prefix with these.
  const rules = new Set(PRIVATE_PATHS);
  for (const path of ADMIN_PATHS) {
    rules.add(`/${path}`);
    // Same segment behind the client-id prefix the rewrites create.
    rules.add(`/*/${path}`);
  }
  for (const path of ADMIN_PATHS_TENANT_ONLY) {
    rules.add(`/*/${path}`);
  }
  return [...rules];
}

export function buildAllow({ feedEnabled = true } = {}) {
  const allow = [
    '/',
    '/sell',
    '/calculator',
    '/privacy',
    '/how-it-works',
    '/no-calls',
    '/verified-prices',
    '/before-you-pay',
    '/delivery-delays',
    '/network',
    '/guides',
    '/guides/*',
    '/apartments-for-sale',
    '/apartments-for-sale/*',
    '/chalets-for-sale',
    '/chalets-for-sale/*',
    '/villas-for-sale',
    '/villas-for-sale/*',
    '/ready-to-move-properties',
    '/projects',
    '/projects/*',
  ];
  if (feedEnabled) {
    allow.push('/opportunities', '/opportunities/*');
  }
  return allow;
}
