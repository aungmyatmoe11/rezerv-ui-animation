# Display frame-scrub vs HTTP cache — research note

**Date:** 2026-09-08  
**Scope:** Primary sources only (RFC 9111, MDN, Next.js docs, GSAP ScrollTrigger).  
**Symptom:** Preview.app shows PNG frames 14–20 as a middle-phone rotation; localhost:3100 canvas looks stuck on a side-profile. Hypothesis: browser still serving old JPEGs despite `/frames/display/frame_NNNN.png?v=ezgif98`.

Legend: **Fact** = stated by a cited source. **Inference** = application of those facts to this app.

---

## 1. Can `immutable` + `max-age=31536000` keep serving old JPEGs after the URL changed to `.png?v=ezgif98`?

**Fact — no, not for the new URL.** RFC 9111 cache keys are the request method plus **target URI**. A cache may reuse a stored response only if “the presented target URI … and that of the stored response **match**”:

> The “cache key” … is composed from, at a minimum, the request method and target URI  
> — [RFC 9111 §2](https://www.rfc-editor.org/rfc/rfc9111.html#name-overview-of-cache-operation)

> a cache MUST NOT reuse a stored response unless: the presented target URI (Section 7.1 of [HTTP]) and that of the stored response match  
> — [RFC 9111 §4](https://www.rfc-editor.org/rfc/rfc9111.html#name-constructing-responses-from)

RFC 9111 does not spell out query strings; it defers “target URI” to HTTP (RFC 9110). That spec includes the query in the identifier:

> The hierarchical path component and optional query component identify the target resource  
> — [RFC 9110 §4.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-4.2)

MDN: responses are distinguished **by URL**; query versioning is an explicit cache-bust:

> The way that responses are distinguished from one another is essentially based on their URLs  
> — [MDN HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

> `# version in query` / `bundle.js?v=123` … the cache will not be reused again if the URL changes  
> — [MDN HTTP caching, Cache Busting](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

`/frames/display/frame_0014.jpg?v=d2560` and `/frames/display/frame_0014.png?v=ezgif98` are **different** target URIs → different cache entries. `immutable` on the old JPEG does not authorize serving it for the PNG URL.

**Inference:** Old JPEGs can still sit in disk cache under the **old** URL. They would paint only if the page still **requests** those old URLs (stale JS, hard-coded `.jpg`, or an `HTMLImageElement` whose `src` was never updated).

---

## 2. Next.js 15 `next dev`: do `headers()` Cache-Control values apply to `public/`? Does Image Optimization apply to raw `/frames/*.png`?

**Fact — custom headers are documented to run before `/public` files** (no `next dev` exception in the headers or CLI docs):

> Headers are checked before the filesystem which includes pages and `/public` files.  
> — [next.config `headers`](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)

Without a matching custom header, public files default to **not** long-cache:

> Next.js cannot safely cache assets in the `public` folder … `Cache-Control: public, max-age=0`  
> — [public folder](https://nextjs.org/docs/app/api-reference/file-conventions/public-folder)

Next.js’s own `public, max-age=31536000, immutable` is for hashed `_next` assets and **cannot** be set via `headers()` for those files; **other** responses may set `Cache-Control`:

> Next.js sets … `immutable` for truly immutable assets. It cannot be overridden. … However, you can set `Cache-Control` headers for other responses or data.  
> — [same headers page](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)

**Fact — Image Optimization is `next/image` → `/_next/image`, not a raw public GET.** Using `<Image src="/profile.jpg" />` emits `/_next/image?url=%2Fprofile.jpg&w=…`. Upstream files like `/some-asset.jpg` are distinct from `/_next/image`. You opt in by importing `next/image`.

**Inference:** Canvas `HTMLImageElement` loads of `/frames/display/frame_NNNN.png?v=…` are ordinary public-file fetches. They are not Image Optimization. Official docs do not say `headers()` is skipped in `next dev`; they also do not publish a `next dev` Cache-Control table — confirm with DevTools Network on localhost:3100.

---

## 3. Does `?v=ezgif98` bust cache for `immutable` resources (HTTP spec)?

**Fact:** RFC 9111 has **no `immutable` directive** (MDN documents it; MDN’s spec table points at RFC 8246, outside this source list). In RFC 9111, reuse still requires a **matching target URI**. A new query is a new URI, so it is a new cache key regardless of `immutable` on some other URL.

MDN: `immutable` means “will not be updated **while it’s fresh**” and is meant **with** cache-busting (new URL), not instead of it:

> The `immutable` response directive indicates that the response will not be updated while it's fresh.  
> A modern best practice … version/hashes in their URLs … That's called the cache-busting pattern.  
> — [MDN Cache-Control `immutable`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)

**Inference:** `?v=ezgif98` busts vs `?v=d2560`. It does **not** expire the old JPEG key. `immutable` only skips revalidation of **that** URL while `max-age` still holds.

---

## 4. GSAP `scrub: true` + `pin`: is progress linear? Can 6/98 frames be easy to miss?

**Fact — `scrub: true` ties animation progress 1:1 to ScrollTrigger progress** (no time lag; a **number** is the catch-up delay):

> `scrub: true` links the animation's progress directly to the ScrollTrigger's progress.  
> — [ScrollTrigger `scrub`](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

> progress … 0 is at the start, 0.5 is in the middle, and 1 is at the end.  
> — [ScrollTrigger.progress](https://gsap.com/docs/v3/Plugins/ScrollTrigger/progress)

Official helper maps progress to scroll with **linear** interpolation: `st.start + (st.end - st.start) * p`  
([getScrollPosition](https://gsap.com/docs/v3/HelperFunctions/helpers/getScrollPosition)).

`pin: true` sticks the trigger from start→end; default `pinSpacing` adds padding so later content waits  
([pin / pinSpacing](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)).

**Inference:** If 98 frames map uniformly across progress 0…1, six consecutive frames occupy ~6/97 ≈ **6%** of pin scroll. Preview.app shows each frame as a large thumbnail; a landing-page flick can skip that band. App lerp `smoothing=0.14` is **not** GSAP `scrub: 0.14` (seconds of catch-up). Extra lerp can further hide a short rotation. This is a strong alternative to “cached JPEGs,” not proof of it.

---

## 5. After `drawImage(HTMLImageElement)`, does HTTP cache still affect painted pixels?

**Fact:** Setting `src` **fetches**. `decode()` resolves when **image data is ready to use**. `drawImage` samples the element’s **already-decoded** bitmap (intrinsic size in CSS pixels).

> Setting `src` … triggers scheduling of a task to fetch the specified resource  
> — [HTMLImageElement.src](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/src)

> `decode()` … fulfills … once the image data is ready to be used  
> — [HTMLImageElement.decode()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode)

> `drawImage()` will always use the source element's intrinsic size  
> — [CanvasRenderingContext2D.drawImage()](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage)

**Inference:** HTTP cache matters on **fetch** of `src` (first load, or a later `src` assignment). Per-frame `drawImage` does not re-hit HTTP. An in-memory `Image` keeps its decoded pixels until `src` changes. Stale canvas ⇒ either the fetched URL was the old one, or scroll never lands on the rotation frames—not “immutable overwrote PNG with JPEG” for a new URL.

---

## Bottom line

| Claim | Verdict |
| --- | --- |
| Browser serves old JPEG for `.png?v=ezgif98` because of `immutable` | **Contradicted** by RFC 9111 URI-keyed cache + MDN cache-busting |
| `next/image` optimized the sequence | **No**, unless code uses `next/image` (then URLs would be `/_next/image?…`) |
| Short rotation easy to miss vs Preview filmstrip | **Plausible** given linear scrub/pin mapping (~6% of pin) |
| HTTP cache still paints after decode | **Only if `src` is fetched again**; `drawImage` uses in-memory pixels |
