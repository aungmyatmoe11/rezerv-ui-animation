import { expect, test } from '@playwright/test';
import { navLink, sectionTop, settle } from './helpers/metrics';

/**
 * The nav's active state.
 *
 * It used to be one ScrollTrigger per item with an `onToggle` callback, which
 * failed two ways. The triggers were built at mount, before any scrub section
 * had pinned, so two of the nine were measured against elements that later
 * became `position: fixed`. And `onToggle` only fires when a trigger's active
 * state changes between updates, so a fast scroll — a nav click above all —
 * could step clean over a section without registering it, leaving the previous
 * item lit. In practice "Sources" stayed highlighted halfway up the page.
 *
 * It is now a pure function of the scroll position over cached offsets, which
 * is what these tests pin down.
 */
test.describe('nav', () => {
  test.describe.configure({ mode: 'serial' });

  /** Nav item order must match document scroll order. */
  test('items appear in scroll order, not priority order', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    // Scroll past hero so nav becomes visible
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
    await page.waitForTimeout(500);

    // Debug: check how many nav elements exist
    const navCount = await page.evaluate(() =>
      document.querySelectorAll('nav[aria-label="Sections"]').length
    );
    console.log('Nav elements found:', navCount);

    // Debug: get all links
    const allLinks = await page.evaluate(() => {
      const navs = document.querySelectorAll('nav[aria-label="Sections"]');
      return Array.from(navs).map((nav, i) => ({
        navIndex: i,
        links: Array.from(nav.querySelectorAll('a[data-nav-id]')).map(el => el.getAttribute('data-nav-id'))
      }));
    });
    console.log('All nav links:', JSON.stringify(allLinks, null, 2));

    // Get the nav link order from the main list only (select ul > li > a within the nav)
    const navOrder = await page.evaluate(() =>
      Array.from(document.querySelectorAll('nav[aria-label="Sections"] ul > li > a[data-nav-id]'))
        .map((el) => el.getAttribute('data-nav-id'))
        .filter(Boolean),
    );

    // Expected scroll order matching page.tsx component sequence
    const expectedOrder = [
      'colors',
      'design',
      'camera',
      'performance',
      'battery',
      'ultra',
      'compare-ultra',
      'evidence',
      'sources',
    ];

    expect(navOrder).toEqual(expectedOrder);
  });

  test('is hidden over the hero and appears past it', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    const header = page.locator('header').first();
    await expect(header).toHaveAttribute('data-visible', 'false');

    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
    await page.waitForTimeout(500);
    await expect(header).toHaveAttribute('data-visible', 'true');
  });

  test('highlights the section actually on screen, at every anchor', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/');
    await settle(page);

    // Walk the page once so every pin exists and every offset is final.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight * 0.8) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
    });
    await page.waitForTimeout(600);

    const ids = ['colors', 'design', 'camera', 'performance', 'battery', 'ultra', 'evidence', 'sources'];

    for (const id of ids) {
      const top = await sectionTop(page, id);
      // Just inside the section, past the 42% reading line.
      await page.evaluate((y) => window.scrollTo(0, y), top + 120);
      await page.waitForTimeout(350);

      const active = await page.evaluate(() =>
        document.querySelector('[data-nav-id][data-active="true"]')?.getAttribute('data-nav-id'),
      );
      expect(active, `at ${id} (y=${top + 120}) the nav highlighted ${active}`).toBe(id);
    }
  });

  test('never highlights more than one item', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);

    for (const fraction of [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.98]) {
      await page.evaluate((f) => {
        window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * f);
      }, fraction);
      await page.waitForTimeout(300);

      const count = await page.locator('[data-nav-id][data-active="true"]').count();
      expect(count, `at ${fraction * 100}% of the page`).toBeLessThanOrEqual(1);
    }
  });

  /**
   * Clicking must not leave a focus ring parked on the item that was clicked.
   * The screenshot that started this had a ring around "Camera" three sections
   * after it had been clicked.
   */
  test('a clicked item does not keep focus', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
    await page.waitForTimeout(400);

    await navLink(page, 'Battery').click();
    await page.waitForTimeout(900);

    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-nav-id'));
    expect(focused).toBeFalsy();
  });

  /** Keyboard users still get a ring, and the link still navigates. */
  test('stays keyboard operable', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
    await page.waitForTimeout(400);

    const link = navLink(page, 'Battery');
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);

    const target = await sectionTop(page, 'battery');
    const landed = await page.evaluate(() => Math.round(window.scrollY));
    expect(Math.abs(landed - target)).toBeLessThanOrEqual(6);
  });

  /** Nav clicks must not push history entries or leave a hash behind. */
  test('does not write the section into the address bar', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
    await page.waitForTimeout(400);

    await navLink(page, 'Evidence').click();
    await page.waitForTimeout(900);

    expect(new URL(page.url()).hash).toBe('');
  });
});
