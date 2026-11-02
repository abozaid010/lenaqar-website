import { MetadataRoute } from 'next';
import { SITE_URL } from './metadata';
import { SITE } from '@/config/site';
import { fetchOpportunities } from '@/lib/lenaqar/opportunities.server';
import { BUYER_LANDINGS } from '@/lib/lenaqar/buyer-landings';
import { getGuidesForSitemap } from '@/lib/guides/load';
import { isOpportunityIndexable } from '@/lib/lenaqar/unit-trust';

/** Stable lastmod for evergreen marketing pages (not build time). */
const STATIC_LASTMOD = new Date('2026-11-02T00:00:00.000Z');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: STATIC_LASTMOD,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/how-it-works`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/opportunities`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/guides`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/sell`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/calculator`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/network`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  for (const landing of BUYER_LANDINGS) {
    staticPages.push({
      url: `${SITE_URL}${landing.href}`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: 'weekly',
      priority: 0.85,
    });
  }

  // Indexable guides only (VERIFY/مسودة / seo_index:false excluded).
  for (const guide of getGuidesForSitemap()) {
    staticPages.push({
      url: `${SITE_URL}${guide.slug.replace(/\/$/, '')}`,
      lastModified: guide.lastModified
        ? new Date(guide.lastModified)
        : STATIC_LASTMOD,
      changeFrequency: 'weekly',
      priority: 0.75,
    });
  }

  if (!SITE.feed.enabled) {
    return staticPages.filter(
      (entry) => !entry.url.includes('/opportunities'),
    );
  }

  try {
    const units = await fetchOpportunities();
    const unitPages: MetadataRoute.Sitemap = units
      .filter((unit) => isOpportunityIndexable(unit))
      .map((unit) => ({
        url: `${SITE_URL}/opportunities/${encodeURIComponent(unit.code)}`,
        lastModified: unit.updatedAt ? new Date(unit.updatedAt) : STATIC_LASTMOD,
        changeFrequency: 'daily' as const,
        priority: 0.6,
      }));
    return [...staticPages, ...unitPages];
  } catch (error) {
    console.error("[lenaqar] sitemap units fetch failed", error);
    return staticPages;
  }
}
