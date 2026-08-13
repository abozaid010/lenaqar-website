import { MetadataRoute } from 'next';
import { SITE_URL } from './metadata';
import { IS_LENAQAR, SITE } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  if (IS_LENAQAR) {
    const allow = ['/', '/sell', '/calculator'];
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

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/allProberties',
          '/allProberties/*',
          '/privacy',
          '/for-brokers',
          '/for-developers',
          '/for-marketing-agencies',
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
          '/for-brokers',
          '/for-developers',
          '/for-marketing-agencies',
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
