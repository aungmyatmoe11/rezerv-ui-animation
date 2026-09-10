'use client';

import { useRef } from 'react';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { ScrubStage, useScrubTimeline } from '@/components/ScrubStage';
import { SectionHead } from '@/components/SectionHead';
import { DUO_SPECS } from '@/data/duo';
import styles from './DuoHero.module.scss';

const ALT =
  'Concept render of a folding iPhone resolving out of a wireframe into a finished device.';

/**
 * Section 13 — the Duo hero. Scroll resolves the wireframe into the device.
 *
 * This is the anchor the hero's "Discover iPhone Duo" call to action points
 * at, which is why the id lives here rather than on the transition above it.
 *
 * The eyebrow leads with "Name not confirmed" on purpose. Duo and Fold are
 * both in circulation and the page has no basis for picking one.
 */
export function DuoHero() {
  return (
    <ScrubStage
      id="duo"
      slug="duo-hero"
      alt={ALT}
      pinVh={2.2}
      smoothing={0.14}
      fit="contain"
      mediaHeight={0.9}
      videoLayout="stacked"
      hint="Scroll to resolve"
    >
      <DuoHeroPanel />
    </ScrubStage>
  );
}

function DuoHeroPanel() {
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
          title="iPhone Duo"
          lede="Apple’s first foldable iPhone is expected to use a book-style design: compact when closed, tablet-like when opened. An iPhone that opens into more."
          badge={
            <ConfidenceBadge level="developing" size="sm">
              Duo or Fold — unsettled
            </ConfidenceBadge>
          }
        />

        <dl className={styles.specs}>
          {DUO_SPECS.map((spec) => (
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
