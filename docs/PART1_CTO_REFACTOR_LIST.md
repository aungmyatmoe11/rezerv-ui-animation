# Rezerv Part 1 — CTO Refactor & Fix List

> **Superseded 2026-09-08.** Snapshot from 2026-09-07. Do not grade the current tree against this
> list. The submission README is `README.md`.
>
> Ignore these claims here; they no longer match the repo:
> `NEXT_PUBLIC_SITE_URL` fallback `iphone18-concept.example.com`; README “Lighthouse not yet
> captured”; preloader 2s / 400ms floor; `--bone-faint` `#55534f`; “keep the blend/quant gate”;
> hero 4K film gating reduced-motion.
>
> The 2026-09-08 QA audit under `docs/qa-audits/` is a **pre-fix** record of eight findings.
> Those remediations landed after the audit (README alignment, `role="img"` on `<video>`, sensor
> contrast, versioned poster preload, reduced-motion poster handoff, favicon, UltraTransition
> teardown, pin-on-fail).

**Project:** `ClaudeCode-Rezerv/part-1` (Next.js + GSAP)  
**Repo:** `aungmyatmoe11/ALL-INTERVIEW`  
**Audit date:** 2026-09-07 (Asia/Saigon)  
**Apple event context:** Sep 9, 2026 (in 2 days)  
**Sources:** design-audit · eng-audit · content-freshness · Lighthouse lab reports under `part-1/docs/`

> Lab Lighthouse only (`http://localhost:3100/`). Not field CrUX / deployed-origin.

---

## Scores (overall)

| Lens | Score | One-liner |
|------|------:|-----------|
| **Design / UI-UX (CTO designer)** | **7.5 / 10** | Senior motion craft; page-length sameness + contrast/chrome IA drag the score |
| **Engineering (CTO SWE)** | **8.4 / 10** | Submission-grade motion architecture; Gate 5 mobile + constants bar incomplete |
| **Combined interview readiness** | **~8 / 10** | Strong for motion eng interview; polish + content freshness needed before design-director demo |

### Lighthouse (measured 2026-09-07)

| Profile | Perf | A11y | BP | SEO | LCP | TBT | CLS |
|---------|-----:|-----:|---:|----:|----:|----:|----:|
| Desktop | **99** | 97 | 96 | **100** | 0.9s | 50ms | 0 |
| Mobile | **61** | **100** | 96 | **100** | **4.1s** | **1340ms** | 0 |

Reports: `ClaudeCode-Rezerv/part-1/docs/lighthouse-{desktop,mobile}.report.{html,json}`

---

## Assignment alignment (Part 1)

### Pass / strong
- One page only · any 3 slides (over-delivered as 20) · preloader + entrance · scroll/pin/scrub · hover · responsive D/T/M · SCSS · transform/opacity discipline · lazy media · mobile degrade · reduced-motion · lean deps (no Lenis / Framer / Three)

### Misaligned / soft risks
| Issue | Severity | Notes |
|-------|----------|-------|
| Scope vs “any 3” brief | Design risk | 20 sections prove craft; cause fatigue / sameness |
| Theme vs NFT reference URL | Documented assumption | Apple cinema ≠ playful NFT register |
| Gate 5 mobile CWV | **P0** | Perf 61, LCP 4.1s, TBT 1.3s |
| README honesty drift | **P1** | Still says LH “not yet captured”; nav chrome description stale |
| `NEXT_PUBLIC_SITE_URL` placeholder | **P0** | Canonical/OG/sitemap/JSON-LD |
| Constants centralization | **P1** | Specs/media OK; section copy still in JSX |
| Content freshness (pre-event) | **P0** | VA exclusivity + colours + Ultra chip drift |

---

## P0 — Do before demo / submission

### Performance
1. **Mobile-tier video encodes (≤1280w) via `lite` policy** — **done 2026-09-07**  
   - Where: `tools/build-assets.ps1`, `src/data/media.ts`, `LazyVideo.tsx`, `motionPolicy.clipVariant`  
   - Result: 17 `slug-1280.mp4` files. Phone full-scroll video is **9.5 MB** (hero 2.5 + 6.9), down from 26.5 MB. Hero stays 4K so the preloader can gate on real buffering.

2. **Decouple LCP from hero 4K film**  
   - Where: `Hero.tsx`, `useHeroPreload.ts`, layout preload links  
   - Why: mobile LCP 4.1s; hero ~2.4–3.7 MB gates first paint

3. **Set real `NEXT_PUBLIC_SITE_URL` at build**  
   - Where: deploy env + `src/data/seo.ts` fallback  
   - Why: else ships `https://iphone18-concept.example.com`

### UI / UX / A11y
4. **Raise `--bone-faint` contrast**  
   - Where: `src/styles/global.scss` (+ eyebrow consumers)  
   - Why: `#55534f` on `#000` ≈ **2.74:1** — fails WCAG; matches desktop LH contrast warning

5. **Safe-area insets on fixed chrome**  
   - Where: `SiteNav.module.scss`, `BackToTop.module.scss`  
   - Why: no `env(safe-area-inset-*)`

6. **No-JS / failed-JS reveal baseline**  
   - Where: `useSectionReveal.ts`, `Section.module.scss`  
   - Why: `opacity: 0` until ScrollTrigger = blank content if JS stalls

