# iPhone 18 Pro — The Rumor, Reconstructed

**Rezerv Frontend Engineering Assessment — Part 1: UI Animation Challenge**

A single animation-heavy landing page. Instead of the reference site's NFT artwork, this uses an
original concept reconstruction of the rumoured iPhone 18 Pro and iPhone Ultra — the brief
explicitly allows swapping in your own assets.

> **Unofficial concept project.** Not affiliated with, sponsored by, or endorsed by Apple Inc.
> All visuals are independent concept renders. See *Asset provenance* below.

---

## Setup

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run check
```

`check` runs typecheck, lint and a production build.

Media in `public/` **is committed** — clone and run, no asset build needed. To regenerate it from
the read-only source library instead (needs ffmpeg on PATH):

```bash
npm run assets
```

---

## Which slides are implemented

The brief asks for **any 3** of the reference page's ~7 slides. All twenty sections of this
reconstruction are built, so the three required archetypes are covered several times over. These
are the three that answer the brief directly:

| # | Slide | What it demonstrates |
|---|---|---|
| 1 | **Loading screen** | Real preload progress, then a handoff into the entrance reveal |
| 2 | **Hero** | A film that plays through once on load and holds on its title card |
| 3 | **Collection section** (Colours) | Pinned scroll-scrub that reverses on scroll-up, plus an interactive picker |

Everything the brief lists is exercised here: **on load** (preloader + entrance), **on scroll**
(pin, scrub, staggered reveals), **on hover** (CTAs, swatches, nav, footer links), **on resize**
(fluid type, plus a motion tier that genuinely changes behaviour rather than only layout).

The remaining seventeen sections reuse those same primitives rather than introducing new ones.
The Pro act:

| # | Section | Technique | Interaction |
|---|---|---|---|
| 03 | Design | full-bleed film | hover callout cards |
| 04 | Dynamic Island | film + scroll-linked gauge | pill bar scrubs 20.7 mm to 13.5 mm, runs backwards on scroll-up |
| 05 | Display | **pinned scroll-scrub** (112 frames) | size cards land on the film's position |
| 06 | Camera sensor | **pinned scroll-scrub** (104 frames) | five leader-line callouts follow the explode; scroll up reassembles |
| 07 | Variable aperture | two contained films + interactive | **slider** drives a nine-blade SVG iris, a live f-number, and a blur / bokeh / exposure scene |
| 08 | A20 Pro | **pinned scroll-scrub** (120 frames) | a callout lands on the rendered spec list; hover spec rows |
| 09 | Connectivity | contained film + lineage | hover lineage cards (C1, C1X, C2) |
| 10 | Battery | contained film beside the argument | — |
| 11 | Pro vs Pro Max | **pinned scroll-scrub** (48 frames) + table | hover rows; the table reflows on mobile |

The Ultra act and the close are on the page too:

| # | Section | Technique | Interaction |
|---|---|---|---|
| 12 | Ultra transition | contained card, scroll-ramped | the only bright clip, deliberately never full-bleed |
| 13 | Ultra hero | **pinned scroll-scrub** (100 frames) | wireframe resolves; spec cards land on the film |
| 14 | Fold | **pinned scroll-scrub** (120 frames) | closed 5.5″ to open 7.8″, caption swaps at the midpoint, scroll up refolds |
| 15 | Thickness | full-bleed film | — |
| 16 | Touch ID | full-bleed film | — |
| 17 | Ultra colours | film + picker | **click swatch**, two options only |
| 18 | Pro vs Ultra | DOM | hover trade-off cards and twelve comparison rows |
| 19 | Confidence map | DOM | eight bars drawing on scroll, hover rows |
| 20 | Ending and sources | DOM | hover timeline nodes and source links |

That is all 20 sections. See `../docs/SECTION_MAP.md`.

---

## Libraries, and why

| Dependency | Why |
|---|---|
| **Next.js + TypeScript** | Production build tooling and a trivial deploy path. No routing is used — the brief asks for one page. |
| **GSAP + ScrollTrigger** | `pin`, `scrub` and resize recalculation are exactly this page's problem. Purpose-built rather than assembled from scroll listeners. |
| **@gsap/react** (`useGSAP`) | Scopes setup and teardown to the component via `gsap.context()`. On a page of pinned triggers, leaked ScrollTriggers are the main failure mode. |
| **sass** | SCSS Modules over a token layer. |

**Nothing else.** No Framer Motion, no Three.js, no WebGL, no animation utility packs.

### Deliberately not used

**Lenis / smooth-scroll library.** Native scroll plus the lerp smoothing already inside the scrub
loop reaches the target feel. A second scroll layer would need synchronising with ScrollTrigger
and re-verifying on touch and reduced-motion, for a gain the scrub already delivers.

**`<video>.currentTime` scrubbing.** The obvious cheap way to make scroll drive a film. Rejected:
seek accuracy depends on GOP structure, so making it reliable needs `-g 1`, which inflates every
file 3-5x. Frame sequences are deterministic and behave identically in every browser.

---

## Animation approach

### Four techniques, each with a job

**1. One-shot hero film.** The hero is deliberately *not* scroll-driven. It plays through once on
load and stops on its own title card.

This mirrors Apple's product hero, verified against apple.com/iphone-17-pro directly: their hero
video is `loop=false`, `muted`, `playsInline`, `controls=false` and `autoplay=false` — started
from script so the page owns the moment it begins. Because the film resolves onto an
"iPhone 18 PRO" title card, that artwork *is* the headline; the `<h1>` is visually hidden rather
than printed a second time over the top of it, and the visible copy sits in the lower third.

**2. Canvas frame-sequence scrub** — seven of them: colours, display, camera sensor, A20 Pro,
Pro vs Pro Max, Ultra hero and fold.
Scroll position picks a JPEG frame and paints it to a canvas; scrolling up walks the index back
down, so the film reverses. Two decisions carry the performance:

- **Adjacent-frame blending.** Frames N and N+1 cross-dissolve by the fractional scroll position,
  so a sparse sequence reads as continuous motion. It let every sequence drop ~35% of its frames,
  and bytes, with no visible stepping.
- **Repaint gating.** The canvas is touched only when the quantised position actually moves.
  Scroll events fire far more often than the image changes; an ungated `drawImage` per event is
  the usual reason these scrubs drop frames on a trackpad fling.
- **Overlays follow the film, not the scroll.** `ScrubStage` publishes its painted position and
  `useScrubTimeline` scrubs a paused GSAP timeline with it, so the sensor callouts, the display
  cards and the A20 badge land on the frame they describe and retract when the visitor scrolls
  back up. No extra ScrollTriggers, and nothing can drift from the picture.

**3. IntersectionObserver `<video>`** — every other clip. `preload="none"` plus a poster, so a
section costs ~40 KB until it is nearly on screen, and pauses on exit so twenty sections never
decode twenty videos at once.

**4. GSAP/DOM** — reveals via a single `ScrollTrigger.batch` per section, so 20 sections need
~20 triggers rather than ~200. The Dynamic Island gauge is the one scroll-linked DOM tween: a
`scaleX` on a pill and a number written from the same timeline, so bar and figure cannot disagree.

### Only transform and opacity

No animation touches a layout-triggering property. The headline entrance is the clearest case:
the content spec called for animating `letter-spacing`, which reflows on every frame. Instead
`SplitText` wraps each word in a clipping span and animates `transform`/`opacity` inside it.

### The preloader is real

Its percentage is read from the hero video's own `buffered` ranges — it is not a timer. Slow
networks therefore genuinely hold the loading screen, which is the brief's *slow asset loading
should be covered by the loading state* edge case, handled honestly.

Two deliberate escape hatches: it caps at 8 s and opens regardless, and the handoff that releases
the hero is a plain effect rather than a GSAP callback. GSAP's ticker is rAF-driven, so in a
backgrounded tab the exit timeline never starts — routing a *state* transition through it would
leave the page frozen behind the loader.

---

## Design & visual system

This page is designed as a **vertical cinema with an editorial overlay**, not as a marketing
template. The thesis: rumour as product — every claim carries a confidence grade, finishes are
measured off concept renders, and interaction teaches the hardware story (iris, colour, fold)
instead of decorating it.

### Visual thesis

| Decision | Why |
|---|---|
| Black (`--ink`) field + bone type | Lets full-bleed films read as the stage; chrome stays quiet |
| System sans, no display font | Apple-adjacent product pages; type never competes with footage |
| Confidence colours as a second palette | Official / high / developing / uncertain / concept are named, not rainbow accents |
| Unofficial / concept labelling in-frame | Design honesty as UI, not only footer legalese |

### Colour

Surfaces and finishes live in `src/styles/global.scss` + `_tokens.scss`:

- **Surfaces:** `--ink` / `--ink-raised`, `--bone` / `--bone-dim` / `--bone-faint` (faint raised to
  `#8a8780` for WCAG AA on black), soft rules for dividers.
