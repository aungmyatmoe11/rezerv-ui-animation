'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/motion/motionPolicy';
import { ISLAND } from '@/data/pro';
import styles from './DynamicIsland.module.scss';

/**
 * Two pill bars: today's cutout, and the rumoured one shrinking to ~65% of it.
 *
 * The width change is a scaleX from the centre — the island narrows
 * symmetrically, and transform is the only property touched. The millimetre
 * readout is written to a text node from the same timeline, so the bar and
 * the number can never disagree.
 *
 * Desktop and tablet bind the timeline to scroll (scrub), so it runs backwards
 * when the visitor does. Mobile plays it once on arrival: the policy table
 * reserves scroll-linked motion for larger viewports, and a one-shot tween is
 * cheaper than evaluating a scrub on every touch event. Reduced motion shows
 * the end state and nothing moves.
 */
export function IslandGauge() {
  const ref = useRef<HTMLDivElement | null>(null);
  const policy = useMotionPolicy();

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;

      const pill = root.querySelector<HTMLElement>('[data-pill="rumoured"]');
      const readout = root.querySelector<HTMLElement>('[data-readout]');
      const delta = root.querySelector<HTMLElement>('[data-delta]');
      if (!pill || !readout || !delta) return;

      const state: { mm: number } = { mm: ISLAND.currentMm };
      const write = () => {
        readout.textContent = state.mm.toFixed(1);
      };

      if (policy.tier === 'static') {
        state.mm = ISLAND.rumouredMm;
        write();
        gsap.set(pill, { scaleX: ISLAND.ratio });
        return;
      }

      const scrubbed = policy.canPin;
      const tl = gsap
        .timeline({
          paused: true,
          defaults: { duration: 1, ease: scrubbed ? 'none' : 'power2.inOut' },
        })
        .to(pill, { scaleX: ISLAND.ratio }, 0)
        .to(state, { mm: ISLAND.rumouredMm, onUpdate: write }, 0)
        .fromTo(
          delta,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' },
          0.75,
        );

      const st = ScrollTrigger.create(
        scrubbed
          ? {
              trigger: root,
              start: 'top 80%',
              end: 'top 30%',
              scrub: 0.6,
              animation: tl,
              onToggle: (self) => {
                gsap.set(pill, { willChange: self.isActive ? 'transform' : 'auto' });
              },
            }
          : {
              trigger: root,
              start: 'top 85%',
              once: true,
              onEnter: () => {
                gsap.set(pill, { willChange: 'transform' });
                tl.eventCallback('onComplete', () => gsap.set(pill, { willChange: 'auto' }));
                tl.play();
              },
            },
      );

      return () => {
        gsap.set(pill, { willChange: 'auto' });
        st.kill();
      };
    },
    { scope: ref, dependencies: [policy.tier, policy.canPin] },
  );

  return (
    <div ref={ref} className={styles.gauge}>
      <div className={styles.gaugeRow}>
        <span className={styles.gaugeLabel}>Current approximation</span>
        <div className={styles.track}>
          <span className={styles.pill} data-pill="current" />
        </div>
        <span className={styles.gaugeValue}>{ISLAND.currentMm.toFixed(1)} mm</span>
      </div>

      <div className={styles.gaugeRow}>
        <span className={styles.gaugeLabel}>Rumoured</span>
        <div className={styles.track}>
          <span className={`${styles.pill} ${styles.pillRumour}`} data-pill="rumoured" />
        </div>
        <span className={styles.gaugeValue}>
          {/* The live number is decoration for sighted users; the static
              figure is what assistive tech reads. */}
          <span aria-hidden="true">
            <span data-readout>{ISLAND.currentMm.toFixed(1)}</span> mm
          </span>
          <span className="visually-hidden">about {ISLAND.rumouredMm} mm</span>
        </span>
      </div>

      <p className={styles.delta} data-delta>
        About 35% narrower, if the reports hold.
      </p>
    </div>
  );
}
