'use client';

import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { LazyVideo } from '@/components/LazyVideo';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { clipAspect } from '@/data/media';
import { BATTERY_CAPACITIES, BATTERY_FACTORS } from '@/data/pro';
import styles from './Battery.module.scss';

const ALT =
  'Concept render of a battery cell rising out of a Dark Cherry iPhone 18 Pro chassis, with ' +
  'capacity figures rendered above it.';

/**
 * Section 10 — Battery. A split layout rather than a full-viewport film: the
 * clip sits in a contained frame beside the copy, and the argument — several
 * efficiencies compounding — is the thing that fills the width.
 *
 * The clip prints "4,288mah" and "5,567mah" into its pixels. The headline
 * refuses to make the number the hero, and the figures are demoted to a
 * sourced footnote (spec §16, §49.3).
 */
export function Battery() {
  return (
    <Section id="battery">
      <div className={styles.grid}>
        <div className={styles.copy}>
          <SectionHead
            eyebrow="Battery"
            title="Longer through hardware, not just capacity."
            lede="Battery-life gains may come from several changes working together, rather than from one bigger cell."
          />
          <ol className={styles.equation} data-reveal aria-label="How the gains could add up">
            <li className={styles.term}>A20 Pro efficiency</li>
            <li className={styles.op} aria-hidden="true">
              +
            </li>
            <li className={styles.term}>LTPO+ display</li>
            <li className={styles.op} aria-hidden="true">
              +
            </li>
            <li className={styles.term}>Larger battery</li>
            <li className={styles.op} aria-hidden="true">
              =
            </li>
            <li className={`${styles.term} ${styles.result}`}>Longer endurance</li>
          </ol>
        </div>

        <div className={styles.filmBox} style={{ aspectRatio: clipAspect('battery') }} data-reveal>
          <LazyVideo slug="battery" alt={ALT} />
          <div className={styles.corner}>
            <ConfidenceBadge level="developing" size="sm">
              Clip shows mAh figures — unverified
            </ConfidenceBadge>
          </div>
        </div>
      </div>

      <div className={styles.footnote}>
        <div className={styles.factors} data-reveal>
          <p className={styles.lead}>Five levers, reportedly</p>
          <ul className={styles.factorList}>
            {BATTERY_FACTORS.map((factor) => (
              <li key={factor} className={styles.factor}>
                {factor}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.capacities} data-reveal>
          <p className={styles.lead}>
            <span>Reported pre-release capacities</span>
            <ConfidenceBadge level="developing" size="sm">
              Footnote, not headline
            </ConfidenceBadge>
          </p>
          <table className={styles.capTable}>
            <thead>
              <tr>
                <th scope="col">Model</th>
                <th scope="col">U.S.</th>
                <th scope="col">China</th>
              </tr>
            </thead>
            <tbody>
              {BATTERY_CAPACITIES.map((row) => (
                <tr key={row.model}>
                  <th scope="row">{row.model}</th>
                  <td>{row.us}</td>
                  <td>{row.cn}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.capNote}>
            Regional variation is reportedly tied to physical-SIM requirements. Source:{' '}
            <a
              className={styles.source}
              href="https://www.macrumors.com/roundup/iphone-18-pro/"
              target="_blank"
              rel="noopener noreferrer"
            >
              MacRumors, iPhone 18 Pro roundup
            </a>
            .
          </p>
        </div>
      </div>
    </Section>
  );
}