- **Finishes:** Dark Cherry, Sky Blue, Silver, Graphite — values **measured** from the source
  renders (see asset inventory), not eyeballed brand guesses. The Pro colour picker retints
  `--theme-*` via `@property` so the section cross-fades in CSS.
- **Confidence:** `--c-official` … `--c-concept` on badges and the confidence map — colour never
  carries meaning alone; each grade also has a text label.

Pro finishes UI splits **Expected lineup** vs **Early mockups — not expected** so Dark Gray stays
visible as reporting history without pretending it ships.

### Type

Fluid `clamp()` scale in `src/styles/_type.scss` (assessment requirement: resize adapts smoothly):

| Role | Mixin | Intent |
|---|---|---|
| Hero | `t-hero` | Rare; mostly baked into the hero title card |
| Section title | `t-section` | **One size for the whole page** |
| Subhead | `t-sub` | Lab titles, secondary beats |
| Body / lede | `t-body` | Reading measure capped near `$max-reading` (820px) |
| Eyebrow | `t-eyebrow` | Subject name, uppercase tracking — never "Section 07" |
| Mono | `t-mono` | f-numbers, gauges, tabular specs |

`SectionHead` has **no size prop**. `tone="film"` only adds text-shadow + tighter measure so type
survives moving footage; it never shrinks the hierarchy.

