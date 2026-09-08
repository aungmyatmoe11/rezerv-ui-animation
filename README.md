# iPhone 18 Pro — The Rumor, Reconstructed

**Live:** [https://rezerv-ui-animation.vercel.app](https://rezerv-ui-animation.vercel.app)

An unofficial concept recap of the rumoured **iPhone 18 Pro** and **iPhone Ultra**, built as one
animation-heavy landing page.

> **Not an Apple product.** Not affiliated with, sponsored by, or endorsed by Apple Inc.
> Nothing here is an announcement. Visuals are independent concept renders. Claims are public
> reporting and leak research, each graded by confidence. See *Asset provenance*.

---

## Why this exists

Apple’s **Surprise and Shine** event is on **Wednesday, 9 September 2026** (10:00 AM PT). The
rumour mill for that keynote is the iPhone 18 Pro / Pro Max refresh and Apple’s first foldable,
widely discussed as **iPhone Ultra**.

This repo is a **pre-event recap**: pull the leaked films and stills, the reporting, and the
confidence of each claim into one vertical page so the hardware story can be *watched* instead of
read as a roundup. It is research and concept work — not official specs, not a store, and not a
prediction presented as fact.

The page also embeds the Apple Event stream in the sources section (`Apple Event — September 9`,
tagline *Surprise and shine.*) so the recap and the livestream sit on the same scroll.

---

## Setup

```bash
npm install
npm run dev
```

```bash
npm run check   # typecheck, lint, production build
```

Media in `public/` **is committed** — clone and run. To regenerate from the read-only source
library (ffmpeg on PATH):

```bash
npm run assets
```

---

## What’s on the page

One route (`/`). A loading curtain, then twenty sections in three acts plus a close.

The curtain is not a section: real preload progress, then a lift into the hero. First visit holds
a 2.4s count-chase plus a 1.1s brand beat (1.2s / 0.7s on repeat). It caps at 8s and always opens.

| # | Section | What you see |
|---|---|---|
| 01 | **Hero** | One-shot film on load; holds on its own “iPhone 18 PRO” title card |
| 02 | **Colours** | Pinned scroll-scrub of the three expected finishes, plus a picker |
| 03 | **Design** | Full-bleed film, hover callout cards |
| 04 | **Dynamic Island** | Film + scroll-linked gauge (20.7 mm → 13.5 mm, reverses on scroll-up) |
| 05 | **Display** | Pinned scrub, 56 frames at 2560×1440; size cards lock to the plate |
| 06 | **Camera sensor** | Pinned scrub, 104 frames; five leader-line callouts on the explode |
| 07 | **Variable aperture** | Two films + a nine-blade SVG iris driven by a slider (f/1.4–f/4, labelled simulation) |
| 08 | **A20 Pro** | Pinned scrub, 120 frames; callout on the rendered spec list |
| 09 | **Connectivity** | Contained film + C1 / C1X / C2 lineage cards |
| 10 | **Battery** | Contained film beside the argument |
| 11 | **Pro vs Pro Max** | Pinned scrub, 48 frames, plus a comparison table |
| 12 | **Ultra transition** | The only bright clip — bordered card, never full-bleed |
| 13 | **Ultra hero** | Pinned scrub, 100 frames; wireframe resolves, spec cards land on the film |
| 14 | **Fold** | Pinned scrub, 120 frames; 5.5″ closed → 7.8″ open, caption swaps at the midpoint |
| 15 | **Thickness** | Full-bleed film |
| 16 | **Touch ID** | Full-bleed film |
| 17 | **Ultra colours** | Pinned scrub, 64 frames + two-option picker |
| 18 | **Pro vs Ultra** | DOM comparison |
| 19 | **Confidence map** | Eight bars of how much each claim can actually carry |
| 20 | **Ending and sources** | Timeline, citations, Apple Event embed |

Supporting routes: `/privacy`, `/cookies`, `/terms`, custom 404.

---

## Animation approach

Four techniques. Each has a job; the page does not invent a fifth primitive per section.

**1. One-shot hero film.** Not scroll-driven. It plays once and stops on the baked title card —
that artwork *is* the headline, so the `<h1>` is visually hidden. Playback is started from script
(`muted`, `playsInline`, no controls), same pattern as Apple’s own product heroes. Desktop and
tablet wait on the 4K file buffering. On a phone the curtain opens on the **poster**, then
`hero-1280.mp4` plays after unlock.

**2. Canvas frame-sequence scrub** — eight of them: colours, display, camera sensor, A20 Pro,
Pro vs Pro Max, Ultra hero, fold, Ultra colours. Scroll picks a JPEG and paints it; scroll-up
walks the index back, so the film reverses.

- **Nearest frame.** One still per paint. Cross-dissolving adjacent frames stacked two poses on a
  thin edge-on phone and read as a coloured ghost.
- **Repaint gating.** The canvas is touched only when the index actually changes. Trackpad flings
  fire far more scroll events than unique frames.
- **Overlays follow the film.** `ScrubStage` publishes the painted position; `useScrubTimeline`
  scrubs a paused GSAP timeline with it, so callouts land on the frame they describe.

JPEG sequences are used instead of seeking a video: `<video>.currentTime` accuracy depends on GOP
structure, and making that reliable needs `-g 1`, which inflates every file several times over.

**3. IntersectionObserver `<video>`** for every other clip. `preload="none"` plus a poster (~40 KB
until the section is near). Pauses on exit so twenty sections never decode twenty videos at once.

**4. GSAP / DOM.** Reveals are one `ScrollTrigger.batch` per section. The Dynamic Island gauge is
the one scroll-linked DOM tween: a `scaleX` on a pill and a number from the same timeline.

Motion is **transform and opacity only** (the aperture lab’s `filter: blur` is the photo
simulation, not a scroll tween). Headlines do not animate `letter-spacing` — that reflows every
frame. `SplitText` clips each word and moves `transform` / `opacity` inside the clip.

The preloader percentage is the hero’s own `buffered` ranges on desktop/tablet, not a timer. On
the phone and under `prefers-reduced-motion` it finishes from the poster. Two escape hatches: 8s
cap, and the handoff is a React state change rather than a GSAP callback (rAF dies in a
backgrounded tab).

### Motion by viewport

Responsive motion is a behaviour change, not squeezed CSS. See `src/lib/motion/motionPolicy.ts`.

| Context | Scrub | Pin | Autoplay | Pin scale |
|---|---|---|---|---|
| Desktop 1024 px+ | yes | yes | yes | 1.0 |
| Tablet 768–1023 px | yes | yes | yes | 0.6 |
| Mobile under 768 px | **no** | no | yes | — |
| `prefers-reduced-motion` | no | no | **no** | — |

Mobile plays the same films as looping **1280 px** clips and **downloads zero `/frames/` bytes**.
Overlays that carry real copy stack under the letterboxed plate. Type is fluid `clamp()` at every
level. The server renders the conservative (phone) tier so the canvas is not in the SSR HTML.

### Libraries

| Dependency | Why |
|---|---|
| **Next.js + TypeScript** | App Router, one static page, straightforward deploy |
| **GSAP + ScrollTrigger** | Pin, scrub, and resize recalculation are this page’s problem |
| **@gsap/react** (`useGSAP`) | Setup/teardown scoped via `gsap.context()` — leaked triggers are the failure mode |
| **sass** | SCSS Modules over a token layer |

Nothing else in the motion stack.

**Lenis is not used.** Native scroll plus the lerp already inside the scrub loop is the feel.
A second scroll layer would have to stay in lockstep with ScrollTrigger on touch and on reduced
motion.

In-page jumps are **not** `behavior: 'smooth'`. Eight pins change document height mid-flight;
native smooth scroll aims once and lands thousands of pixels short (measured 7,452 px short on
the evidence map). `lib/motion/scrollTo.ts` re-measures every frame.

---

## Design

Vertical cinema with an editorial overlay: rumour as product. Every claim has a confidence grade;
finishes are measured off the renders; interaction teaches the hardware (iris, colour, fold).

| Decision | Why |
|---|---|
| Black (`--ink`) + bone type | Films are the stage; chrome stays quiet |
| System sans, no display face | Type does not compete with footage |
| Confidence colours as a second palette | Official / high / developing / uncertain / concept — each also has a text label |
| Unofficial / concept labelling in-frame | Honesty as UI, not only footer legalese |

Tokens live in `src/styles/global.scss` and `_tokens.scss`. Pro finishes: Dark Cherry, Sky Blue,
Silver, Graphite, measured from the source plates. The picker retints `--theme-*` via `@property`.

**One content column.** `@mixin content-shell` (max 1440px, gutter 24 / 48 / 64) is shared by
plain sections and by copy over full-bleed film, so headlines share one left edge (304px at
1920px wide). Four recipes: full-bleed film + overlay, pinned scrub + callouts, interactive lab +
copy, DOM editorial.

### Chrome

| | |
|---|---|
| Nav | Hidden over the hero, then floating capsules. Priority links on mobile; overflow holds the rest |
| Nav links | Real anchors; the click handler takes over so the **URL never gains a hash** — reload always reopens on the hero |
| Reload | `history.scrollRestoration = 'manual'`, stale hash stripped, scroll to 0 |
| Back to top | Safe-area aware; ring is real scroll progress |

### SEO

Metadata API (`metadataBase`, canonical, Open Graph, Twitter), `robots.ts`, `sitemap.ts`, JSON-LD
`WebSite` + `Article` only. Set `NEXT_PUBLIC_SITE_URL` at **build** time (see `.env.example`); it
defaults to `https://rezerv-ui-animation.vercel.app`.

---

## Performance

Measured on this tree, not claimed.

`public/` is **63 MB** of file bytes (2026-09-08), derived from 182 MB of read-only source.
Delivery is quality-first: native clips keep source geometry; a second 1280 px encode exists for
every film including the hero. Audio never enters the tree (`-an`). `/frames`, `/video`, `/poster`
are `immutable` — change content, change the filename (`MEDIA_REV` or a new name).

| | |
|---|---|
| 18 H.264 clips, native, CRF 24 | 26.5 MB. Hero is 3840×2160 / 2.5 MB. Lazy clips wait until the section is near |
| 18 H.264 clips, 1280 px, same CRF | 7.6 MB including `hero-1280.mp4` (0.37 MB). Phone / lite tier. SSIM 0.995 vs native (battery) |
| 8 frame sequences (668 frames) | ~23 MB, lazy on approach, **never on mobile**. Display is 56×2560; the other seven are 1600 px |
| 18 posters, 1920 px | 0.9 MB — the eager stills |
| 4 device PNGs | 5.6 MB, `next/image` as AVIF/WebP |

**What each viewport fetches on a full scroll**

| | Video | Frame sequences | Clips |
|---|---|---|---|
| Mobile 390×844 | **7.6 MB** (all 1280, including the hero) | **0** | 18 |
| Tablet 834×1112 | ~36.7 MB | 8 | 10 |
| Desktop 1440×900 | ~36.7 MB | 8 | 10 |

First Load JS ~190 kB for `/` (103 kB shared), GSAP included. Ultra act + ending are
`next/dynamic()`.

**Scrub cost** (camera-sensor, 104 frames, 2880×1440, 11.9 MB, scripted pin): median 6.9 ms,
p95 9.7 ms, worst 18.2 ms, 0 frames over 33 ms.

Pipeline delivery (production build, 5 Mbps / 40 ms): first load before open **4.12 MB**; full
desktop scroll **36.67 MB**; repeat visit **0** revalidations (was 742 when `public/` was
`max-age=0`).

**Lighthouse** — captured **2026-09-08** against
[https://rezerv-ui-animation.vercel.app](https://rezerv-ui-animation.vercel.app)
(Lighthouse 13.4.1). Raw JSON/HTML dumps stay **local** under `docs/` (not on GitHub).

| Run | Perf | A11y | BP | SEO | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|
| **Live desktop** | **99** | **100** | **100** | **100** | 0.9s | 0ms | 0 |
| **Live mobile** (this machine’s network, mobile viewport) | **94** | **100** | **100** | **100** | 2.4s | 30ms | 0 |

Desktop is `--preset=desktop`. Mobile 94 is `--form-factor=mobile` with `throttling-method=provided` (no extra Slow 4G). Accessibility, Best Practices and SEO are **100** on both.

Lighthouse’s default **mobile Slow 4G + 4× CPU** preset is a lab stress test, not a visitor
score: **68** Perf here because of the designed 2.4s curtain plus CPU throttle. The live numbers
to quote are **99 / 100 / 100 / 100** desktop and **94** mobile above.

After a new Vercel deploy, re-run:

```bash
npx lighthouse https://rezerv-ui-animation.vercel.app/ --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=docs/live-lighthouse/desktop
npx lighthouse https://rezerv-ui-animation.vercel.app/ --form-factor=mobile --throttling-method=provided --screenEmulation.mobile --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=docs/live-lighthouse/mobile-provided
```

---

## Deployment

**Production:** [https://rezerv-ui-animation.vercel.app](https://rezerv-ui-animation.vercel.app)

Vercel builds from `main` on GitHub. GitHub Actions (`.github/workflows/ci.yml`) runs on push:
Node **20**, `next build` into `.next-prod`, Playwright Chromium, then `npm run test:ci` —
`part1-fixes` on desktop only, so the gate finishes in minutes. Full suite: `npm test`. Playwright
starts `next start` from `.next-prod` — a default `.next` build will not boot the test server.

```bash
NEXT_PUBLIC_SITE_URL=https://rezerv-ui-animation.vercel.app npm run build
npm start
```

`/` is static (`○ /`). Also `/privacy`, `/cookies`, `/terms`, `/not-found`, `robots.txt`,
`sitemap.xml`. No server data, no database.

### Cache contract

`next.config.mjs` serves `/frames`, `/video`, `/poster`, `/img` as
`public, max-age=31536000, immutable`. Replacing `hero.mp4` in place serves stale bytes for a
year. Rename, or change the file before the first deploy.

### Headers

Verified with `curl -I` on the production build: `nosniff`, `strict-origin-when-cross-origin`,
`X-Frame-Options: DENY` / `frame-ancestors 'none'`, HSTS without `preload`,
`Permissions-Policy` camera/mic/geo off. No full `script-src` CSP — JSON-LD would force
`'unsafe-inline'` or a nonce, and a nonce needs middleware (dynamic render). Reasoning is on
`SECURITY_HEADERS` in `next.config.mjs`.

After deploy:

- `curl -I https://rezerv-ui-animation.vercel.app/video/hero.mp4` — `immutable`
- View source — canonical, `og:url`, JSON-LD `@id` on that origin
- `/sitemap.xml` and `/robots.txt` agree
- Sources section: play the event embed once against these headers

---

## Accessibility

- Ultra’s white clip stays in a bordered card (WCAG 2.3.1 flash risk if it went full-viewport).
- Preloader is `role="progressbar"` with live `aria-valuenow`.
- Colour pickers are native radio groups.
- Confidence is never colour alone.
- Skip link, visible focus, decorative clips `aria-hidden` when adjacent copy already speaks.
- `prefers-reduced-motion`: no scrub, no pin, no autoplay; curtain opens on the hero poster.
- Aperture slider: native range + `aria-valuetext`; the scene says *Illustrative simulation* in
  frame.
- Comparison tables keep table roles after CSS reflows rows on mobile.

---

## Asset provenance

All moving images are original concept renders, not third-party commercial footage.

- Watermarks cropped off five clips; frame-grabs at those timestamps to confirm no residue.
- Apple logos on the device bodies stay — they cannot be removed without destroying the plate.
  The page discloses: unofficial badge on the hero, concept label in the nav, disclaimer in the
  footer.
- Figures baked into three clips (`Up to 15% Faster`, `48MP`, `4,288mah`) are labelled, not
  hidden. The film may show a number the copy refuses to assert.

---

## Known limitations

- Hero uses `object-fit: contain` in portrait. Cover-cropping 16:9 into a 3:4 phone sliced the
  title card — and that card is the headline.
- A scrub section prefers a complete JPEG set (1.5–3.3 MB). `ScrubStage` holds the poster until
  frames land; a single miss is filled from its neighbour; a total miss falls back to looping
  video inside the same pin.
- Phone hero is `hero-1280.mp4` (1280×720, 0.37 MB) after the poster curtain. Desktop/tablet keep
  4K so the title card stays sharp. A full phone read is **7.6 MB** of video, no frames.
- OG still uses `poster/hero.jpg` at 1920×1080; 1200×630 would match the metadata intent.
- Two source clips (`design`, camera zoom) are 0.6 Mbps and show mild macroblocking on dark
  gradients. Drop-in re-exports would fix that.
- ~20 sections still risk scroll fatigue. Some film overlays go dark-on-dark. Ending is denser
  than the Ultra act.

---

## Also in the repo

MIT license, `CONTRIBUTING.md`, `SECURITY.md`, GitHub Actions (`typecheck`, `lint`, `build`,
`test:ci` smoke on desktop). Playwright against a production build, TypeScript strict, ESLint.
No analytics, no tracking cookies, no fake consent banner.
