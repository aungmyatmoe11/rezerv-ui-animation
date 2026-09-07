'use client';

import { useRef } from 'react';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { ScrubStage, useScrubTimeline } from '@/components/ScrubStage';
import { SectionHead } from '@/components/SectionHead';
import { ULTRA_SPECS } from '@/data/ultra';
import styles from './UltraHero.module.scss';

const ALT =
  'Concept render of a folding iPhone resolving out of a wireframe into a finished device.';

/**
 * Section 13 — the Ultra hero. Scroll resolves the wireframe into the device.
 *
 * This is the anchor the hero's "Discover iPhone Ultra" call to action points
 * at, which is why the id lives here rather than on the transition above it.
 *
 * The eyebrow leads with "Name not confirmed" on purpose. Ultra and Fold are
 * both in circulation and the page has no basis for picking one.
 */
export function UltraHero() {
  return (
    <ScrubStage
      id="ultra"
      slug="ultra-hero"
      alt={ALT}
      pinVh={2.2}
      smoothing={0.42}
      fit="contain"
      mediaHeight={0.9}
      videoLayout="stacked"
      hint="Scroll to resolve"
    >
      <UltraHeroPanel />
    </ScrubStage>
  );
}

function UltraHeroPanel() {
  const ref = useRef<HTMLDivElement | null>(null);

  const mode = useScrubTimeline(ref, (tl, root) => {
    const specs = root.querySelectorAll<HTMLElement>('[data-spec]');
    if (!specs.length) return;
    tl.fromTo(
      specs,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.12, stagger: 0.04 },
      0.45,
    );
  });

  return (
    <div ref={ref} className={styles.panel} data-mode={mode}>
      <div className={styles.copy}>
        <SectionHead
          tone="film"
          eyebrow="Name not confirmed"
          title="iPhone Ultra"
          lede="Apple’s first foldable iPhone is expected to use a book-style design: compact when closed, tablet-like when opened. An iPhone that opens into more."
          badge={
            <ConfidenceBadge level="developing" size="sm">
              Ultra or Fold — unsettled
            </ConfidenceBadge>
          }
        />

        <dl className={styles.specs}>
          {ULTRA_SPECS.map((spec) => (
            <div key={spec.label} className={styles.spec} data-spec>
              <dt className={styles.specLabel}>{spec.label}</dt>
              <dd className={styles.specValue}>{spec.value}</dd>
              <dd className={styles.specBadge}>
                <ConfidenceBadge level={spec.confidence} size="sm" />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