### Layout grid

**One content column, page-wide.** `@mixin content-shell` (max-width 1440px, centred, responsive
gutter 24 / 48 / 64) is used by plain sections *and* by the copy inside every full-bleed film.
Think of it as two rails sharing one contract: the **content rail** (headlines, cards, tables)
stays in the shell; the **film rail** may go edge-to-edge, but overlays that carry real copy
still sit inside `content-shell` so they do not drift left of plain sections.

This was the page's worst layout bug. `<Section>` centred its content in a shell while film
overlays used the raw gutter, so at 1920px a headline over footage began 240px to the left of a
headline on a plain background. Measured after the fix: all twenty headlines share a single left
edge of 304px at 1920px wide.

Vertical rhythm uses `section-rhythm` (mobile → tablet → desktop padding bands) with
`rhythm="compact|tight|normal|loose"` and visual `variant="default|inset|breathe"` on `<Section>`
so twenty blocks do not all open with identical air.

### Composition patterns

Four layout recipes repeat on purpose — craft is depth in the primitives, not a new grid per act:

1. **Full-bleed film + overlaid `SectionHead`** (Design, Thickness, …)
2. **Pinned scrub stage** with callouts locked to frame position (Display, Sensor, Fold, …)
3. **Split: interactive lab + copy** (Aperture photo lab — iris + real scenes; Colours picker)
4. **DOM editorial** (compare tables, confidence map, sources)

