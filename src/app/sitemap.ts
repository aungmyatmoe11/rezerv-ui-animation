import type { MetadataRoute } from 'next';
import { SITE } from '@/data/seo';

/**
 * Sitemap includes the main concept page plus supporting professional pages
 * (privacy, cookies, terms). In-page anchors are not listed: they are not
 * separate documents, and a sitemap of fragments would be duplicated signal.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastMod = new Date(SITE.modified);

  return [
    {
      url: SITE.url,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE.url}/privacy`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE.url}/cookies`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE.url}/terms`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
