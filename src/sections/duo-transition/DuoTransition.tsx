'use client';

import type React from 'react';
import { useRef } from 'react';
import { clipAspect, clipRatio } from '@/data/media';
import { LazyVideo } from '@/components/LazyVideo';
import { Section } from '@/components/Section';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/motion/motionPolicy';
import styles from './DuoTransition.module.scss';

const ALT =
  'Foldable iPhone opening in two hands, cover display to inner home screen, ' +
  'shot in a white studio.';

/**
 * Section 12 — the act break from Pro to Duo.
 *
 * Delivery is `rotate.mp4` (slug `duo-transition`): a 12s cut from the
 * YouTube Duo plate (source 1.00s–13.00s). White studio, so the film sits
 * in a card. No scale scrub: a 0.94→1 would upscale a sharp plate and read
 * as soft. Opacity is ramped instead — a sudden white rectangle on a black
 * page is a photosensitivity hit (WCAG 2.3.1).
 */
export function DuoTransition() {
  const scope = useRef<HTMLDivElement | null>(null);
  const policy = useMotionPolicy();

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const stage = root.querySelector<HTMLElement>('[data-stage]');
      if (!stage) return;

      // Default CSS keeps the card visible. Reduced motion never dims it.
      if (policy.tier === 'static') {
        gsap.set(stage, { autoAlpha: 1 });
        return;
      }

      if (!policy.canPin) {
        gsap.set(stage, { autoAlpha: 0.35 });
        const st = ScrollTrigger.create({
          trigger: root,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.set(stage, { willChange: 'opacity' });
            gsap.to(stage, {
              autoAlpha: 1,
              duration: 0.8,
              ease: 'power2.out',
              overwrite: true,
              onComplete: () => gsap.set(stage, { willChange: 'auto' }),
            });
          },
        });
        return () => st.kill();
      }

      // Scrub uses ease none so scroll and opacity stay 1:1. Numeric scrub
      // (0.8s) is the only smoothing — not a tween ease.
      gsap.fromTo(
        stage,
        { autoAlpha: 0.35 },
        {
          autoAlpha: 1,
          ease: 'none',
          duration: 1,
          immediateRender: true,
          scrollTrigger: {
            trigger: root,
            start: 'top 78%',
            end: 'top 28%',
            scrub: 0.8,
            onToggle: (self) => {
              gsap.set(stage, { willChange: self.isActive ? 'opacity' : 'auto' });
            },
          },
        },
      );
    },
    { scope, dependencies: [policy.canPin, policy.tier] },
  );

  return (
    <Section rhythm="loose">
      <div ref={scope} className={styles.wrap}>
        <p className={styles.line} data-reveal>
          But Pro may not be the top of the line anymore.
        </p>

        <div
          className={styles.stage}
          data-stage
          style={
            {
              aspectRatio: clipAspect('duo-transition'),
              '--clip-ratio': String(clipRatio('duo-transition')),
            } as React.CSSProperties
          }
        >
          <LazyVideo slug="duo-transition" alt={ALT} fit="contain" loop={false} />
        </div>

        <p className={`${styles.line} ${styles.lineLate}`} data-reveal>
          A new form factor is coming into focus.
        </p>
      </div>
    </Section>
  );
}