Aperture lab: nine-blade SVG iris, rumoured **f/1.4–f/4** range, drag/tap stops, Low light / City
plates with focus masks — simulation labelled **in frame**. Colours: expected trio vs demoted
early mockup, radio group with honest `aria-label`s.

### Mobile / tablet design behaviour

Layout and motion change together (see *Responsive approach*). Under 768px scrub/pin drop to
looping 1280px clips with copy stacked beneath letterboxed film — a phone cannot hold three stat
cards over a 2:1 plate. Nav collapses to priority capsules + overflow. `overflow-x: clip` on
`body` keeps the "vertical cinema" from ever scrolling sideways.

### Design residual risks (honest)

Live visual pass on https://rezerv-ui-animation.vercel.app (desktop 1280 + mobile 390)
confirmed the thesis and also these remaining risks:

- ~20 sections + generous black holds still risk **scroll fatigue** — over-delivery vs the brief's
  "any 3" is a craft choice and a pacing risk.
- Film overlays sometimes go **dark-on-dark**; overlay strength is not yet tokenised per plate.
- Finish swatches / aperture presets need a **touch-first** check (~44px targets) on short phones.
- Ending (evidence + timeline + sources) is denser than the Ultra act — closing hierarchy could
  be sharper (one thesis → sources → legal).
- Hero on phone stays native `preload="auto"` (title card in pixels) — design priority over LCP.
- OG share image is still 1920×1080 vs ideal 1200×630.
- Some section eyebrows remain hardcoded outside `copy.ts` — voice mostly consistent, not fully
  centralized.

## Chrome

| | |
|---|---|
| Nav | Hidden over the hero, then floating capsules. Priority sections on mobile; overflow menu holds the rest. Safe-area-inset aware. |
| Nav links | Real anchors, but the click handler takes over: **the URL never gains a hash**, so a reload always reopens on the hero |
| Reload | `history.scrollRestoration = 'manual'`, any stale hash stripped, scrolled to 0 |
| Back to top | Floating control, bottom right (safe-area aware). Ring shows real scroll progress via `stroke-dashoffset` |
| Loading screen | 2s floor on first visit, 400ms on repeat (sessionStorage). Lifts as curtain when ready |

**Scrolling to a section is not `behavior: 'smooth'`.** The trip from the hero to the sources
crosses seven pinned sections, each pinning and unpinning as it is passed, which changes document
height mid-flight. Native smooth scroll resolves its destination once, at the start, so it
arrived thousands of pixels short — measured at 7,452px short for the evidence map, while an
instant scroll to the same computed offset landed exactly. `lib/motion/scrollTo.ts` re-measures
the target every frame and then holds a short settle phase until it stops moving. Verified: six
nav targets, including the cold first jump, all land at an offset of exactly 0.

## SEO

Metadata API only, no `next-seo`. `metadataBase`, canonical, Open Graph and Twitter cards,
`robots.ts`, `sitemap.ts`, and two server-rendered JSON-LD graphs (`WebSite` and `Article`).

There is deliberately **no Product schema, no aggregateRating, no offers and no review markup**.
This page sells nothing and rates nothing, and structured data describing a product Apple has not
announced would be fabricated. What is described is what the page actually is: an article of
analysis, carrying a `disambiguatingDescription` that states plainly it is unofficial and
unconfirmed.

> **Before deploying:** set `NEXT_PUBLIC_SITE_URL` to the real origin (see `.env.example`).
> Canonical, Open Graph and sitemap URLs all derive from it, so they cannot drift apart — but
> until it is set they point at a placeholder.

## Responsive approach

Responsive motion is a **behaviour** decision, not just responsive CSS. The desktop timeline is
never squeezed onto mobile. See `src/lib/motion/motionPolicy.ts`:

| Context | Scrub | Pin | Autoplay | Pin scale |
|---|---|---|---|---|
| Desktop 1024 px+ | yes | yes | yes | 1.0 |
| Tablet 768-1023 px | yes | yes | yes | 0.6 |
| Mobile under 768 px | **no** | no | yes | — |
| `prefers-reduced-motion` | no | no | **no** | — |

