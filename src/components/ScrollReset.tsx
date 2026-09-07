'use client';

import { useEffect } from 'react';

/**
 * A reload always starts at the top.
 *
 * Two separate things used to reopen the page mid-scroll:
 *
 * 1. Browsers restore the previous scroll offset on reload by default. On a
 *    page whose first act is a preloader and a one-shot hero film, that means
 *    reloading dropped you into the middle of a pinned section with the film
 *    already over.
 * 2. The nav wrote `#colors` into the URL, so a reload then jumped to that
 *    anchor as well.
 *
 * The nav no longer writes a hash (see lib/motion/scrollTo.ts). This turns off
 * the browser's own restoration, and strips any hash that is still in the URL
 * from an older session or a shared link before it can be acted on.
 *
 * Runs in a layout effect timed before paint so the visitor never sees the
 * restored position flash past.
 */
export function ScrollReset() {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (window.location.hash) {
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search,
      );
    }

    window.scrollTo(0, 0);
  }, []);

  return null;
}
