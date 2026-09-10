'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/motion/motionPolicy';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { CONFIDENCE_MAP } from '@/data/duo';
import styles from './ConfidenceMap.module.scss';

/**
 * Section 19 — the one part of this experience with no equivalent on any Apple
 * product page, and the thing that makes it a reconstruction rather than a fan
 * render. It costs nothing in assets.
 *
 * Every bar draws from zero to its own width on a single ScrollTrigger, in one
 * staggered tween rather than eight triggers. `scaleX` is the only property
 * animated, so nothing reflows.
 *
 * The width is decorative. Each row states its grade in words and carries an
 * aria-valuenow, so the ranking survives with no colour, no width and no
 * motion at all.
 */
export function ConfidenceMap() {
  const ref = useRef<HTMLDivElement | null>(null);
  const policy = useMotionPolicy();

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;

      const bars = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-bar]'));
      if (!bars.length) return;

      const setFinal = () =>
        bars.forEach((bar) => {
          bar.style.transform = `scaleX(${bar.dataset.value ?? '1'})`;
        });

      if (policy.tier === 'static') {
        setFinal();
        return;
      }

      gsap.set(bars, { scaleX: 0 });

      const trigger = ScrollTrigger.create({
        trigger: root,
        start: 'top 78%',
        once: true,
        onEnter: () => {
          gsap.to(bars, {
            scaleX: (_i: number, target: HTMLElement) => Number(target.dataset.value ?? 1),
            duration: 1.1,
            stagger: 0.07,
            ease: 'power3.out',
            willChange: 'transform',
            onComplete: () => gsap.set(bars, { willChange: 'auto' }),
          });
        },
      });

      return () => trigger.kill();
    },
    { scope: ref, dependencies: [policy.tier] },
  );

  return (
    <Section id="evidence">
      <SectionHead
        eyebrow="Evidence"
        title="How confident is each rumour?"
        lede="Everything on this page is pre-announcement reporting. Presenting all of it with equal authority would be the dishonest choice, so here is the whole page ranked by how much weight each claim can actually carry."
      />

      <div ref={ref} className={styles.map}>
        {CONFIDENCE_MAP.map((row) => (
          <div key={row.claim} className={styles.row} data-reveal>
            <div className={styles.head}>
              <span className={styles.claim}>{row.claim}</span>
              <ConfidenceBadge level={row.level} size="sm" />
            </div>

            <div
              className={styles.track}
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(row.value * 100)}
              aria-label={`Confidence in ${row.claim}`}
            >
              <span className={styles.bar} data-bar data-value={row.value} data-level={row.level} />
            </div>

            <p className={styles.note}>{row.note}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