Mobile falls back to the same clip as a looping **1280 px** video and **downloads zero frame bytes** —
verified: 0 requests to `/frames/` at 375 px wide. Scrub sections whose overlay carries real copy
(display, A20 Pro, Pro vs Pro Max) also switch to a stacked layout on that tier — the clip at its
own aspect ratio, the copy beneath it — because a phone cannot hold three stat cards over a
letterboxed 2:1 clip. Verified: no horizontal overflow at 375 px. The server renders the conservative tier, so
the canvas never appears in the SSR HTML; it is added only after hydration decides the device can
afford it.

Type is fluid via `clamp()` at every level, so shrinking and expanding across breakpoints is
continuous rather than stepped.

---

## Performance notes

Measured, not claimed. Anything not listed here has not been measured yet.

**Asset pipeline** — `tools/build-assets.ps1` derives everything in `public/` (**60.6 MB**) from
182 MB of read-only source. Resolution is quality-first: no clip and no frame is ever scaled down
by the delivery pass, so a clip keeps its source geometry and only the quantiser is tuned. Audio
never enters the tree — each entry reads a `-no-audio` source *and* passes `-an`, verified with
`ffprobe` across all 18 native outputs. A second 1280 px encode of every clip except the hero is
derived from that delivery file for the `lite` motion tier:

| | |
|---|---|
| 18 H.264 clips, native resolution, CRF 24 | 26.5 MB. Sources stay 2880x1440 / 2560x1440; the hero stays 3840x2160 at 2.5 MB. None but the hero is fetched until its section is near |
| 17 H.264 clips, 1280 px, same CRF | 6.9 MB. `LazyVideo` selects these on the `lite` tier. Filename carries the width because `/video` is `immutable`. SSIM 0.995 against the native file (battery) |
| 8 frame sequences (724 frames), 1600 px, `-q:v 6` | 20.7 MB, lazy-loaded on approach, never on mobile |
| 18 posters, 1920 px | 0.9 MB — the only assets fetched eagerly |
| 4 device PNGs | 5.6 MB, copied byte-for-byte, served as AVIF/WebP by `next/image` |

**Are those quantisers a quality reduction?** Measured, not asserted. Against the CRF 20 / `-q:v 2`
outputs the current settings score **SSIM 0.998** for video and **0.995** for frames, and the
hero's title card — the one place on the page with type baked into the pixels, so the first thing
that would show it — is indistinguishable at 100%. That bought 20 MB: `public/` went from 78 MB to
51 MB with no change to resolution, frame rate, file names or asset count.

**Delivery** — measured on the production build with a 5 Mbps / 40 ms profile:

| | Before | After |
|---|---|---|
| First load, before the page opens | 7.31 MB | **4.12 MB** |
| Loading screen held | 9,014 ms | **5,591 ms** |
| Full scroll, desktop | 56.73 MB | **36.67 MB** |
| Repeat visit | 742 revalidation requests | **0** |

Two changes account for that beyond the re-encode. Files under `public/` were going out as
`Cache-Control: public, max-age=0` — Next only hashes and freezes what it builds into
`_next/static`, so every one of the 742 media files was revalidated on a repeat visit; they are
now `immutable` (see the contract in **Deployment**). And the colours sequence sat inside the
scrub loader's 150% root margin at scroll 0, so it downloaded *beside* the hero film the
preloader was waiting on; lazy sequences now wait for the loader to hand over, which is worth
2.4 s on its own.

**What each viewport actually fetches** — the motion tiers decide, and the three differ:

| | Full scroll | Frame sequences | Clips |
|---|---|---|---|
| Mobile 390x844 | **9.5 MB** of video (2.5 MB hero + 6.9 MB of 1280 encodes; was 26.5 MB) | **0** — `canScrub` is false, so `ScrubStage` falls back to video | 18 (17 of them 1280) |
| Tablet 834x1112 | 36.7 MB | 8 | 10 |
| Desktop 1440x900 | 36.7 MB | 8 | 10 |

