'use client';

import { CompareTable } from '@/components/CompareTable';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { PRO_VS_DUO, DUO_TRADEOFFS } from '@/data/duo';
import styles from './ProVsDuo.module.scss';

/**
 * Section 18 — the two ideas of "Pro", side by side.
 *
 * The table deliberately ends on a Confidence row reading Higher / Lower. That
 * is the honest summary of everything above it: the Pro column is built on
 * repeated, corroborated reporting, and the Duo column is not. Ending on the
 * spec sheet instead would imply the two are equally knowable.
 *
 * The trade-off cards above it exist because the foldable's compromises must
 * not be buried: two cameras rather than three, no Face ID, and flagship
 * silicon in a chassis that cannot really cool it.
 */
export function ProVsDuo() {
  return (
    <Section id="compare-duo">
      <SectionHead
        eyebrow="Pro vs Duo"
        title="Two ideas of “Pro.”"
        lede="One refines a mature product. The other trades away parts of it for a new shape. Neither reading is a verdict, because one column is far better sourced than the other."
      />

      <ul className={styles.tradeoffs} aria-label="What the foldable gives up">
        {DUO_TRADEOFFS.map((item) => (
          <li key={item.title} className={styles.tradeoff} data-reveal>
            <h3 className={styles.tradeoffTitle}>{item.title}</h3>
            <p className={styles.tradeoffBody}>{item.body}</p>
            <ConfidenceBadge level={item.confidence} size="sm" />
          </li>
        ))}
      </ul>

      <div className={styles.tableWrap}>
        <CompareTable
          caption="iPhone 18 Pro compared with iPhone Duo"
          columns={['iPhone 18 Pro', 'iPhone Duo']}
          rows={PRO_VS_DUO}
        />
      </div>
    </Section>
  );
}
