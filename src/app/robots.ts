import { MetadataRoute } from 'next';
import { SITE_URL } from './metadata';
import { SITE } from '@/config/site';
import {
  AI_CRAWLERS,
  buildAllow,
  buildDisallow,
} from '@/lib/lenaqar/robots-rules';

export default function robots(): MetadataRoute.Robots {
  const allow = buildAllow({ feedEnabled: SITE.feed.enabled });
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
