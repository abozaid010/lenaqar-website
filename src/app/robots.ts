import { MetadataRoute } from 'next';
import { SITE_URL } from './metadata';
import { SITE } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  const allow = ['/', '/sell', '/calculator', '/privacy'];
  if (SITE.feed.enabled) {
    allow.push('/opportunities', '/opportunities/*');
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow,
          disallow: [
            '/api/',
            '/lenaqar',
            '/allProberties',
            '/allProberties/',
            '/_next/',
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
          '/admin/',
          '/*/admin/',
        ],
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`],
  };
}
