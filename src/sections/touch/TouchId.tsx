'use client';

import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { FeatureFilm } from '@/components/FeatureFilm';
import { SectionHead } from '@/components/SectionHead';
import styles from './TouchId.module.scss';

const ALT =
  'Concept render of a foldable iPhone held in one hand and rotated to show the side button.';

const STEPS = ['Finger', 'Side button', 'Unlock'] as const;

/**
 * Section 16 — Touch ID returns, for a reason rather than as nostalgia.
 *
 * The clip is the only one in the library that establishes hand-held scale,
 * which is the honest way to show how large the closed device is. The Touch ID
 * wordmark is rendered into the footage; the badge grades it.
 */
export function TouchId() {
  return (
    <FeatureFilm
      slug="ultra-touch"
      alt={ALT}
      height="full"
      place="bottom-start"
      scrim="bottom"
    >
      <SectionHead
        tone="film"
        eyebrow="Authentication"
        title="A familiar button returns with a new job."
        lede="The foldable is widely rumoured to omit Face ID, because the internal space its sensors need is the space the hinge takes. Touch ID in the side button is the reported answer, as on current iPads."
        badge={<ConfidenceBadge level="developing" size="sm" />}
      />

      <ol className={styles.steps} data-reveal aria-label="How unlocking would work">
        {STEPS.map((step, i) => (
          <li key={step} className={styles.step}>
            <span className={styles.index} aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </FeatureFilm>
  );
}
