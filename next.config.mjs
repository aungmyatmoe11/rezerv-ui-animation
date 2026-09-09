import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Sent on every response.
 *
 * There is deliberately no full Content-Security-Policy. A useful script-src
 * needs either 'unsafe-inline' — which the two JSON-LD blocks in the layout
 * would force, and which gives most of the protection back — or a per-request
 * nonce, which requires middleware and would turn a fully prerendered static
 * page into a dynamic one. Trading the static render for a policy this page
 * cannot benefit from (no user input, no auth, no cookies, no third-party
 * script) is the wrong trade, so the one directive that does work on a static
 * response is set on its own and the rest is left off on purpose.
 *
 * Nothing here restricts what the event embed needs: its iframe asks for
 * autoplay, encrypted-media, accelerometer, gyroscope, picture-in-picture,
 * clipboard-write and web-share, and none of those is in the deny list.
 */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // The page embeds; it is never embedded. X-Frame-Options covers the browsers
  // that predate frame-ancestors.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  // Two years. `preload` is deliberately absent: submitting to the preload list
  // is a commitment about a domain this project does not own yet. Add it once
  // the real origin is known and every subdomain is HTTPS.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // `browsing-topics=()` used to be in this list. Chromium builds without the
  // Topics API — which is most of them outside Chrome — log
  // "Unrecognized feature: 'browsing-topics'" on every page load for a
  // directive that does nothing there, and the site has no ads and no
  // third-party script for Topics to inform in the builds that do support it.
  // A console warning on every load was the larger cost.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // A lockfile in $HOME made Next treat that folder as the workspace root and
  // watch far too much. Pin both keys: `next dev` (webpack) reads
  // outputFileTracingRoot; `--turbo` reads turbopack.root.
  outputFileTracingRoot: projectRoot,
  turbopack: { root: projectRoot },
  // Nothing gains from advertising the framework and version to a scanner.
  poweredByHeader: false,
  // Lets a production build be written somewhere other than .next, so a build
  // can be measured while a dev server is still running against .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  sassOptions: {
    // Every .module.scss gets the token layer without importing it by hand.
    additionalData: `@use "@/styles/abstracts" as *;`,
  },
  images: {
    // The colour PNGs ship untouched; next/image derives these formats at build time.
    formats: ['image/avif', 'image/webp'],
    // Required from Next 16; declared now so the build stays warning-free.
    qualities: [82],
  },

  /**
   * The media directories are the page, and none of it was cacheable.
   *
   * Next hashes everything under `_next/static` and serves it immutable, but
   * files in `public/` are its own filesystem passthrough and go out as
   * `public, max-age=0`. Measured: 78MB across 742 files, every one of them
   * revalidated on a repeat visit — 724 conditional requests before the second
   * view of this page can start painting.
   *
   * These four directories are build output, not hand-edited source:
   * tools/build-assets.ps1 writes them, and a frame or a clip is replaced by
   * regenerating the set rather than editing a file in place. That is what makes
   * `immutable` honest here. THE CONTRACT: changing a file's content means
   * changing its name — a re-encode that reuses `hero.mp4` will be served stale
   * to anyone who has already visited.
   */
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      {
        source: '/:dir(frames|video|poster|img)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
