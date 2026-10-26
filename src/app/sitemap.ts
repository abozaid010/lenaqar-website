import { MetadataRoute } from 'next';
import { SITE_URL } from './metadata';
import { SITE } from '@/config/site';
import { fetchOpportunities } from '@/lib/lenaqar/opportunities.server';
import { BUYER_LANDINGS } from '@/lib/lenaqar/buyer-landings';
import { getGuidesForSitemap } from '@/lib/guides/load';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/how-it-works`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/opportunities`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/guides`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/sell`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/calculator`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/network`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  for (const landing of BUYER_LANDINGS) {
    staticPages.push({
      url: `${SITE_URL}${landing.href}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    });
  }

  // Published / auto-published guides only (drafts excluded by loader).
  for (const guide of getGuidesForSitemap()) {
    staticPages.push({
      url: `${SITE_URL}${guide.slug.replace(/\/$/, '')}`,
      lastModified: guide.lastModified ? new Date(guide.lastModified) : now,
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
    const unitPages: MetadataRoute.Sitemap = units.map((unit) => ({
      url: `${SITE_URL}/opportunities/${encodeURIComponent(unit.code)}`,
      lastModified: unit.updatedAt ? new Date(unit.updatedAt) : now,
      changeFrequency: 'daily',
      priority: 0.6,
    }));
    return [...staticPages, ...unitPages];
  } catch (error) {
    console.error("[lenaqar] sitemap units fetch failed", error);
    return staticPages;
  }
}
