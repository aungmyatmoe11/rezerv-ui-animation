'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/motion/motionPolicy';
import { subscribeScroll } from '@/lib/motion/scrollState';
import { scrollToTop } from '@/lib/motion/scrollTo';
import styles from './BackToTop.module.scss';

/** Matches `pathLength` on the ring below — see the note in the effect. */
const RING_LENGTH = 100;

/**
 * Floating return-to-top control, bottom right.
 *
 * Kept, deliberately. The page is thirty screens of scroll-driven film with
 * eight pinned sections; scrolling back from the sources by hand is a genuinely
 * long trip, and this is the only control that shortens it. The jolt it used to
 * produce was never the button's fault — it was the page growing underneath an
 * animated 31,000px scroll. With the document height fixed and long journeys now
 * cutting rather than travelling (lib/motion/scrollTo.ts), the trip home is a
 * dip to black and back.
 *
 * The ring is a real progress indicator, drawn with `stroke-dashoffset`.
 */
export function BackToTop() {
  const [shown, setShown] = useState(false);
  const rootRef = useRef<HTMLButtonElement | null>(null);
  const ringRef = useRef<SVGCircleElement | null>(null);
  const policy = useMotionPolicy();

  useEffect(
    () =>
      subscribeScroll(({ y, progress }) => {
        setShown((prev) => {
          const next = y > window.innerHeight * 2;
          return prev === next ? prev : next;
        });

        const ring = ringRef.current;
        // `pathLength="100"` on the circle re-bases the dash units, so the
        // offset is just a percentage and `getTotalLength()` — a geometry query
        // that forced a layout on every single scroll event — is never called.
        if (ring) ring.style.strokeDashoffset = String(RING_LENGTH * (1 - progress));
      }),
    [],
  );

  useGSAP(
    () => {
      const el = rootRef.current;
      if (!el) return;

      if (policy.tier === 'static') {
        gsap.set(el, { opacity: shown ? 1 : 0, scale: 1, y: 0 });
        return;
      }

      gsap.to(el, {
        opacity: shown ? 1 : 0,
        scale: shown ? 1 : 0.8,
        y: shown ? 0 : 12,
        duration: 0.42,
        ease: shown ? 'back.out(1.7)' : 'power2.in',
        overwrite: true,
      });
    },
    { dependencies: [shown, policy.tier] },
  );

  return (
    <button
      ref={rootRef}
      type="button"
      className={styles.button}
      onClick={scrollToTop}
      aria-label="Back to top"
      // Kept out of the tab order while off screen so a keyboard user does not
      // land on an invisible control.
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
    >
      <svg className={styles.ring} viewBox="0 0 44 44" aria-hidden="true" focusable="false">
        <circle className={styles.ringTrack} cx="22" cy="22" r="20" />
        <circle
          ref={ringRef}
          className={styles.ringProgress}
          cx="22"
          cy="22"
          r="20"
          pathLength={RING_LENGTH}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH}
        />
      </svg>
      <span className={styles.arrow} aria-hidden="true">
        ↑
      </span>
    </button>
  );
}
