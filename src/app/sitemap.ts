import { MetadataRoute } from 'next';
import { SITE_URL } from './metadata';
import { API_BASE_URL } from '@/lib/apiConfig';

const CHAT_URL = 'https://chat.lenaai.net';
const MAIN_SITE_URL = SITE_URL;

// Server-side function to fetch public units/properties
// These are the properties that the AI agent talks about, recommends, shows master plans and payment plans for
async function getPublicUnits() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/public/units?limit=1000`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );
    if (!response.ok) return [];
    const data = await response.json();
    const units = data?.data?.units || data?.units || [];
    return Array.isArray(units) ? units : [];
  } catch (error) {
    console.error('Error fetching units for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

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
      url: CHAT_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Dynamic unit/property pages
  // These are the properties that the AI agent recommends, shows master plans, payment plans for
  // Limited to 5000 most recent/important units to keep sitemap manageable
  const unitPages: MetadataRoute.Sitemap = units.slice(0, 5000).map((unit: any) => ({
    url: `${MAIN_SITE_URL}/allProberties/${unit.id || unit.unitId}`,
    lastModified: unit.updatedAt
      ? new Date(unit.updatedAt)
      : unit.createdAt
        ? new Date(unit.createdAt)
        : now,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...unitPages,
  ];
}

