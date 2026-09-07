import { expect, test } from '@playwright/test';
import {
  measureScrollPacing,
  navLink,
  recordScrollPath,
  sectionTop,
  settle,
  traceDocumentHeight,
} from './helpers/metrics';

/**
 * The smoothness gates.
 *
 * Each of these locks in a specific defect that was measured on the build
 * before this work, so a regression fails the suite rather than being noticed
 * on a phone three weeks later. The measured "before" numbers are quoted next
 * to each threshold — they are what the assertion exists to prevent.
 */
test.describe('scroll', () => {
  test.describe.configure({ mode: 'serial' });

  /**
   * The one that mattered most.
   *
   * Pins used to be created only once a section's frames had downloaded, and the
   * frames are fetched a viewport and a half out — so each of the eight scrub
   * sections added its own pin distance to the document while the visitor was
   * scrolling toward it. Measured: 29,340px grew to 43,650px in seven jumps of
   * 1,620-2,520px. Everything else on this page that felt wrong was downstream
   * of that.
   */
  test('document height never changes while scrolling', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);

    const trace = await traceDocumentHeight(page);

    expect(
      trace.jumps,
      `document grew by ${trace.grewBy}px while scrolling; pins must be reserved at mount`,
    ).toEqual([]);
    expect(trace.grewBy).toBe(0);
  });

  /**
   * Frame pacing through the pinned run.
   *
   * Before: median 33-50ms with 105-135 of 141 frames over 33ms, and 47-61 long
   * tasks totalling 3.1-4.3 seconds per two-second burst. The two causes were
   * the canvas backing store being built at twice the source resolution, and the
   * nav and back-to-top control each forcing a synchronous layout on every
   * scroll event.
   *
   * The thresholds are deliberately looser than the numbers now achieved (median
   * 16.7ms, zero long tasks) — headless Chromium has no GPU and CI machines
   * vary, so these catch a real regression without failing on a noisy run.
   */
  test('holds frame pacing through the pinned films', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/');
    await settle(page);

    for (const from of [0, 8000, 18000]) {
      const pacing = await measureScrollPacing(page, { from, steps: 120, stepPx: 90 });
      const detail = `from y=${from}: ${JSON.stringify(pacing)}`;

      expect(pacing.medianMs, detail).toBeLessThanOrEqual(25);
      expect(pacing.droppedOver33ms / pacing.frames, detail).toBeLessThan(0.45);
      expect(pacing.longTaskTotalMs, detail).toBeLessThan(600);
    }
  });

  /**
   * A long nav jump lands exactly, and never travels.
   *
   * Two failures are covered. Landing short was the old symptom of a moving
   * target — a click on "Evidence" finished 12,620px above it. Travelling is the
   * "flash": animating a 31,000px scroll strobed thirty screens of film past at
   * 3,029px per frame. Long journeys now cut behind a curtain instead, so the
   * scroll position moves once.
   */
  test('a long nav jump lands on target without travelling through the page', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);

    const path = await recordScrollPath(page, async () => {
      await navLink(page, 'Sources').click();
    });

    const target = await sectionTop(page, 'sources');
    const landed = await page.evaluate(() => Math.round(window.scrollY));

    expect(Math.abs(landed - target), `landed ${landed}, target ${target}`).toBeLessThanOrEqual(4);
    expect(path.reversals, 'the page must not visibly snap back mid-journey').toBe(0);

    // One big step is the cut, which happens behind the curtain. What must not
    // happen is a run of big steps — that is the strobe.
    const bigSteps = path.samples.filter(
      (y, i) => i > 0 && Math.abs(y - path.samples[i - 1]!) > 1500,
    ).length;
    expect(bigSteps, 'a long jump must move the scroll position once, not repeatedly').toBeLessThanOrEqual(1);
  });

  /** A short hop is close enough to read, so it eases rather than cutting. */
  test('a short nav hop eases instead of cutting', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);

    const colours = await sectionTop(page, 'colors');
    await page.evaluate((y) => window.scrollTo(0, y), colours + 200);
    await page.waitForTimeout(700);

    const path = await recordScrollPath(
      page,
      async () => {
        await navLink(page, 'Colors').click();
      },
      1800,
    );

    const moved = path.samples.filter((y, i) => i > 0 && y !== path.samples[i - 1]).length;
    expect(moved, 'a near hop should be animated across several frames').toBeGreaterThan(4);
    expect(path.maxStepPx, 'and should never step further than a viewport').toBeLessThan(900);
  });

  test('the back-to-top control returns to the top', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);

    await page.evaluate(() => window.scrollTo(0, 20_000));
    await page.waitForTimeout(600);

    const button = page.getByRole('button', { name: 'Back to top' });
    await expect(button).toBeVisible();
    await button.click();
    await page.waitForTimeout(1400);

    expect(await page.evaluate(() => Math.round(window.scrollY))).toBeLessThanOrEqual(2);
  });
});
