/**
 * One source of truth for everything a crawler or a social card reads.
 *
 * The honesty rules that govern the visible page govern this file too. There is
 * no Product schema, no aggregateRating, no offers and no review markup, because
 * this site sells nothing and rates nothing — and because structured data that
 * describes a product Apple has not announced would be fabricated. What is
 * described instead is what the page actually is: an article of analysis by a
 * named author, plus the site itself.
 */

const FALLBACK_URL = 'https://rezerv-ui-animation.vercel.app';

/**
 * Set NEXT_PUBLIC_SITE_URL at build/deploy time to override. Canonical URLs,
 * Open Graph URLs and the sitemap all derive from it, so they cannot drift apart.
 * Defaults to the intended production origin (rezerv-ui-animation.vercel.app).
 */
export const SITE = {
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_URL).replace(/\/$/, ''),
  name: 'iPhone 18 Pro — The Rumor, Reconstructed',
  title: 'iPhone 18 Pro — The Rumor, Reconstructed',
  description:
    'An unofficial concept reconstruction of the rumoured iPhone 18 Pro and iPhone Ultra, ' +
    'built from public reporting and graded by how confident each claim actually is.',
  author: 'Independent concept project',
  ogImage: '/poster/hero.jpg',
  ogAlt:
    'Dark Cherry iPhone 18 Pro concept render resolving into an iPhone 18 Pro title card.',
  published: '2026-09-04',
  modified: '2026-09-04',
} as const;

export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: 'en-GB',
    publisher: { '@id': `${SITE.url}/#author` },
  };
}

export function articleJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${SITE.url}/#article`,
    isPartOf: { '@id': `${SITE.url}/#website` },
    headline: 'iPhone 18 Pro — The Rumor, Reconstructed',
    description: SITE.description,
    inLanguage: 'en-GB',
    datePublished: SITE.published,
    dateModified: SITE.modified,
    image: [`${SITE.url}${SITE.ogImage}`],
    author: {
      '@type': 'Organization',
      '@id': `${SITE.url}/#author`,
      name: SITE.author,
    },
    publisher: { '@id': `${SITE.url}/#author` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': SITE.url },
    // The single most important signal this page can send: it is analysis of
    // unconfirmed reporting, not an announcement.
    about: [
      { '@type': 'Thing', name: 'iPhone 18 Pro' },
      { '@type': 'Thing', name: 'iPhone Ultra' },
    ],
    disambiguatingDescription:
      'Unofficial concept project. Not affiliated with, sponsored by, or endorsed by Apple Inc. ' +
      'All specifications shown are unconfirmed pre-release reporting, each graded by confidence.',
    citation: [
      'https://www.macrumors.com/roundup/iphone-18-pro/',
      'https://www.macrumors.com/roundup/iphone-fold/',
      'https://www.macrumors.com/guide/iphone-18-pro-ultra-colors/',
    ],
  };
}
