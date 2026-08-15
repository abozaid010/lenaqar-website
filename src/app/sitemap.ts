import { MetadataRoute } from 'next';
import { SITE_URL } from './metadata';
import { SITE } from '@/config/site';
import { fetchOpportunities } from '@/lib/lenaqar/opportunities.server';

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
      url: `${SITE_URL}/sell`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/calculator`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/opportunities`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  if (!SITE.feed.enabled) return staticPages;

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
