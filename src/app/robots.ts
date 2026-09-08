import type { MetadataRoute } from 'next';
import { SITE } from '@/data/seo';

/**
 * Everything here is public and indexable: one page, no gated routes, no user data.
 *
 * AI crawlers are deliberately NOT blocked. This is an original concept project
 * whose whole argument is that it labels its own uncertainty, and there is no
 * commercial content to protect. That is a product decision rather than a
 * default, so it is written down here rather than left implicit.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