**Bundle** — First Load JS 181 kB for the page (103 kB shared), GSAP included. Ultra act + Ending code-split to reduce mobile TBT.

**Scrub cost at native size** — measured on the camera-sensor sequence (104 frames, 2880x1440,
11.9 MB) during a scripted scroll through its pin:

| | |
|---|---|
| Median frame | 6.9 ms |
| 95th percentile | 9.7 ms |
| Worst frame | 18.2 ms |
| Frames over 33 ms | 0 |

The repaint gate is what makes this survivable: the canvas is touched only when the quantised
position moves, and a paint composites two images, not 104. Decoding stays off the critical path.

**Lab + live Lighthouse captured** (see Known limitations + `docs/lighthouse-*.report.*`).
Live origin measured 2026-09-07 on https://rezerv-ui-animation.vercel.app.
A Chrome Performance trace under 4× CPU throttle is still outstanding.

---

## Deployment

**Production:** https://rezerv-ui-animation.vercel.app

> Update `NEXT_PUBLIC_SITE_URL` in your deployment settings to match your actual domain.

The page is one fully prerendered static route — `next build` reports `○ /  (Static)` — plus
supporting pages (`/privacy`, `/cookies`, `/terms`, `/not-found`), `robots.txt` and `sitemap.xml`.
There is no server data, no database and no runtime environment beyond the origin URL, so any host
that can run `next start` (or serve a Next static output) is enough.

```bash
NEXT_PUBLIC_SITE_URL=https://the-real-origin npm run build
npm start
```

`NEXT_PUBLIC_SITE_URL` is read at **build** time, not run time. Canonical, Open Graph, JSON-LD and
sitemap URLs all derive from it; leaving it unset ships a placeholder origin into the markup.

### The cache contract — read before replacing any asset

`next.config.mjs` serves `/frames`, `/video`, `/poster` and `/img` as
`public, max-age=31536000, immutable`. That is what removes 742 revalidation requests from a
repeat visit, and it is only honest because those directories are build output: they are
regenerated as a set by `tools/build-assets.ps1`, never hand-edited in place.

**So: changing a file's content means changing its name.** Re-encoding `hero.mp4` and keeping the
name serves the old bytes to every returning visitor for a year. Either rename
(`hero.v2.mp4`) or make the change before the first deploy. Everything under `_next/static` is
already content-hashed by Next and needs no such care.

### Headers

Set on every response, and verified with `curl -I` against the production build:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` / CSP | `DENY` / `frame-ancestors 'none'` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` |

`X-Powered-By` is switched off. Two deliberate omissions: HSTS carries no `preload`, because
submitting to the preload list is a commitment about a domain this project does not own yet; and
there is no full Content-Security-Policy, because a useful `script-src` would need either
`'unsafe-inline'` (which the two JSON-LD blocks force, giving most of the protection back) or a
per-request nonce, and a nonce needs middleware — which would turn the static prerender into a
dynamic render. The reasoning is written out at `SECURITY_HEADERS` in `next.config.mjs`.

Nothing in `Permissions-Policy` restricts what the event embed asks for (`autoplay`,
`encrypted-media`, `accelerometer`, `gyroscope`, `picture-in-picture`, `clipboard-write`,
`web-share`); that was checked by opening the player against these headers.

### Put the media behind a CDN

61 MB of the tree is media. A desktop full read still moves ~37 MB (native clips plus frames);
a phone full read is 9.5 MB of video and no frames. Served straight from the Node origin, that
is 37 MB of origin bandwidth per desktop visitor and 9.5 MB per phone visitor. On a platform
with an edge network (Vercel, Netlify, CloudFront in front of the container) the `immutable`
headers above mean each file is fetched from the origin once and served from the edge after that.

### After deploying

