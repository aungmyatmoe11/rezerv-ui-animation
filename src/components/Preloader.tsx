'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { preloadStore, usePreloadState } from '@/lib/motion/preloadStore';
import { useMotionPolicy } from '@/lib/motion/motionPolicy';
import styles from './Preloader.module.scss';

/**
 * Hold long enough for the loading screen to read as a designed moment rather
 * than a flash of black. The hero film usually buffers faster than this on a
 * warm cache, so without a floor the loader appeared and vanished in one frame,
 * which looked like a glitch.
 *
 * Repeat visits: skip the 2s floor, show only until assets load.
 */
const MIN_VISIBLE_MS = 2000;
const MIN_VISIBLE_REPEAT_MS = 400; // ပြန်လည်လာရောက်သောအခါ တိုတောင်းသော အချိန်သာ
/** Nobody waits forever. Past this the page opens regardless. */
const MAX_VISIBLE_MS = 8000;
const VISIT_KEY = 'rezerv_visited';

export function Preloader() {
  const { phase, loaded, total } = usePreloadState();
  const policy = useMotionPolicy();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [canDismiss, setCanDismiss] = useState(false);

  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
  // 'failed' still opens the page — the video fallback carries the section.
  const settled = phase === 'ready' || phase === 'failed';

  useEffect(() => {
    // Check if this is a repeat visit within the session
    const hasVisited = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(VISIT_KEY) === 'true';
    const minDelay = hasVisited ? MIN_VISIBLE_REPEAT_MS : MIN_VISIBLE_MS;

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(VISIT_KEY, 'true');
    }

    const min = window.setTimeout(() => setCanDismiss(true), minDelay);
    const max = window.setTimeout(() => {
      // Release the hero too, or the page opens on a frozen film.
      preloadStore.unlockEntrance();
      setDismissed(true);
    }, MAX_VISIBLE_MS);
    return () => {
      window.clearTimeout(min);
      window.clearTimeout(max);
    };
  }, []);

  // Hand off as soon as the assets are ready, independent of the exit animation.
  //
  // This used to live in the exit timeline's onStart. That made a *state*
  // transition depend on a GSAP callback, and GSAP's ticker is rAF-driven: in a
  // backgrounded tab rAF is throttled to a stop, so the timeline never started,
  // the entrance never unlocked, and the hero film never played.
  useEffect(() => {
    if (settled && canDismiss) preloadStore.unlockEntrance();
  }, [settled, canDismiss]);

  // Scroll stays locked until the entrance timeline owns frame 0.
  useEffect(() => {
    document.body.dataset.scrollLocked = dismissed ? 'false' : 'true';
    return () => {
      document.body.dataset.scrollLocked = 'false';
    };
  }, [dismissed]);

  // ---- entrance: the loader is itself a designed moment -------------------
  useGSAP(
    () => {
      if (policy.tier === 'static') return;
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .fromTo(
          `.${styles.brandWord}`,
          { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.07 },
        )
        .fromTo(
          [`.${styles.track}`, `.${styles.readout}`],
          { opacity: 0 },
          { opacity: 1, duration: 0.6, stagger: 0.08 },
          '-=0.5',
        );
    },
    { scope: rootRef, dependencies: [policy.tier] },
  );

  // ---- exit ----------------------------------------------------------------
  useGSAP(
    () => {
      if (!settled || !canDismiss || dismissed) return;
      const root = rootRef.current;
      if (!root) return;

      if (policy.tier === 'static') {
        setDismissed(true);
        return;
      }

      gsap
        .timeline({ onComplete: () => setDismissed(true) })
        .to(`.${styles.meter}`, { scaleX: 1, duration: 0.34, ease: 'power2.inOut' })
        .to(
          [`.${styles.readout}`, `.${styles.eyebrow}`],
          { opacity: 0, y: -8, duration: 0.28, stagger: 0.04 },
          '-=0.1',
        )
        .to(`.${styles.brandWord}`, { yPercent: -110, duration: 0.5, stagger: 0.05 }, '-=0.2')
        .to(`.${styles.track}`, { scaleX: 0, transformOrigin: 'right center', duration: 0.4 }, '<')
        // The curtain lifts rather than dissolving, so the hero is revealed
        // from the bottom edge instead of ghosting through a fade.
        .to(root, { yPercent: -100, duration: 0.72, ease: 'power3.inOut' }, '-=0.15');
    },
    { scope: rootRef, dependencies: [settled, canDismiss, dismissed, policy.tier] },
  );

  if (dismissed) return null;

  return (
    <div ref={rootRef} className={styles.root} data-phase={phase}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Unofficial concept</p>

        <p className={styles.brand} aria-hidden="true">
          {['iPhone', '18', 'Pro'].map((word) => (
            <span key={word} className={styles.brandMask}>
              <span className={styles.brandWord}>{word}</span>
            </span>
          ))}
        </p>

        <div
          className={styles.track}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Loading the iPhone 18 Pro sequence"
        >
          <span
            className={styles.meter}
            style={{ transform: `scaleX(${Math.max(pct / 100, 0.015)})` }}
          />
        </div>

        <p className={styles.readout}>
          <span className={styles.count}>{String(pct).padStart(3, '0')}</span>
          <span className={styles.unit}>%</span>
        </p>
      </div>
    </div>
  );
}
