'use client';

import type { RefObject } from 'react';
import { gsap, ScrollTrigger, useGSAP } from './gsap';
import { useMotionPolicy } from './motionPolicy';

export interface RevealOptions {
  /** Elements to reveal. Defaults to anything marked `data-reveal`. */
  selector?: string;
  y?: number;
  stagger?: number;
  duration?: number;
  start?: string;
}

/**
 * The page's one reveal primitive. Every non-scrub section uses it, which is
 * why 20 sections need ~20 ScrollTriggers rather than ~200.
 *
 * ScrollTrigger.batch groups elements that cross the threshold in the same
 * frame into a single staggered tween, instead of creating one trigger per
 * element.
 *
 * Animates opacity and transform only — never a layout-triggering property.
 */
export function useSectionReveal(
  scope: RefObject<HTMLElement | null>,
  {
    selector = '[data-reveal]',
    y = 28,
    stagger = 0.08,
    duration = 0.85,
    start = 'top 82%',
  }: RevealOptions = {},
): void {
  const policy = useMotionPolicy();

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const targets = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(selector));
      if (targets.length === 0) return;

      // Reduced motion still needs the content visible — the reveal is the
      // only thing that gets dropped, never the content.
      if (policy.tier === 'static') {
        gsap.set(targets, { opacity: 1, y: 0, clearProps: 'transform' });
        return;
      }

      // NOTE: no will-change here. Setting it at setup meant every element the
      // visitor had not reached yet held a compositor layer for the whole
      // session — 183 of them at once, measured. It is promoted for the length
      // of its own tween and demoted again immediately after.
      gsap.set(targets, { opacity: 0, y });

      const batch = ScrollTrigger.batch(targets, {
        start,
        once: true,
        onEnter: (elements) =>
          gsap.to(elements, {
            opacity: 1,
            y: 0,
            duration,
            stagger,
            ease: 'power3.out',
            overwrite: true,
            willChange: 'opacity, transform',
            // Dropping will-change after the tween keeps ~20 sections from
            // holding compositor layers for the whole session. The inline
            // transform goes too: once revealed, an element's own CSS owns its
            // transform again, so a hover lift declared in a stylesheet is not
            // silently overridden by a leftover translate(0px, 0px).
            onComplete: () => gsap.set(elements, { willChange: 'auto', clearProps: 'transform' }),
          }),
      });

      return () => batch.forEach((t) => t.kill());
    },
    { scope, dependencies: [policy.tier, selector, y, stagger, duration, start] },
  );
}
