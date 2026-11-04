import { MetadataRoute } from 'next';
import { SITE_URL } from './metadata';
import { SITE } from '@/config/site';

/**
 * CRM route segments — kept in Disallow for one release after admin removal
 * so crawlers stop requesting dead URLs. Remove after 2026-09-20.
 */
const ADMIN_PATHS = [
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
  'projects',
  'clients',
  'admin',
];

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
const PRIVATE_PATHS = [
  '/api/',
  '/lenaqar',
  '/match/',
  '/network/signup',
  '/network/login',
  '/network/pending',
  '/internal/',
];

function buildDisallow(): string[] {
  // Prefix match: `/units` already covers `/units` and everything beneath it,
  // so no `/*` twin is needed. No public route shares a prefix with these.
  const rules = new Set<string>(PRIVATE_PATHS);
  for (const path of ADMIN_PATHS) {
    rules.add(`/${path}`);
    // Same segment behind the client-id prefix the rewrites create.
    rules.add(`/*/${path}`);
  }
  return [...rules];
}

/**
 * Answer-engine and AI-search crawlers. These are granted the same access as
 * Googlebot rather than the blanket block a CDN turns on by default: LenaQar's
 * guides and listing data are meant to be quotable in AI answers.
 */
const AI_CRAWLERS = [
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

export default function robots(): MetadataRoute.Robots {
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
  ];
  if (SITE.feed.enabled) {
    allow.push('/opportunities', '/opportunities/*');
  }

  const disallow = buildDisallow();

  return {
    rules: [
      { userAgent: '*', allow, disallow },
      // Explicit, so a later blanket edit cannot silently drop AI access.
      { userAgent: AI_CRAWLERS, allow, disallow },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`],
  };
}
