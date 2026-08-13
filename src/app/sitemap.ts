import { MetadataRoute } from 'next';
import { SITE_URL } from './metadata';
import { API_BASE_URL, PUBLIC_X_API_KEY } from '@/lib/apiConfig';
import { SEO_BLOG_POST_KEY_TO_SLUG } from '@/content/seo';
import { IS_LENAQAR, SITE } from '@/config/site';
import { fetchOpportunities } from '@/lib/lenaqar/opportunities.server';

const CHAT_URL = 'https://chat.lenaai.net';
const MAIN_SITE_URL = SITE_URL;

// Server-side function to fetch public units/properties
// These are the properties that the AI agent talks about, recommends, shows master plans and payment plans for
async function getPublicUnits() {
  try {
    const headers: HeadersInit = { accept: 'application/json' };
    if (PUBLIC_X_API_KEY) {
      headers['X-API-Key'] = PUBLIC_X_API_KEY;
    }

    const response = await fetch(
      `${API_BASE_URL}/public/units?limit=1000`,
      {
        headers,
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );
    if (!response.ok) return [];
    const data = await response.json();
    const units = data?.data?.units || data?.units || [];
    return Array.isArray(units) ? units : [];
  } catch (error) {
    console.error('Error fetching units for sitemap:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  if (IS_LENAQAR) {
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
    ];

    staticPages.push({
      url: `${SITE_URL}/opportunities`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    });

    if (!SITE.feed.enabled) return staticPages;

    const units = await fetchOpportunities();
    const unitPages: MetadataRoute.Sitemap = units.map((unit) => ({
      url: `${SITE_URL}/opportunities/${encodeURIComponent(unit.code)}`,
      lastModified: unit.updatedAt ? new Date(unit.updatedAt) : now,
      changeFrequency: 'daily',
      priority: 0.6,
    }));

    return [...staticPages, ...unitPages];
  }

  // Fetch dynamic data for properties/units
  const units = await getPublicUnits();

  // Static pages with high priority
  // These represent the core value proposition: "ChatGPT for real estate - AI Sales Agent"
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: MAIN_SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${MAIN_SITE_URL}/allProberties`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${MAIN_SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${MAIN_SITE_URL}/for-brokers`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${MAIN_SITE_URL}/for-developers`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${MAIN_SITE_URL}/for-marketing-agencies`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${MAIN_SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${MAIN_SITE_URL}/faq`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...Object.values(SEO_BLOG_POST_KEY_TO_SLUG).map((slug) => ({
      url: `${MAIN_SITE_URL}/blog/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.65,
    })),
    {
      url: CHAT_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Dynamic unit/property pages
  // These are the properties that the AI agent recommends, shows master plans, payment plans for
  // Limited to 5000 most recent/important units to keep sitemap manageable
  const unitPages: MetadataRoute.Sitemap = units
    .filter((unit: any) => unit?.code?.trim())
    .slice(0, 5000)
    .map((unit: any) => {
      const code = encodeURIComponent(String(unit.code).trim());
      const listingClientId =
        (unit?.clientId != null && String(unit.clientId).trim()) ||
        (unit?.client_id != null && String(unit.client_id).trim()) ||
        null;
      const path = listingClientId
        ? `/${listingClientId}/units/${code}`
        : `/allProberties/${code}`;
      return {
        url: `${MAIN_SITE_URL}${path}`,
        lastModified: unit.updatedAt
          ? new Date(unit.updatedAt)
          : unit.createdAt
            ? new Date(unit.createdAt)
            : now,
        changeFrequency: 'daily' as const,
        priority: 0.6,
      };
    });

  return [
    ...staticPages,
    ...unitPages,
  ];
}

