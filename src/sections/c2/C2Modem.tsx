'use client';

import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { LazyVideo } from '@/components/LazyVideo';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { clipAspect } from '@/data/media';
import { MODEM_CLAIMS, MODEM_LINEAGE } from '@/data/pro';
import styles from './C2Modem.module.scss';

const ALT = 'Concept render of a silver C2 modem package turning slowly against black.';

/**
 * Section 09 — Connectivity. The headline says the transition "continues", so
 * the section shows what it continues from: C1 and C1X, which shipped, and
 * then C2, which is the rumour. Beside the film, three lines separate what is
 * reported, what is unsettled, and what this page refuses to claim.
 *
 * The clip renders an Apple logo and the C2 wordmark into the package; the
 * site discloses rather than crops (spec §49.2).
 */
export function C2Modem() {
  return (
    <Section id="modem">
      <div className={styles.grid}>
        <div className={styles.copy}>
          <SectionHead
            eyebrow="Connectivity"
            title="Apple’s modem transition continues."
            lede="Apple’s next-generation C2 modem has repeatedly been linked to iPhone 18 Pro. It would be the third step in a transition that began with the C1."
            badge={<ConfidenceBadge level="developing" size="sm" />}
          />

          <dl className={styles.claims}>
            {MODEM_CLAIMS.map((claim) => (
              <div key={claim.key} className={styles.claim} data-reveal>
                <dt className={styles.claimKey}>{claim.key}</dt>
                <dd className={styles.claimText}>{claim.text}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={styles.filmBox} style={{ aspectRatio: clipAspect('c2-modem') }} data-reveal>
          <LazyVideo slug="c2-modem" alt={ALT} />
        </div>
      </div>

      <ol className={styles.lineage} aria-label="Apple’s modem lineage">
        {MODEM_LINEAGE.map((step, i) => (
          <li
            key={step.chip}
            className={styles.step}
            data-reveal
            data-current={step.confidence === 'developing'}
          >
            <span className={styles.stepIndex} aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className={styles.stepChip}>{step.chip}</span>
            <span className={styles.stepDevice}>
              {step.device} · {step.year}
            </span>
            <span className={styles.stepBadge}>
              <ConfidenceBadge level={step.confidence} size="sm" />
            </span>
            <p className={styles.stepNote}>{step.note}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
