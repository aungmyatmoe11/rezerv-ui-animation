import { expect, test } from '@playwright/test';
import { settle } from './helpers/metrics';

/** Scroll a heading into view and let its section settle. */
async function goToHeading(
  page: import('@playwright/test').Page,
  text: string,
): Promise<void> {
  const heading = page.getByRole('heading', { name: text });
  await heading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
}

/**
 * The two sections that were redesigned, and the rules their designs depend on.
 */
test.describe('thinness', () => {
  test('presents the film as a band with its edges feathered into the page', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);
    await goToHeading(page, 'Thin enough to change the compromises.');

    const band = page.locator('figure div').first();
    const geometry = await page.evaluate(() => {
      const video = [...document.querySelectorAll('video')].find((v) =>
        v.querySelector('source')?.src.includes('thickness'),
      );
      const box = video?.closest('figure')?.querySelector('div');
      if (!box) return null;
      const rect = box.getBoundingClientRect();
      const cs = getComputedStyle(box);
      return {
        ratio: rect.width / rect.height,
        masked: cs.maskImage !== 'none' && cs.maskImage.includes('gradient'),
        clipped: cs.overflow === 'clip' || cs.overflow === 'hidden',
      };
    });

    expect(geometry).not.toBeNull();
    // A strip, not the clip's own 2.38:1 frame dropped into a box.
    expect(geometry!.ratio, 'the band should be a wide strip').toBeGreaterThan(2.2);
    expect(geometry!.masked, 'the band edges must be feathered, not cut').toBe(true);
    expect(geometry!.clipped).toBe(true);
    await expect(band).toBeVisible();
  });

  /**
   * The page's editorial rule: a number rendered into a shot is not reprinted
   * beside it. The rail decodes which figure is which without quoting either.
   */
  test('decodes the two figures without reprinting them', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);
    await goToHeading(page, 'Thin enough to change the compromises.');

    await expect(page.getByText('The unfolded chassis')).toBeVisible();
    await expect(page.getByText('The closed-body reference')).toBeVisible();

    const sectionText = await page.evaluate(() => {
      const h = [...document.querySelectorAll('h2')].find((n) =>
        n.textContent?.includes('Thin enough'),
      );
      let s: HTMLElement | null = h as HTMLElement;
      while (s && s.tagName !== 'SECTION') s = s.parentElement;
      return s?.textContent ?? '';
    });

    expect(sectionText).not.toContain('4.5');
    expect(sectionText).not.toContain('5.6');
  });

  test('the band opens rather than staying collapsed', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await settle(page);
    await goToHeading(page, 'Thin enough to change the compromises.');

    // Scroll the BAND into view, not the headline. On a phone the section is
    // tall enough that the band is still below the fold when the headline is
    // centred, and a reveal that has not been reached yet is not a bug.
    await page.evaluate(() => {
      const video = [...document.querySelectorAll('video')].find((v) =>
        v.querySelector('source')?.src.includes('thickness'),
      );
      video?.closest('figure')?.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(1800);

    const scaleY = await page.evaluate(() => {
      const video = [...document.querySelectorAll('video')].find((v) =>
        v.querySelector('source')?.src.includes('thickness'),
      );
      const box = video?.closest('figure')?.querySelector('div') as HTMLElement | undefined;
      if (!box) return null;
      const m = new DOMMatrixReadOnly(getComputedStyle(box).transform);
      return m.d;
    });

    expect(scaleY, 'the reveal must finish, not leave a hairline').toBeGreaterThan(0.98);
  });
});

