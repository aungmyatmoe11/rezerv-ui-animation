import type { MetadataRoute } from 'next';
import { SITE } from '@/data/seo';

/**
 * One canonical, indexable URL. The in-page anchors are not listed: they are
 * not separate documents, and a sitemap of fragments of one page is exactly the
 * thin, duplicated signal a sitemap is supposed to avoid.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: new Date(SITE.modified),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
