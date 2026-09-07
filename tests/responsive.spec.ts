import { expect, test } from '@playwright/test';
import { MOBILE_CLIP_WIDTH } from '../src/data/media';
import { navLink, settle, traceDocumentHeight } from './helpers/metrics';

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
   * The lite tier's contract: phones play the same films at 1280px, never the
   * native 2880px files. The hero is the exception — the preloader waits on it,
   * so it stays the 4K file in every viewport.
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
    const srcs = await page.locator('video source').evaluateAll((els) =>
      els.map((el) => (el as HTMLSourceElement).getAttribute('src') ?? ''),
    );
    const lazySrcs = srcs.filter((s) => !s.endsWith('/hero.mp4'));

    if (testInfo.project.name === 'mobile') {
      expect(lazySrcs.length, srcs.join(', ')).toBeGreaterThan(10);
      expect(lazySrcs.every((s) => s.endsWith(suffix)), lazySrcs.join(', ')).toBe(true);
    } else {
      expect(lazySrcs.every((s) => !s.endsWith(suffix)), lazySrcs.join(', ')).toBe(true);
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
      expect(unique.some((p) => p.endsWith('/hero.mp4'))).toBe(true);
    } else {
      expect(mobile, unique.join(', ')).toEqual([]);
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

    await navLink(page, 'Sources').click();
    await page.waitForTimeout(500);

    const el = page.locator('#sources');
    await expect(el).toBeInViewport({ ratio: 0.1 });
  });
});
