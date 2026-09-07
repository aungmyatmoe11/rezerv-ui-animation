import { expect, test } from '@playwright/test';
import { settle } from './helpers/metrics';

test.describe('aperture lab', () => {
  test('the photograph stops down when a visitor taps f/4', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);

    const heading = page.getByRole('heading', { name: 'Open the iris. Watch the photograph.' });
    await heading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);

    const f4 = page.getByRole('button', { name: 'f/4.0' });
    await f4.scrollIntoViewIfNeeded();
    await f4.click();

    await expect(page.getByText('Deep focus, less light').first()).toBeVisible();
    await expect(f4).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'City' }).click();
    await expect(page.getByRole('button', { name: 'City' })).toHaveAttribute('aria-pressed', 'true');

    const blur = await page.locator('[data-dragging]').evaluate((el) => {
      const wrap = el.querySelector('[style*="--blur"]') as HTMLElement | null;
      return wrap?.style.getPropertyValue('--blur') ?? '';
    });
    expect(Number.parseFloat(blur), 'stopped-down should almost lift the blur').toBeLessThan(1);
  });

  test('switching the sample scene leaves a single plate visible', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);

    await page
      .getByRole('heading', { name: 'Open the iris. Watch the photograph.' })
      .scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);

    const opacities = () =>
      page.locator('[data-scene]').evaluateAll((els) =>
        els.map((el) => Number(getComputedStyle(el).opacity)),
      );

    await page.getByRole('button', { name: 'City' }).click();
    await page.waitForTimeout(120);
    const mid = await opacities();
    expect(
      mid.filter((n) => n > 0.45).length,
      `both plates were on screen together mid-dissolve: ${mid.join(',')}`,
    ).toBeLessThan(2);

    await page.waitForTimeout(500);
    const end = await opacities();
    expect(end.filter((n) => n > 0.2).length, `settled plates: ${end.join(',')}`).toBe(1);
    expect(Math.max(...end)).toBeGreaterThan(0.95);
  });
});

test.describe('pro finishes', () => {
  test('Dark Gray is labelled as not expected', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);

    const heading = page.getByRole('heading', { name: 'A new shade of Pro.' });
    await heading.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2.4));
    await page.waitForTimeout(800);

    await expect(page.getByText('Early mockups — not expected')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Dark Gray, not expected' })).toBeVisible();
  });
});
