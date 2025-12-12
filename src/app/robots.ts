import { MetadataRoute } from 'next';
import { SITE_URL } from './metadata';

export default function robots(): MetadataRoute.Robots {
  const CHAT_URL = 'https://chat.lenaai.net';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/allProberties',
          '/allProberties/*',
          '/privacy',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/dashboard/*',
          '/units/',
          '/units/*',
          '/developers/',
          '/developers/*',
          '/projects/',
          '/projects/*',
          '/myProjects/',
          '/team/',
          '/analytics/',
          '/schedule/',
          '/login/',
          '/_next/',
          '/admin/',
          '/*/admin/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/allProberties',
          '/allProberties/*',
          '/privacy',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/dashboard/*',
          '/units/',
          '/units/*',
          '/developers/',
          '/developers/*',
          '/projects/',
          '/projects/*',
          '/myProjects/',
          '/team/',
          '/analytics/',
          '/schedule/',
          '/login/',
          '/_next/',
          '/admin/',
        ],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
    ],
  };
}

