'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Registered exactly once, here. No other module calls gsap.registerPlugin —
// double registration is a common source of "trigger fires twice" bugs.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);

  // ScrollTrigger caches layout on refresh. Recomputing on every resize tick
  // is what causes resize jank on a page with ~30 triggers, so we let it
  // settle instead.
  ScrollTrigger.config({ ignoreMobileResize: true });
  bindIosUrlBarRefresh();
}

/**
 * `ignoreMobileResize` skips window resizes whose width did not change — the
 * iOS URL-bar show/hide. Pins then sit on stale start/end values and the film
 * jumps when the bar retracts. visualViewport still sees that height delta, so
 * we refresh only then: same width, a real URL-bar-sized height change, on a
 * touch layout. Desktop window drags never match, so they keep the cheap path.
 */
function bindIosUrlBarRefresh() {
  const viewport = window.visualViewport;
  if (!viewport) return;

  let lastWidth = viewport.width;
  let lastHeight = viewport.height;
  let timer = 0;

  viewport.addEventListener('resize', () => {
    const width = viewport.width;
    const height = viewport.height;
    const widthDelta = Math.abs(width - lastWidth);
    const heightDelta = Math.abs(height - lastHeight);
    lastWidth = width;
    lastHeight = height;

    if (viewport.scale !== 1) return;
    if (!window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    if (widthDelta >= 1) return;
    if (heightDelta < 40) return;

    window.clearTimeout(timer);
    timer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
  });
}

export { gsap, ScrollTrigger, useGSAP };
