import { expect, test } from '@playwright/test';
import { MOBILE_CLIP_WIDTH } from '../src/data/media';
import { clickNav, navLink, sectionTop, settle, traceDocumentHeight } from './helpers/metrics';

/**
 * The motion tiers, and the promise each one makes.
 *
 * Desktop and tablet scrub a canvas and pin; mobile and reduced motion show the
 * same footage as a looping clip. The complaint that started this was that the
 * two behaved inconsistently — some films animating, some not, and different
 * answers after a window resize. So the gates here are about consistency rather
 * than about any one effect: every film on a tier must behave the same way as
 * every other film on that tier.
 */
test.describe('responsive', () => {
  test('the loading count travels instead of jumping to 100', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const bar = page.getByRole('progressbar', { name: 'Loading the iPhone 18 Pro sequence' });
    await expect(bar).toBeVisible();

    const samples: number[] = [];
    const t0 = Date.now();
    while (Date.now() - t0 < 900) {
      samples.push(Number((await bar.getAttribute('aria-valuenow')) ?? '0'));
      await page.waitForTimeout(120);
    }

    const early = samples[0] ?? 0;
    const later = samples[samples.length - 1] ?? 0;
    expect(early, `first sample was ${early}; the count must not flash 100`).toBeLessThan(85);
    expect(later, `count did not climb (${samples.join(', ')})`).toBeGreaterThan(early);
  });

  test('every film uses the same treatment within a tier', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.goto('/');
    await settle(page);

    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight * 0.8) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 130));
      }
    });
    await page.waitForTimeout(800);

    const modes = await page.evaluate(() =>
      [...document.querySelectorAll('section[data-mode]')].map((s) => ({
        mode: (s as HTMLElement).dataset.mode,
        layout: (s as HTMLElement).dataset.layout,
      })),
    );

    expect(modes.length, 'all eight scrub stages should be on the page').toBe(8);

    const scrubbing = testInfo.project.name !== 'mobile';
    for (const entry of modes) {
      expect(entry.mode, JSON.stringify(modes)).toBe(scrubbing ? 'scrub' : 'video');
    }

    if (!scrubbing) {
      // The inconsistency a visitor could actually see: on the video tier some
      // films were laid out as a viewport-height stage with the copy over a
      // letterboxed clip, and others in normal flow. They are all in flow now.
      for (const entry of modes) {
        expect(entry.layout, JSON.stringify(modes)).toBe('stacked');
      }
    }
  });

  /**
   * The lite tier's contract: phones play every film at 1280px, including the
   * hero. Desktop and tablet keep native files. A desktop may briefly see the
   * SSR `hero-1280` snapshot before hydrating onto 4K; that leftover is ignored.
   */
  test('phones fetch the 1280 encodes; wider viewports do not', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    const paths: string[] = [];
    const failed: string[] = [];
    page.on('request', (req) => {
      const { pathname } = new URL(req.url());
      if (pathname.startsWith('/video/') && pathname.endsWith('.mp4')) paths.push(pathname);
    });
    page.on('response', (res) => {
      const { pathname } = new URL(res.url());
      if (pathname.startsWith('/video/') && pathname.endsWith('.mp4') && res.status() >= 400) {
        failed.push(`${res.status()} ${pathname}`);
      }
    });

    await page.goto('/');
    await settle(page);

    const suffix = `-${MOBILE_CLIP_WIDTH}.mp4`;
    const srcPaths = (
      await page.locator('video source').evaluateAll((els) =>
        els.map((el) => {
          const src = (el as HTMLSourceElement).getAttribute('src') ?? '';
          try {
            return new URL(src, 'http://local').pathname;
          } catch {
            return src.split('?')[0];
          }
        }),
      )
    ).filter((p): p is string => Boolean(p));

    if (testInfo.project.name === 'mobile') {
      expect(srcPaths.length, srcPaths.join(', ')).toBeGreaterThan(10);
      expect(srcPaths.every((p) => p.endsWith(suffix)), srcPaths.join(', ')).toBe(true);
      expect(srcPaths.some((p) => p.endsWith('/hero-1280.mp4'))).toBe(true);
    } else {
      expect(srcPaths.every((p) => !p.endsWith(suffix)), srcPaths.join(', ')).toBe(true);
      expect(srcPaths.some((p) => p.endsWith('/hero.mp4'))).toBe(true);
    }

    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight * 0.8) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 130));
      }
    });
    await page.waitForTimeout(1200);

    expect(failed, failed.join(', ')).toEqual([]);

    const unique = [...new Set(paths)];
    const native = unique.filter(
      (p) => p.endsWith('.mp4') && !p.endsWith(suffix) && !p.endsWith('/hero.mp4'),
    );
    const mobile = unique.filter((p) => p.endsWith(suffix));

    if (testInfo.project.name === 'mobile') {
      expect(native, unique.join(', ')).toEqual([]);
      expect(mobile.length, unique.join(', ')).toBeGreaterThan(10);
      expect(unique.some((p) => p.endsWith('/hero-1280.mp4'))).toBe(true);
      expect(unique.some((p) => p.endsWith('/hero.mp4'))).toBe(false);
    } else {
      const stray = mobile.filter((p) => !p.endsWith('/hero-1280.mp4'));
      expect(stray, unique.join(', ')).toEqual([]);
      expect(unique.some((p) => p.endsWith('/hero.mp4'))).toBe(true);
    }
  });

  test('the document height is stable on every viewport', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/');
    await settle(page);

    const trace = await traceDocumentHeight(page);
    expect(trace.jumps, `grew ${trace.grewBy}px`).toEqual([]);
  });

  test('nothing scrolls sideways', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    for (const fraction of [0, 0.3, 0.6, 0.9]) {
      await page.evaluate((f) => {
        window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * f);
      }, fraction);
      await page.waitForTimeout(300);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `at ${fraction * 100}% down the page`).toBeLessThanOrEqual(1);
    }
  });

  test('the nav fits and stays reachable', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
    await page.waitForTimeout(500);

    const nav = page.locator('header').first();
    await expect(nav).toHaveAttribute('data-visible', 'true');

    const box = await nav.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);

    // Every section is reachable even where the list has to scroll sideways.
    const items = await page.locator('[data-nav-id]').count();
    expect(items).toBe(9);
  });

  test('mobile capsules sit side by side without overlapping', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile');
    await page.goto('/');
    await settle(page);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
    await page.waitForTimeout(500);

    const wordmark = page.locator('header a[href="#top"]');
    const links = page.locator('nav[aria-label="Sections"]');
    const a = await wordmark.boundingBox();
    const b = await links.boundingBox();
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();

    const overlapX = Math.min(a!.x + a!.width, b!.x + b!.width) - Math.max(a!.x, b!.x);
    const overlapY = Math.min(a!.y + a!.height, b!.y + b!.height) - Math.max(a!.y, b!.y);
    expect(overlapX, 'wordmark and sections capsule overlap horizontally').toBeLessThanOrEqual(0);
    expect(overlapY > 0, 'capsules should share a row').toBe(true);
    expect(b!.x + b!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
    expect(b!.height, 'the sections capsule must stay one row tall').toBeLessThan(72);

    // The last section is reachable by scrolling the capsule sideways — no
    // popover, and the capsule itself does not grow to reach it.
    const sources = navLink(page, 'Sources');
    await sources.scrollIntoViewIfNeeded();
    await expect(sources).toBeVisible();
    const after = await links.boundingBox();
    expect(after!.width).toBeCloseTo(b!.width, 0);
  });

  test('the sections capsule hugs its items instead of filling the row', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'below 1024 the capsule is the scroll track');
    await page.goto('/');
    await settle(page);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
    await page.waitForTimeout(500);

    const links = page.locator('nav[aria-label="Sections"]');
    const box = await links.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width, 'sections capsule must not grow to fill leftover row').toBeLessThan(
      page.viewportSize()!.width * 0.62,
    );

    // All nine fit at this width, so nothing is parked out of sight.
    await expect(navLink(page, 'Sources')).toBeVisible();
  });

  /**
   * Below 1024 every section stays in the one list and the capsule scrolls
   * sideways. The bar used to promote three labels and hide the other six
   * behind a `⋯` menu; this pins down that they are all still in the bar and
   * that carrying them costs the capsule no extra width or height.
   */
  test('the compact bar scrolls sideways instead of folding into a menu', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop', 'the desktop bar shows every item outright');
    await page.goto('/');
    await settle(page);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
    await page.waitForTimeout(500);

    await expect(page.getByRole('button', { name: 'More sections' })).toHaveCount(0);

    const inBar = page
      .locator('header')
      .first()
      .locator('nav[aria-label="Sections"] ul a[data-nav-id]');
    await expect(inBar).toHaveCount(9);

    // The list is wider than the capsule that carries it: it scrolls.
    const scrolls = await page.evaluate(() => {
      const scroller = document.querySelector('nav[aria-label="Sections"] > div') as HTMLElement;
      const list = scroller.querySelector('ul') as HTMLElement;
      return list.scrollWidth > scroller.clientWidth + 1;
    });
    expect(scrolls, 'the compact list should overflow its capsule').toBe(true);

    const last = navLink(page, 'Sources');
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeVisible();

    const capsule = await page.locator('nav[aria-label="Sections"]').boundingBox();
    expect(capsule!.height, 'the capsule must stay one row tall').toBeLessThan(72);
    expect(capsule!.x + capsule!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  });

  test('the video tier does not prompt visitors to scroll-scrub', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'scrub stages keep the hint');
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);

    const hints = page.getByText('Scroll to turn');
    const count = await hints.count();
    expect(count, 'the copy is still in the DOM on at least one overlay').toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(hints.nth(i), `hint ${i}`).toBeHidden();
    }
  });

  test('the A20 disclosure remains readable on the video tier', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'scrub overlay is pinned on wider viewports');
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);

    const heading = page.getByRole('heading', { name: '2nm changes the equation.' });
    await heading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const caveat = page.getByText('Seven claims are rendered into the footage');
    await expect(caveat).toBeVisible();

    const badge = page.getByText('Concept render — figures unconfirmed');
    await expect(badge).toBeVisible();
    const badgePosition = await page.locator('#performance [data-mode]').evaluate((panel) => {
      const corner = panel.firstElementChild as HTMLElement | null;
      return corner ? getComputedStyle(corner).position : '';
    });
    expect(badgePosition, 'badge must sit in the copy column, not over the clip').toBe('static');
  });

  test('display overlay stats stay hidden until the film cues them', async ({ page }, testInfo) => {
    await page.goto('/');
    await settle(page);

    const top = await sectionTop(page, 'display');
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await page.waitForTimeout(500);

    const opacity = await page.locator('#display [data-stat]').first().evaluate((el) =>
      Number(getComputedStyle(el).opacity),
    );

    if (testInfo.project.name === 'mobile') {
      expect(opacity, 'video tier shows the stats in the flow').toBeGreaterThan(0.9);
    } else {
      expect(opacity, 'scrub rest must not flash the stats at pin start').toBeLessThan(0.1);
    }
  });

  test('pinned overlays promote will-change only while the stage is pinned', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'video tier does not pin');
    await page.goto('/');
    await settle(page);

    const resting = await page.evaluate(() => {
      const label = document.querySelector<HTMLElement>('[data-callout] [data-label]');
      const stage = label?.closest('section');
      return {
        pinned: stage?.dataset.pinned ?? '',
        willChange: label ? getComputedStyle(label).willChange : '',
      };
    });
    expect(resting.pinned).not.toBe('true');
    expect(resting.willChange === 'auto' || resting.willChange === 'none').toBe(true);

    await page.evaluate(() => {
      const stage = document.querySelector('[data-callout]')?.closest('section');
      if (!stage) return;
      const spacer = stage.parentElement?.classList.contains('pin-spacer')
        ? stage.parentElement
        : stage;
      const y = spacer.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, y + 24);
    });
    await page.waitForFunction(
      () => document.querySelector('[data-callout]')?.closest('section')?.dataset.pinned === 'true',
      null,
      { timeout: 8_000 },
    );

    const active = await page.evaluate(() => {
      const label = document.querySelector<HTMLElement>('[data-callout] [data-label]');
      const stage = label?.closest('section');
      return {
        pinned: stage?.dataset.pinned ?? '',
        willChange: label ? getComputedStyle(label).willChange : '',
      };
    });
    expect(active.pinned).toBe('true');
    expect(active.willChange).toMatch(/opacity|transform/);
  });
});