test.describe('fold captions', () => {
  test('the two sizes never share the cell on the scrub tier', async ({ page }, testInfo) => {
    test.setTimeout(150_000);
    await page.goto('/');
    await settle(page);

    const caption = page.getByText('One device. Two states.');
    await caption.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const read = () =>
      page.locator('[data-state]').evaluateAll((els) =>
        els.map((el) => ({
          state: (el as HTMLElement).dataset.state,
          opacity: Number(getComputedStyle(el).opacity),
        })),
      );

    if (testInfo.project.name === 'mobile') {
      const rows = await read();
      expect(rows.every((r) => r.opacity > 0.9), JSON.stringify(rows)).toBe(true);
      return;
    }

    const section = page.locator('section').filter({ hasText: 'One device. Two states.' });
    await section.evaluate((el) => {
      const spacer = (el.parentElement?.classList.contains('pin-spacer')
        ? el.parentElement
        : el) as HTMLElement;
      spacer.scrollIntoView({ block: 'start' });
    });
    await page.waitForTimeout(400);

    const start = await read();
    expect(start.find((r) => r.state === 'closed')!.opacity).toBeGreaterThan(0.85);
    expect(start.find((r) => r.state === 'open')!.opacity).toBeLessThan(0.2);

    const span = await section.evaluate((el) => {
      const spacer = (el.parentElement?.classList.contains('pin-spacer')
        ? el.parentElement
        : el) as HTMLElement;
      return spacer.offsetHeight;
    });

    // Halfway through the pin is the old overlap (0.50–0.55). After the yield,
    // both labels should be near zero rather than both half-visible.
    await page.evaluate((y) => window.scrollBy(0, y), Math.round(span * 0.52));
    await page.waitForTimeout(350);
    const mid = await read();
    const bothLit = mid.every((r) => r.opacity > 0.35);
    expect(bothLit, `double-exposure at the swap: ${JSON.stringify(mid)}`).toBe(false);
  });
});

test.describe('ultra finishes', () => {
  test('the film edges are feathered against the page', async ({ page }, testInfo) => {
    test.setTimeout(150_000);
    test.skip(testInfo.project.name === 'mobile', 'no canvas on the video tier');

    await page.goto('/');
    await settle(page);
    await goToHeading(page, 'Two shades, thinly sourced.');
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(1200);

    const mask = await page.evaluate(() => {
      const section = [...document.querySelectorAll('section[data-fit="contain"]')].find((s) => {
        const r = s.getBoundingClientRect();
        return r.top < 100 && r.bottom > 400;
      });
      const canvas = section?.querySelector('canvas');
      if (!canvas) return null;
      const cs = getComputedStyle(canvas);
      return {
        hasMask: cs.maskImage.includes('gradient'),
        // The mask box must be the PICTURE, not the element — with `contain`
        // they are different rectangles and masking the element leaves the
        // real edge as hard as it was.
        picW: cs.getPropertyValue('--pic-w').trim(),
        picH: cs.getPropertyValue('--pic-h').trim(),
        maskSize: cs.maskSize,
      };
    });

    expect(mask, 'expected a contained scrub canvas in view').not.toBeNull();
    expect(mask!.hasMask).toBe(true);
    expect(mask!.picW).toMatch(/px$/);
    expect(mask!.picH).toMatch(/px$/);
    expect(mask!.maskSize).toContain(mask!.picW);
  });

  /**
   * The finish name used to carry `text-shadow: 0 0 60px var(--swatch)`, which
   * against Silver is a grey smear sitting on the letterforms. The tint is a
   * bloom behind the text now, so the glyphs themselves take no shadow.
   */
  test('the finish name carries no text shadow', async ({ page }) => {
    test.setTimeout(150_000);
    await page.goto('/');
    await settle(page);
    await goToHeading(page, 'Two shades, thinly sourced.');
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2.6));
    await page.waitForTimeout(900);

    const name = page.getByRole('heading', { name: 'Silver' });
    await name.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const shadow = await name.evaluate((el) => getComputedStyle(el).textShadow);
    expect(shadow === 'none' || shadow === '').toBe(true);
  });

  test('the picker still switches finish', async ({ page }) => {
    test.setTimeout(150_000);
    await page.goto('/');
    await settle(page);
    await goToHeading(page, 'Two shades, thinly sourced.');
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2.6));
    await page.waitForTimeout(900);

    // The radio itself is visually hidden and its swatch chip sits over it, so
    // click the label — which is what a visitor clicks.
    const indigo = page.locator('label').filter({ hasText: 'Indigo' }).first();
    await indigo.scrollIntoViewIfNeeded();
    await indigo.click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('radio', { name: 'Indigo' })).toBeChecked();

    await expect(page.getByRole('heading', { name: 'Indigo' })).toBeVisible();
  });
});