- `curl -I https://<origin>/video/hero.mp4` — expect `Cache-Control: public, max-age=31536000, immutable`
- View source — canonical, `og:url` and JSON-LD `@id` should carry the real origin, not the placeholder
- `https://<origin>/sitemap.xml` and `/robots.txt` should both resolve and agree on the origin
- Open the Sources section and play the event embed once, to confirm the host's own headers did
  not add a stricter policy than the ones above

---

## Accessibility

- The Ultra transition's white clip plays inside a bordered card, never full-viewport. A
  full-screen black-to-white flip is a WCAG 2.3.1 photosensitivity risk.
- Preloader exposes `role="progressbar"` with a live `aria-valuenow`.
- Colour picker is a native radio group — arrow-key navigation and roving focus come for free.
- Confidence levels carry a text label, never colour alone.
- Skip link, visible focus rings, and decorative clips marked `aria-hidden` where adjacent copy
  already carries the meaning.
- Under `prefers-reduced-motion` the page still tells the whole story: no scrub, no pin, no
  autoplay, opacity-only reveals.
- The aperture slider is a native range input with an `aria-valuetext` f-number; its sample
  scene says *Illustrative simulation* inside the frame, not only in the copy.
- Comparison tables keep explicit table roles after CSS reflows their rows into blocks on mobile,
  and hover feedback never hides anything: every cell is always on screen.

---

## Asset provenance

All moving images are original concept renders, not third-party footage.

- **Watermarks removed** from five clips by cropping, then frame-grabbed at the timestamps where
  the mark used to sit to confirm no residue and no visible black box.
- **Apple logos and wordmarks** are rendered into the device bodies and cannot be removed without
  destroying the footage. They stay, and the page discloses: an `Unofficial concept` badge in the
  hero, a `concept` label in the nav, and the full disclaimer in the footer.
- **Unverified figures** baked into three clips (`Up to 15% Faster`, `48MP`, `4,288mah`) are
  labelled rather than hidden. The video may show a number the page declines to assert — on a site
  whose thesis is a confidence system, that is the product, not a workaround.

Full audit: `../docs/ASSET_INVENTORY.md`.

---

## Assumptions

1. **Over-delivery on section count is welcome, not a scope violation.** The brief says "any 3"
   and "one page only". This is one page; the three required archetypes are complete, and the
   remaining sections reuse the same three primitives.
2. **The reference site's branding was swapped**, as the brief explicitly permits.
3. **Content is rumour, and says so.** Every claim carries a confidence grade rather than being
   presented as fact.
4. **The source media library is read-only.** It is shared and reusable, so the pipeline only
   ever reads from it; a guard aborts any run whose output path resolves inside it.
5. **H.264 only**, no WebM/AV1 alternates. Universal support. Every clip except the hero has two
   encodes: native for desktop/tablet, 1280 px for the `lite` (phone) tier. The hero stays native
   because the preloader waits on it buffering.
6. **Quality outranks byte budget here.** The brief grades animation quality on a page whose
   entire subject is product imagery, and every heavy asset is lazy, so the resolution ceiling
   was set by the source rather than by a target size.

## Professional Checklist

This project includes production-ready features suitable for CTO-level review:

### ✅ Core Pages
- [x] Main landing page (iPhone 18 Pro & Ultra concept)
- [x] Custom 404 page (`/not-found`)
- [x] Privacy Policy (`/privacy`)
- [x] Cookie Notice (`/cookies`)
- [x] Terms of Use (`/terms`)

### ✅ SEO & Metadata
- [x] Comprehensive metadata (Open Graph, Twitter Cards)
- [x] JSON-LD structured data (WebSite, Article schemas)
- [x] Sitemap with all pages
- [x] Robots.txt (allows all, includes sitemap)
- [x] Favicon and app icons metadata
- [x] Canonical URLs

