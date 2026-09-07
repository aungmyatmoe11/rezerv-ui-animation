import type { Metadata, Viewport } from 'next';
import { ScrollReset } from '@/components/ScrollReset';
import { SITE, articleJsonLd, siteJsonLd } from '@/data/seo';
import '@/styles/global.scss';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: '%s — iPhone 18 Pro concept',
  },
  description: SITE.description,
  applicationName: 'iPhone 18 Pro Concept',
  authors: [{ name: SITE.author }],
  creator: SITE.author,
  keywords: [
    'iPhone 18 Pro concept',
    'iPhone Ultra concept',
    'iPhone Fold',
    'Dark Cherry',
    'A20 Pro',
    'variable aperture',
    'rumour confidence',
    'unofficial concept',
  ],
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: {
    icon: [
      { url: '/poster/hero.jpg', sizes: 'any' },
      { url: '/poster/hero.jpg', sizes: '32x32', type: 'image/jpeg' },
    ],
    apple: [{ url: '/poster/hero.jpg', sizes: '180x180', type: 'image/jpeg' }],
  },
  openGraph: {
    type: 'article',
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    locale: 'en_GB',
    images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: SITE.ogAlt }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.title,
    description: SITE.description,
    images: [SITE.ogImage],
  },
  category: 'technology',
  other: {
    // Stated in the document itself, not only in the footer copy.
    'concept-disclaimer':
      'Unofficial concept. Not affiliated with, sponsored by, or endorsed by Apple Inc.',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        {/* The hero poster is the first thing the page paints once the loader
            lifts, and nothing in the markup asks for it early: the <video> that
            carries it is client-rendered, so the request could not start until
            hydration. Declaring it here puts it in the initial HTML, ahead of
            the 3.8MB film it stands in for. */}
        <link rel="preload" as="image" href="/poster/hero.jpg" fetchPriority="high" />
      </head>
      <body>
        {/* Server-rendered so crawlers see it in the initial HTML rather than
            after hydration. Both graphs describe content that is visibly on the
            page: nothing here asserts a rating, a price or a review. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd()) }}
        />

        <ScrollReset />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}

        {/* The cut used for long jumps — see lib/motion/scrollTo.ts. Server
            rendered so the first nav click does not have to build it, and styled
            in global.scss so its timing comes from the same motion tokens as
            everything else, including the reduced-motion collapse. */}
        <div id="scroll-veil" aria-hidden="true" />
      </body>
    </html>
  );
}