### Content (interview landmines — event in 2 days)
7. **Rewrite variable aperture as Pro Max–expected exclusive**  
   - Where: aperture section copy, `confidence.ts`, related ledes  
   - Why: Ice Universe + Gurman consensus ≠ shared Pro story

8. **Collapse Pro colours to trio; demote Dark Gray**  
   - Where: `src/data/colors.ts`, Colors section  
   - Why: late leaks lean 3 finishes; Silver↔Black contested

9. **Ultra chip → “A20 Pro expected” (not vague “A20 generation”)**  
   - Where: Ultra data/copy  
   - Why: Gurman/TrendForce alignment

---

## P1 — High leverage polish

### Performance / eng
10. Centralize **all** section copy → `src/data/copy.ts` (titles, ledes, eyebrows, hints, alts)  
11. Update README with real LH numbers (desktop 99 / mobile 61, localhost, simulated) + fix nav chrome description (capsules, not sliding hairline pill)  
12. Capture Chrome Performance trace @ 4× CPU throttle; attach notes to README  
13. True **1200×630** OG crop (declared size vs `/poster/hero.jpg` 1920×1080)  
14. Code-split below-fold Ultra act + `EventTheatre` (mobile TBT 1.34s)  
15. Soften preloader 2s floor for repeat visits (sessionStorage skip)  
16. Mobile nav IA: collapse 9 destinations → fewer primaries or sheet  
17. Route `Colors` header through shared `SectionHead`  
18. Touch targets on nav links ≥ 44px  
19. Footer should import `SOURCES` (not hardcoded MacRumors URLs)  
20. Confidence badges: text label always; non-colour cue for 6px dot  

### Content
21. Ending/timeline: Ultra announce-with-Pro but **supply/preorder may lag**  
22. Add developing rows: **N2**, **5G-via-satellite**, **simplified Camera Control**, **Pro Max thicker**  
23. Strengthen C2 US/mmWave/Qualcomm regional caveat  
24. Soften Ultra crease rhetoric; add MagSafe developing note  
25. Refresh Sources links (Aug 27 / Sep 1–5) + bump `SITE.modified` / SoT `lastVerified`

---

## P2 — Craft / hygiene

26. Delete or use dead `t-hero` token  
27. Named spacing tokens; map leftover hex to tokens  
28. Break SectionHead sameness across Pro act (vary cadence or cut sections)  
29. Optional review mode `?lite=1` / fewer pins for graders  
30. Unit tests for `frameRenderer` / `seo.ts`  
31. Document muted-video caption stance  
32. Autoprefixer: `start` → `flex-start` in `EventTheatre.module.scss`  
33. Optional frame downscale `$FrameWidth = 1920` for scrub weight  
34. Post-event: swap Official specs; keep confidence system as product

---

## Constants architecture — FAIL (strict bar)

| Area | Status |
|------|--------|
| `media.ts`, `colors.ts`, `pro.ts`, `ultra.ts`, `confidence.ts`, `seo.ts`, `sections.ts` | PASS islands |
| Section headlines / ledes / hints / alts in `src/sections/**` | **FAIL** — hardcoded |
| Preloader / SiteNav / SiteFooter / Hero chrome copy | **FAIL** |
| Battery equation duplicates `BATTERY_FACTORS` | Drift |
| Dynamic Island “35 percent” prose vs `ISLAND` data | Drift |
| SiteFooter sources vs `SOURCES` | Drift |

**Target:** one edit surface — `src/data/copy.ts` (+ existing data modules) so any rumour tweak is data-only.

---

## Content freshness snapshot (2026-09-07)

### Still accurate
Sep 9 event · Dark Cherry / Sky Blue · Pro 6.3 / Max 6.9 · LTPO+ · Island ~35% · A20 Pro 2nm · battery filings · Ultra ~5.5/7.8 · Touch ID · dual-cam no tele · refuse unverified “15% faster”

### Softened / update soon
Silver contested · Pro Max thickness · Ultra supply lag · crease realism · SoT verified date stale

### Contradicted (fix first)
Variable aperture as shared Pro · 4th Pro colour Dark Gray · VA confidence assignment · Ultra chip wording

### Missing this week
N2 · 5G-via-satellite · Camera Control · MagSafe on Ultra · Pro Max exclusive VA framing

---

## What to keep (do not “refactor away”)

- `motionPolicy` behavioural tiers  
- `ScrubStage` + pin-before-load + blend/quant gate  
- Confidence / editorial honesty (no fake Product schema)  
- Lean deps + Lenis rejection rationale  
- Measured asset pipeline  
- Playwright product-rule tests  
- `content-shell` + one headline size discipline  
- Real-buffer preloader (not a fake timer)

---

## Suggested execution order (1–2 day sprint)

1. Content P0 (VA / colours / Ultra chip) — interview safety  
2. Contrast + safe-area + README honesty — design/a11y quick wins  
3. Mobile video lite encodes + hero LCP path — Gate 5 score  
4. `copy.ts` centralization — editability promise  
5. `NEXT_PUBLIC_SITE_URL` + OG crop + deploy check  
6. Code-split Ultra act · 4× CPU trace · Sources refresh  

---

## Related artifacts

- `/workspace/rezerv-audit/design-audit.md`  
- `/workspace/rezerv-audit/eng-audit.md`  
- `/workspace/rezerv-audit/content-freshness.md`  
- `ClaudeCode-Rezerv/part-1/docs/lighthouse-*.report.*`

