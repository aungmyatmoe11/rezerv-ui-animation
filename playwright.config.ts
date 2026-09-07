import { defineConfig, devices } from '@playwright/test';

/**
 * The suite runs against a PRODUCTION build, not `next dev`.
 *
 * Everything these tests assert is a timing or layout property — frame pacing,
 * document-height stability, how far a nav click lands from its target. Dev mode
 * double-invokes effects under StrictMode and ships an unminified bundle, so its
 * numbers say nothing about what a visitor gets. `NEXT_DIST_DIR` keeps the build
 * out of `.next`, so a dev server can stay running while the suite builds.
 */
const PORT = Number(process.env.PW_PORT ?? 3210);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,

  /**
   * One worker, and this is a memory limit rather than a preference.
   *
   * Measured on an 8GB machine: a second worker holds free memory at ~57MB for
   * the length of the run, and the OS then kills whichever process it likes —
   * in practice the Next server, whose own footprint is only 25-95MB. The suite
   * goes red with ERR_CONNECTION_REFUSED, which reads like eight broken tests
   * and is really one dead server. Each worker drives a page holding several
   * decoding videos, so this suite is bound by memory long before CPU.
   *
   * scroll.spec.ts and diagnose.spec.ts would keep it at 1 regardless: their
   * thresholds are wall-clock milliseconds, so a second browser on the same
   * cores does not make them slower, it makes them wrong.
   *
   * Raise it from the command line where the headroom exists, not here:
   *
   *   npx playwright test --workers=2
   */
  workers: 1,
  forbidOnly: !!process.env.CI,

  /**
   * One retry locally too.
   *
   * A test killed with the server under memory pressure is an infrastructure
   * blip, not a regression: `next start` brings the server back within seconds,
   * and the retry passes. Without this, one blip reports as a suite full of
   * failures in sections that were never touched.
   */
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 120_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    video: 'off',
    screenshot: 'only-on-failure',
  },

  /**
   * All three viewports run on Chromium.
   *
   * The named Apple device descriptors default to WebKit, which is a separate
   * ~200MB download that most machines here will not have. What these tests
   * assert is layout and motion-tier behaviour, and the tiers are chosen from
   * media queries that resolve identically on any engine — so emulating the
   * viewports on one engine tests the thing that matters and keeps the suite
   * runnable from a clean checkout. Add WebKit deliberately with
   * `npx playwright install webkit` if engine parity ever becomes the question.
   *
   * The three widths are the assessment's three targets, and they land one on
   * each side of both motion-tier breakpoints: 1024 (full) and 768 (tablet).
   */
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 834, height: 1112 },
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: true,
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  /**
   * The server has to outlive the whole run, and twice it did not.
   *
   * Both failures present identically — every test from some point onward dies
   * with ERR_CONNECTION_REFUSED in ~200ms, which reads like a section of the
   * page breaking and is really the server being gone:
   *
   *  1. The OS kills it under memory pressure. That is the one measured here,
   *     and the guard against it is `workers` above, not anything in this block.
   *  2. A run started straight after another one finds the port still listening,
   *     concludes a server is already up, and adopts a process that is in the
   *     middle of exiting. `gracefulShutdown` closes that window: SIGTERM and
   *     wait, so the port is genuinely free before this process exits.
   *
   * CI additionally refuses to reuse anything it did not start.
   */
  webServer: {
    command: `npx next start --port ${PORT}`,
    // Set here rather than inline in the command so the same line works in
    // cmd.exe and in a POSIX shell.
    env: { NEXT_DIST_DIR: '.next-prod' },
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
