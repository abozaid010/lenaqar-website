import { MetadataRoute } from 'next';
import { SITE_URL } from './metadata';
import { SITE } from '@/config/site';

/**
 * CRM route segments. Kept in sync with the `adminPaths` rewrite list in
 * next.config.mjs — that rewrite maps `/:clientId/<segment>` onto `/<segment>`,
 * so every one of these is reachable under a client-id prefix as well as at the
 * root. Disallowing only the root form leaves `/homey/units/ABC` crawlable.
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

/** Non-CRM routes that must stay out of the index: internals, legacy, private links. */
const PRIVATE_PATHS = [
  '/api/',
  '/_next/',
  '/lenaqar',
  '/login',
  '/allProberties',
  '/allProberties/',
  '/match/',
  '/properties/',
  '/property/',
  '/unit/',
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
  const allow = ['/', '/sell', '/calculator', '/privacy'];
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
