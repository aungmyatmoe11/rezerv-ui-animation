import type { Locator, Page } from '@playwright/test';

/**
 * Shared measurement helpers.
 *
 * Everything here runs in the page, returns plain JSON, and never depends on a
 * selector that only exists in one section — so the same helper can measure the
 * page before and after a change and the two numbers are comparable.
 */

/** Wait out the preloader. It has an 8s hard ceiling of its own. */
export async function settle(page: Page): Promise<void> {
  await page.waitForFunction(() => document.body.dataset.scrollLocked !== 'true', null, {
    timeout: 20_000,
  });
  await page.waitForTimeout(400);
}

export interface FramePacing {
  frames: number;
  medianMs: number;
  p90Ms: number;
  p99Ms: number;
  worstMs: number;
  /** Frames that took longer than two 60Hz refreshes — the visible stutters. */
  droppedOver33ms: number;
  longTaskCount: number;
  longTaskTotalMs: number;
}

/**
 * Scroll a fixed distance one animation frame at a time and record how long each
 * frame took.
 *
 * Driving from rAF rather than a timer is the point: it produces the same
 * one-step-per-frame cadence as a trackpad drag, so a frame that overruns is a
 * frame the visitor would have seen stutter.
 */
export async function measureScrollPacing(
  page: Page,
  { from, steps = 150, stepPx = 90 }: { from: number; steps?: number; stepPx?: number },
): Promise<FramePacing> {
  await page.evaluate((y) => window.scrollTo(0, y), from);
  await page.waitForTimeout(600);

  return page.evaluate(
    async ({ steps, stepPx }) => {
      const longTasks: number[] = [];
      let observer: PerformanceObserver | undefined;
      try {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) longTasks.push(entry.duration);
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        /* longtask unsupported — the frame numbers still stand on their own */
      }

      const gaps: number[] = [];
      await new Promise<void>((resolve) => {
        let last = performance.now();
        let i = 0;
        const step = (now: number) => {
          gaps.push(now - last);
          last = now;
          if (i++ >= steps) return resolve();
          window.scrollBy(0, stepPx);
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
      observer?.disconnect();

      // The first few frames cover the transition out of idle, not scrolling.
      const s = gaps.slice(5).sort((a, b) => a - b);
      const at = (q: number) => Math.round((s[Math.floor(s.length * q)] ?? 0) * 10) / 10;

      return {
        frames: gaps.length,
        medianMs: at(0.5),
        p90Ms: at(0.9),
        p99Ms: at(0.99),
        worstMs: Math.round(s[s.length - 1] ?? 0),
        droppedOver33ms: s.filter((v) => v > 33).length,
        longTaskCount: longTasks.length,
        longTaskTotalMs: Math.round(longTasks.reduce((a, b) => a + b, 0)),
      };
    },
    { steps, stepPx },
  );
}

export interface HeightTrace {
  startHeight: number;
  endHeight: number;
  grewBy: number;
  /** Every discrete jump in document height seen while walking down the page. */
  jumps: { atScrollY: number; deltaPx: number }[];
  biggestJumpPx: number;
}

/**
 * Walk the page top to bottom and record every change in document height.
 *
 * A page whose height changes while you are scrolling through it cannot feel
 * smooth: every ScrollTrigger below the change re-measures, and anything the
 * visitor is looking at moves under them. On a stable page this returns no jumps.
 */
export async function traceDocumentHeight(page: Page): Promise<HeightTrace> {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  return page.evaluate(async () => {
    const jumps: { atScrollY: number; deltaPx: number }[] = [];
    const start = document.documentElement.scrollHeight;
    let prev = start;

    for (let i = 0; i < 60; i++) {
      window.scrollBy(0, window.innerHeight * 0.75);
      await new Promise((r) => setTimeout(r, 260));
      const h = document.documentElement.scrollHeight;
      if (h !== prev) {
        jumps.push({ atScrollY: Math.round(window.scrollY), deltaPx: h - prev });
        prev = h;
      }
      if (window.scrollY + window.innerHeight >= h - 2) break;
    }

    return {
      startHeight: start,
      endHeight: prev,
      grewBy: prev - start,
      jumps,
      biggestJumpPx: jumps.reduce((m, j) => Math.max(m, Math.abs(j.deltaPx)), 0),
    };
  });
}

/**
 * Where a section actually begins, accounting for pinning.
 *
 * A pinned section is `position: fixed` while its pin is live, so its own rect
 * reports the viewport. The `.pin-spacer` ScrollTrigger leaves behind holds the
 * real position, which is what both the nav and these tests have to measure.
 */
export async function sectionTop(page: Page, id: string): Promise<number> {
  return page.evaluate((sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return Number.NaN;
    const parent = el.parentElement;
    const anchor = parent?.classList.contains('pin-spacer') ? parent : el;
    return Math.round(anchor.getBoundingClientRect().top + window.scrollY);
  }, id);
}

/** Scroll position samples taken while a nav-driven scroll is in flight. */
export async function recordScrollPath(
  page: Page,
  trigger: () => Promise<void>,
  durationMs = 2600,
): Promise<{ samples: number[]; reversals: number; maxStepPx: number }> {
  await page.evaluate(() => {
    (window as unknown as { __path: number[] }).__path = [];
    const push = () => {
      (window as unknown as { __path: number[] }).__path.push(Math.round(window.scrollY));
      (window as unknown as { __pathRaf: number }).__pathRaf = requestAnimationFrame(push);
    };
    push();
  });

  await trigger();
  await page.waitForTimeout(durationMs);

  return page.evaluate(() => {
    const w = window as unknown as { __path: number[]; __pathRaf: number };
    cancelAnimationFrame(w.__pathRaf);
    const samples = w.__path;

    let reversals = 0;
    let maxStep = 0;
    let direction = 0;
    for (let i = 1; i < samples.length; i++) {
      const delta = samples[i]! - samples[i - 1]!;
      if (Math.abs(delta) > maxStep) maxStep = Math.abs(delta);
      if (delta === 0) continue;
      const d = Math.sign(delta);
      // A direction change larger than a rounding wobble is the page visibly
      // snapping back — the "flash" a visitor reports after clicking a nav item.
      if (direction !== 0 && d !== direction && Math.abs(delta) > 24) reversals++;
      direction = d;
    }
    return { samples, reversals, maxStepPx: maxStep };
  });
}

/**
 * A link in the site nav, and only there.
 *
 * The sources section at the foot of the page links out to reporting whose
 * accessible names contain the same words as the nav labels — "Battery",
 * "Colours" — so an unscoped `getByRole('link', ...)` matches two or three
 * elements and fails strict mode. Scoping to the header is also the honest
 * thing to assert: these tests are about the nav.
 */
export function navLink(page: Page, label: string): Locator {
  return page.locator('header').first().getByRole('link', { name: label, exact: true });
}