/**
 * Reduced motion is a separate contract: no pins, no scrub, and — the part
 * that is easy to get wrong — no content that only appears once something has
 * animated.
 */
test.describe('reduced motion', () => {
  /**
   * Emulated per test rather than through `test.use({ reducedMotion })` at
   * describe level, which did not reach the browser context here — the page
   * still reported `no-preference` and quietly tested the full-motion tier
   * instead. An explicit call also puts the precondition where a reader of the
   * test will look for it.
   */
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('shows every section without animating anything', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);

    const pins = await page.locator('.pin-spacer').count();
    expect(pins, 'reduced motion must not pin').toBe(0);

    // Walk down and confirm each headline is actually rendered and visible,
    // rather than sitting at opacity 0 waiting for a reveal that never runs.
    const headings = page.locator('h2');
    const count = await headings.count();
    expect(count).toBeGreaterThan(10);

    for (let i = 0; i < count; i++) {
      const h = headings.nth(i);
      await h.scrollIntoViewIfNeeded();
      await page.waitForTimeout(80);
      const opacity = await h.evaluate((el) => Number(getComputedStyle(el).opacity));
      expect(opacity, `heading ${i}: "${(await h.textContent())?.slice(0, 40)}"`).toBeGreaterThan(0.9);
    }
  });

  test('nav clicks still land', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
    await page.waitForTimeout(400);

    await clickNav(page, 'Sources');
    await page.waitForTimeout(500);

    const el = page.locator('#sources');
    await expect(el).toBeInViewport({ ratio: 0.1 });
  });
});
