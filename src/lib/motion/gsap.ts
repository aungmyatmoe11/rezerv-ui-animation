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
}

export { gsap, ScrollTrigger, useGSAP };
