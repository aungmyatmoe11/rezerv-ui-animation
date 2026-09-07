import { test } from '@playwright/test';
import {
  measureScrollPacing,
  recordScrollPath,
  sectionTop,
  settle,
  traceDocumentHeight,
} from './helpers/metrics';

/**
 * Not assertions — a measurement run.
 *
 * This file exists to produce the before/after numbers behind the smoothness
 * work. It prints and never fails, so it can be run against a known-bad build
 * without turning the suite red. The real gates live in scroll.spec.ts.
 *
 *   npx playwright test diagnose --project=desktop
 */
test.describe('diagnostics', () => {
  test('measure', async ({ page }) => {
    test.setTimeout(240_000);

    await page.goto('/');
    await settle(page);

    const height = await traceDocumentHeight(page);
    console.log('\n=== document height stability ===');
    console.log(JSON.stringify(height, null, 2));

    await page.reload();
    await settle(page);

    // Deliberately sampled inside the run of pinned films, where the paint cost
    // is highest, rather than over the text sections where anything looks fine.
    for (const from of [0, 8000, 18000]) {
      const pacing = await measureScrollPacing(page, { from, steps: 140, stepPx: 90 });
      console.log(`\n=== frame pacing from y=${from} ===`);
      console.log(JSON.stringify(pacing, null, 2));
    }

    await page.reload();
    await settle(page);

    // The long jump: hero to the sources, across every pinned section on the page.
    const target = await sectionTop(page, 'sources');
    const path = await recordScrollPath(page, async () => {
      await page.getByRole('link', { name: 'Sources' }).click();
    });
    const landed = await page.evaluate(() => Math.round(window.scrollY));
    const finalTarget = await sectionTop(page, 'sources');

    console.log('\n=== nav click: hero -> sources ===');
    console.log(
      JSON.stringify(
        {
          targetAtClick: target,
          targetAfter: finalTarget,
          landedAt: landed,
          missedByPx: Math.abs(landed - finalTarget),
          reversals: path.reversals,
          maxStepPx: path.maxStepPx,
          samples: path.samples.length,
        },
        null,
        2,
      ),
    );
  });
});
