'use client';

import { useRef } from 'react';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { LazyVideo } from '@/components/LazyVideo';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/motion/motionPolicy';
import { THICKNESS } from '@/data/duo';
import styles from './Thickness.module.scss';

const ALT =
  'Concept render of a foldable iPhone seen edge on, with thickness measurements drawn ' +
  'against the chassis.';

/**
 * Section 15 — thinness as the cause of the compromises, not a spec brag.
 *
 * The previous version put the copy and the film in a 5/7 split. On paper that
 * is the same idiom the battery and modem sections use; in practice it failed,
 * because those sections hold a shot of a whole device and this one holds a
 * phone seen edge on. Dropped into a half-width box the subject is a 40px sliver
 * of chassis floating in several hundred pixels of the render's own near-black
 * backdrop — which does not match the page's black, so the "film box" read as a
 * grey plate with a scratch in it. Two columns of nothing much, side by side.
 *
 * So the section is stacked and the film is a band: cropped hard to a strip
 * barely taller than the object it contains, run almost the full width, edges
 * feathered into the page so there is no plate at all. The subject fills its
 * frame for the first time.
 *
 * The band also opens from a hairline as it arrives, which is the one piece of
 * motion on the page that argues rather than decorates: the section's whole
 * claim is thinness, so the layout performs it. Two counter-scaled transforms,
 * no layout, once per visit.
 *
 * Nothing here repeats the numbers rendered into the footage — the hero
 * established that rule and it holds. What the rail beneath adds is the thing
 * prose kept fumbling: which of the two figures on screen is which.
 */
export function Thickness() {
  const bandRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const policy = useMotionPolicy();

  useGSAP(
    () => {
      const band = bandRef.current;
      const inner = innerRef.current;
      if (!band || !inner) return;

      if (policy.tier === 'static') {
        gsap.set([band, inner], { clearProps: 'transform' });
        return;
      }

      // The window opens while the picture inside it counter-scales, so the
      // frame is revealed rather than stretched. Both are transforms, so the
      // whole gesture stays on the compositor.
      const CLOSED = 0.04;

      gsap
        .timeline({
          scrollTrigger: { trigger: band, start: 'top 80%', once: true },
          defaults: { duration: 1.15, ease: 'power3.out' },
          onComplete: () => gsap.set([band, inner], { willChange: 'auto' }),
        })
        .fromTo(
          band,
          { scaleY: CLOSED, willChange: 'transform' },
          { scaleY: 1 },
          0,
        )
        .fromTo(
          inner,
          { scaleY: 1 / CLOSED, willChange: 'transform' },
          { scaleY: 1 },
          0,
        );
    },
    { dependencies: [policy.tier] },
  );

  return (
    <Section>
      <div className={styles.head}>
        <SectionHead
          eyebrow="Thinness"
          title="Thin enough to change the compromises."
          lede="Reports place the unfolded device in the mid-4 mm range. If that holds, the chassis is the reason for several of the trade-offs on this page rather than an achievement separate from them."
          badge={
            <ConfidenceBadge level="developing" size="sm">
              Pre-release estimate
            </ConfidenceBadge>
          }
        />
      </div>

      <figure className={styles.figure}>
        <div className={styles.band} ref={bandRef}>
          <div className={styles.bandInner} ref={innerRef}>
            <LazyVideo slug="thickness" alt={ALT} fit="cover" />
          </div>
        </div>

        <figcaption className={styles.legend}>
          <dl className={styles.rail}>
            {THICKNESS.decode.map((row) => (
              <div key={row.key} className={styles.railRow} data-reveal>
                <dt className={styles.railKey}>{row.key}</dt>
                <dd className={styles.railValue}>{row.value}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.note} data-reveal>
            {THICKNESS.note}
          </p>
        </figcaption>
      </figure>
    </Section>
  );
}
