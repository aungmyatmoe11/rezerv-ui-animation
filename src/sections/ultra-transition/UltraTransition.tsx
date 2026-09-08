'use client';

import { useRef } from 'react';
import { ScrollTrigger, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/motion/motionPolicy';
import { LazyVideo } from '@/components/LazyVideo';
import { Section } from '@/components/Section';
import { clipAspect } from '@/data/media';
import styles from './UltraTransition.module.scss';

const ALT =
  'Concept render: a bright white scene resolving into the words iPhone Ultra, the only ' +
  'light-toned clip in the sequence.';

/**
 * Section 12 — the act break from Pro to Ultra.
 *
 * `ultra-transition.mp4` is the ONLY bright clip in the library; everything
 * else sits on pure black. That makes it the natural hinge of the page, and
 * also the one real accessibility hazard on it.
 *
 * It is therefore played inside a hairline-bordered card that never fills the
 * viewport, and it ramps up rather than cuts: scroll scrubs the card's opacity
 * from 0.3 to 1 alongside a small scale, so the bright area grows gradually and
 * never covers enough of the screen fast enough to read as a flash. A
 * full-viewport black-to-white cut here would be a WCAG 2.3.1 risk.
 *
 * Content spec §19 says plainly: do not "fix" this back to full-bleed.
 */
export function UltraTransition() {
  const ref = useRef<HTMLDivElement | null>(null);
  const policy = useMotionPolicy();

  useGSAP(
    () => {
      const card = ref.current?.querySelector<HTMLElement>('[data-card]');
      if (!card) return;

      const rest = () => {
        card.style.removeProperty('opacity');
        card.style.removeProperty('transform');
        card.style.willChange = 'auto';
      };

      // Reduced motion and mobile get the calm end state, never a ramp.
      // Clearing inline props matters when `canPin` flips mid-scroll: the last
      // onUpdate values would otherwise stick at 0.3 opacity / 0.94 scale.
      if (!policy.canPin) {
        rest();
        return;
      }

      const tween = ScrollTrigger.create({
        trigger: card,
        start: 'top 88%',
        end: 'center 55%',
        scrub: 0.8,
        animation: undefined,
        onToggle: (self) => {
          card.style.willChange = self.isActive ? 'opacity, transform' : 'auto';
        },
        onUpdate: (self) => {
          const p = self.progress;
          card.style.opacity = String(0.3 + 0.7 * p);
          card.style.transform = `scale(${0.94 + 0.06 * p})`;
        },
      });

      return () => {
        rest();
        tween.kill();
      };
    },
    { scope: ref, dependencies: [policy.canPin] },
  );

  return (
    <Section rhythm="loose">
      <div ref={ref} className={styles.wrap}>
        <p className={styles.line} data-reveal>
          But Pro may not be the top of the line anymore.
        </p>

        <div
          className={styles.card}
          data-card
          style={{ aspectRatio: clipAspect('ultra-transition') }}
        >
          <LazyVideo slug="ultra-transition" alt={ALT} fit="cover" />
        </div>

        <p className={`${styles.line} ${styles.lineLate}`} data-reveal>
          A new form factor is coming into focus.
        </p>
      </div>
    </Section>
  );
}
