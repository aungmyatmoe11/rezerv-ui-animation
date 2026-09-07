'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { preloadStore, usePreloadState } from '@/lib/motion/preloadStore';
import { useMotionPolicy } from '@/lib/motion/motionPolicy';
import styles from './Preloader.module.scss';

/**
 * The loader is a designed moment, not a spinner over a download.
 *
 * On a warm cache the hero is ready before the first paint, so a bar tied to
 * real progress jumps 0 → 100 in one frame and the screen reads as a glitch.
 * Displayed progress chases the real figure with a 0–100 floor (2.4s first
 * visit, 1.2s returning), so the count always travels. A slow connection still
 * leads: each small increment retargets from the current value and does not
 * wait out the full floor.
 *
 * Brand words need a beat to rise before the curtain can lift, independent of
 * how fast the count ran.
 */
const COUNT_FIRST_S = 2.4;
const COUNT_REPEAT_S = 1.2;
const BRAND_FIRST_MS = 1100;
const BRAND_REPEAT_MS = 700;
/** Nobody waits forever. Past this the page opens regardless. */
const MAX_VISIBLE_MS = 8000;
const VISIT_KEY = 'rezerv_visited';

function visitPace(): 'first' | 'repeat' {
  if (typeof sessionStorage === 'undefined') return 'first';
  const repeat = sessionStorage.getItem(VISIT_KEY) === 'true';
  sessionStorage.setItem(VISIT_KEY, 'true');
  return repeat ? 'repeat' : 'first';
}

export function Preloader() {
  const { phase, loaded, total } = usePreloadState();
  const policy = useMotionPolicy();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const countRef = useRef<HTMLSpanElement | null>(null);
  const meterRef = useRef<HTMLSpanElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const displayed = useRef(0);
  const [pace] = useState(visitPace);
  const [dismissed, setDismissed] = useState(false);
  const [brandReady, setBrandReady] = useState(false);
  const [barComplete, setBarComplete] = useState(false);

  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
  // 'failed' still opens the page — the video fallback carries the section.
  const settled = phase === 'ready' || phase === 'failed';
  const canExit = settled && brandReady && barComplete;

  useEffect(() => {
    const brandMs = pace === 'repeat' ? BRAND_REPEAT_MS : BRAND_FIRST_MS;
    const brand = window.setTimeout(() => setBrandReady(true), brandMs);
    const max = window.setTimeout(() => {
      preloadStore.unlockEntrance();
      setDismissed(true);
    }, MAX_VISIBLE_MS);
    return () => {
      window.clearTimeout(brand);
      window.clearTimeout(max);
    };
  }, [pace]);

  // Hand off as soon as the assets are ready, independent of the exit animation.
  //
  // This used to live in the exit timeline's onStart. That made a *state*
  // transition depend on a GSAP callback, and GSAP's ticker is rAF-driven: in a
  // backgrounded tab rAF is throttled to a stop, so the timeline never started,
  // the entrance never unlocked, and the hero film never played.
  useEffect(() => {
    if (canExit) preloadStore.unlockEntrance();
  }, [canExit]);

  // Scroll stays locked until the entrance timeline owns frame 0.
  useEffect(() => {
    document.body.dataset.scrollLocked = dismissed ? 'false' : 'true';
    return () => {
      document.body.dataset.scrollLocked = 'false';
    };
  }, [dismissed]);

  // ---- displayed progress: chase, never snap --------------------------------
  useGSAP(
    () => {
      const countEl = countRef.current;
      const meterEl = meterRef.current;
      const trackEl = trackRef.current;
      if (!countEl || !meterEl) return;

      const target = settled ? 100 : pct;
      const from = displayed.current;

      const write = (n: number) => {
        displayed.current = n;
        const rounded = Math.round(n);
        countEl.textContent = String(rounded).padStart(3, '0');
        meterEl.style.transform = `scaleX(${Math.max(n / 100, 0.015)})`;
        trackEl?.setAttribute('aria-valuenow', String(rounded));
      };

      if (policy.tier === 'static') {
        write(target);
        if (settled) setBarComplete(true);
        return;
      }

      const distance = Math.max(0, target - from);
      if (distance < 0.5) {
        write(target);
        if (settled && target >= 100) setBarComplete(true);
        return;
      }

      const full = pace === 'repeat' ? COUNT_REPEAT_S : COUNT_FIRST_S;
      const proxy = { n: from };
      const tween = gsap.to(proxy, {
        n: target,
        duration: Math.max(0.28, (distance / 100) * full),
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => write(proxy.n),
        onComplete: () => {
          write(target);
          if (settled && target >= 100) setBarComplete(true);
        },
      });

      return () => tween.kill();
    },
    { scope: rootRef, dependencies: [pct, settled, policy.tier, pace] },
  );

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
      if (!canExit || dismissed) return;
      const root = rootRef.current;
      if (!root) return;

      if (policy.tier === 'static') {
        setDismissed(true);
        return;
      }

      gsap
        .timeline({ delay: 0.14, onComplete: () => setDismissed(true) })
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
    { scope: rootRef, dependencies: [canExit, dismissed, policy.tier] },
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
          ref={trackRef}
          className={styles.track}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          aria-label="Loading the iPhone 18 Pro sequence"
        >
          <span ref={meterRef} className={styles.meter} />
        </div>

        <p className={styles.readout}>
          <span ref={countRef} className={styles.count}>
            000
          </span>
          <span className={styles.unit}>%</span>
        </p>
      </div>
    </div>
  );
}
