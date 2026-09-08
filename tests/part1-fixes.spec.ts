import { expect, test } from '@playwright/test';
import { MEDIA_REV } from '../src/data/media';
import { settle } from './helpers/metrics';

/**
 * Smoke checks for a11y, favicon, hero loader, and pin-on-failed-frames.
 */
test.describe('audit fixes', () => {
  test('named videos do not use role=img', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await expect(page.locator('video[role="img"]')).toHaveCount(0);
  });

  test('favicon.ico is present', async ({ page }) => {
    const res = await page.request.get('/favicon.ico');
    expect(res.status(), await res.text()).toBe(200);
    expect(res.headers()['content-type'] ?? '').toMatch(/icon|octet-stream|png/i);
  });

  test('hero poster preload shares the MEDIA_REV query', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const hrefs = await page.locator('link[rel="preload"][as="image"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? ''),
    );
    expect(hrefs.some((h) => h.includes(`/poster/hero.jpg?v=${MEDIA_REV}`)), hrefs.join(', ')).toBe(
      true,
    );
  });

  test('sensor callout indices meet 4.5:1 contrast', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'stacked video tier hides the pin overlay');
    await page.goto('/');
    await settle(page);

    await page.locator('#camera').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const ratio = await page.locator('[data-callout="0"] [data-label] span').first().evaluate((el) => {
      const parse = (value: string) => {
        const m = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return [0, 0, 0] as const;
        return [Number(m[1]), Number(m[2]), Number(m[3])] as const;
      };
      const channel = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      const lum = ([r, g, b]: readonly [number, number, number]) =>
        0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

      const cs = getComputedStyle(el);
      const fg = parse(cs.color);
      let node: HTMLElement | null = el.parentElement;
      let bg = parse('rgb(0, 0, 0)');
      while (node) {
        const value = getComputedStyle(node).backgroundColor;
        const parsed = parse(value);
        const alpha = /rgba?\([^)]+,\s*([0-9.]+)\)/.exec(value);
        if (parsed[0] + parsed[1] + parsed[2] > 0 || (alpha && Number(alpha[1]) > 0.4)) {
          bg = parsed;
          break;
        }
        node = node.parentElement;
      }
      const L1 = lum(fg);
      const L2 = lum(bg);
      const lighter = Math.max(L1, L2);
      const darker = Math.min(L1, L2);
      return (lighter + 0.05) / (darker + 0.05);
    });

    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test('a missing display sequence keeps the pin spacer', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'lite tier never pins');
    await page.route('**/frames/display/**', (route) => route.abort());
    await page.goto('/');
    await settle(page);

    await page.locator('#display').scrollIntoViewIfNeeded();
    await expect(page.locator('#display')).toHaveAttribute('data-mode', 'video', { timeout: 20_000 });
    await expect(page.locator('#display')).toHaveAttribute('data-layout', 'overlay');

    const hasSpacer = await page.evaluate(() => {
      const el = document.getElementById('display');
      return el?.parentElement?.classList.contains('pin-spacer') === true;
    });
    expect(hasSpacer, 'failed frames must not drop the pin spacer').toBe(true);
  });
});

test.describe('reduced-motion loader', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('opens on the poster without waiting on the 4K hero', async ({ page }) => {
    const started = Date.now();
    await page.goto('/');
    await settle(page);
    const elapsed = Date.now() - started;

    await expect(page.locator('#top video')).toHaveAttribute('preload', 'none');
    expect(elapsed, `curtain held for ${elapsed}ms`).toBeLessThan(5_000);
  });
});

test.describe('lite-tier hero', () => {
  test('opens on the poster and never fetches the 4K hero', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'lite clipVariant is the phone width');
    const fourK: string[] = [];
    page.on('request', (req) => {
      if (new URL(req.url()).pathname.endsWith('/hero.mp4')) fourK.push(req.url());
    });

    const started = Date.now();
    await page.goto('/');
    await settle(page);
    const elapsed = Date.now() - started;

    await expect(page.locator('#top video')).toHaveAttribute('preload', 'none');
    await expect(page.locator('#top video source')).toHaveAttribute('src', /hero-1280\.mp4/);
    expect(fourK, fourK.join(', ')).toEqual([]);
    expect(elapsed, `curtain held for ${elapsed}ms`).toBeLessThan(5_000);
  });
});