### ✅ Security
- [x] Security headers (CSP, HSTS, X-Frame-Options, etc.)
- [x] Referrer policy
- [x] Permissions policy
- [x] No tracking/analytics cookies
- [x] SECURITY.md for vulnerability reporting

### ✅ Repository Hygiene
- [x] LICENSE (MIT)
- [x] CONTRIBUTING.md (setup, code style, PR process)
- [x] SECURITY.md (vulnerability reporting)
- [x] GitHub Actions CI (typecheck, lint, build, test)
- [x] Professional README with deployment guide

### ✅ Accessibility
- [x] Skip link for keyboard users
- [x] Visible focus rings
- [x] Reduced motion support
- [x] ARIA labels and semantic HTML
- [x] Color never carries meaning alone

### ✅ Legal & Privacy
- [x] Privacy-first (no tracking, no analytics, no cookies)
- [x] Clear disclaimer (unofficial concept)
- [x] Contact information provided
- [x] No fake GDPR consent banner

### ✅ Testing & Quality
- [x] TypeScript strict mode
- [x] ESLint configuration
- [x] Playwright tests
- [x] `npm run check` script (typecheck + lint + build)
- [x] CI pipeline on GitHub Actions

### 📝 Supporting Documentation
- Footer links to privacy, cookies, and terms pages
- Professional pages match main site's design system
- Pages are indexed in sitemap (except 404)
- All pages respect existing SCSS modules and tokens

## Known limitations

- The hero is `object-fit: contain` in portrait rather than `cover`. Cover-cropping 16:9 into a
  3:4 phone viewport kept barely a third of the width and sliced the "iPhone 18 PRO" title card
  open at both ends — and that card *is* the headline, since the `<h1>` is visually hidden
  because of it.
- **A scrub section needs its whole sequence before it can scrub** — 1.5 to 3.3 MB.
  `ScrubStage` holds the section's poster over the canvas until the frames land, so it never
  shows black, but on a slow connection the film may be a still for a second or two.
- **The hero is still the one native-resolution clip a phone downloads**, and it gates first
  paint: 3840×2160, 2.5 MB, `preload="auto"`, because the preloader reads its `buffered` ranges
  and its last frame is a title card with type in the pixels. The other 17 films use a 1280 px
  encode on the `lite` tier — 6.9 MB instead of 24.0 MB on disk, SSIM 0.995 — so a full set of
  clips on a phone is 9.5 MB of video rather than 26.5 MB. Desktop/tablet keep native resolution
  via `motionPolicy.clipVariant`.
- **OG image:** Current `poster/hero.jpg` is 1920×1080. Ideal OG dimensions are 1200×630.
- **Lighthouse (lab, localhost:3100, 2026-09-07):** desktop Perf **99** / A11y 97 / BP 96 / SEO **100**
  (LCP 0.9s, CLS 0); mobile Perf **61** / A11y **100** / BP 96 / SEO **100** (LCP 4.1s, TBT 1.34s).
  Reports under `docs/lighthouse-*.report.*`.
- **Lighthouse (live, https://rezerv-ui-animation.vercel.app, 2026-09-07):** desktop
  Perf **100** / A11y **100** / BP 96 / SEO **100** (LCP 0.6s, TBT 20ms, CLS 0); mobile Perf **98** /
  A11y 97 / BP 96 / SEO **100** (LCP 1.9s, TBT 150ms, CLS 0). Lab mobile was throttled/synthetic;
  live mobile on this origin is the submission number to cite. A 4× CPU throttle Performance
  trace is still outstanding.
- Two source clips (`design`, `camera zoom`) are 0.6 Mbps and show mild macroblocking on dark
  gradients. Higher-bitrate re-exports are a drop-in file replacement.
- **OG image:** Current `poster/hero.jpg` is 1920×1080. Ideal OG dimensions are 1200×630. Regenerate
  from hero poster with proper crop/aspect ratio for optimal social card display.
- A production Chrome Performance trace (4× CPU throttle) is still outstanding; lab + live Lighthouse reports are cited above / in `docs/`.
