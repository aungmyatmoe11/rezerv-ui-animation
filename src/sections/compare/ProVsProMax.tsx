'use client';

import { useRef } from 'react';
import { CompareTable } from '@/components/CompareTable';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { ScrubStage, useScrubTimeline } from '@/components/ScrubStage';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { PRO_VS_PROMAX } from '@/data/pro';
import styles from './ProVsProMax.module.scss';

const ALT =
  'Concept render of a Sky Blue iPhone 18 Pro turning from its display to its back, ending on ' +
  'a “48MP Pro Camera System” caption.';

/**
 * Section 11 — Pro vs Pro Max. A scroll-scrubbed turn, then seven rows.
 *
 * The clip is the second half of the finishes film: the phone turns from the
 * 6.9-inch display to its back and a "48MP Pro Camera System" caption. Scroll
 * drives the turn in both directions. The caption is the footage's claim, so
 * a badge lands on it the moment it resolves, and the note beneath the table
 * says so in words.
 */
export function ProVsProMax() {
  return (
    <>
      <ScrubStage
        id="compare"
        slug="pro-vs-promax"
        alt={ALT}
        pinVh={1.8}
        smoothing={0.7}
        fit="contain"
        mediaHeight={0.92}
        videoLayout="stacked"
        hint="Scroll to turn"
      >
        <ComparePanel />
      </ScrubStage>

      <Section rhythm="tight">
        <CompareTable
          caption="iPhone 18 Pro compared with iPhone 18 Pro Max"
          columns={['iPhone 18 Pro', 'iPhone 18 Pro Max']}
          rows={PRO_VS_PROMAX}
        />
        <p className={styles.note} data-reveal>
          The film above ends on a “48MP Pro Camera System” caption. That is the footage’s claim,
          not this page’s.{' '}
          <ConfidenceBadge level="developing" size="sm">
            48MP: developing
          </ConfidenceBadge>
        </p>
      </Section>
    </>
  );
}

function ComparePanel() {
  const ref = useRef<HTMLDivElement | null>(null);

  const mode = useScrubTimeline(ref, (tl, root) => {
    const line = root.querySelector<HTMLElement>('[data-line]');
    const label = root.querySelector<HTMLElement>('[data-label]');
    if (!line || !label) return;
    tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.08 }, 0.72).fromTo(
      label,
      { opacity: 0, x: 8 },
      { opacity: 1, x: 0, duration: 0.1 },
      0.76,
    );
  });

  return (
    <div ref={ref} className={styles.panel} data-mode={mode}>
      <div className={styles.copy}>
        <SectionHead
          tone="film"
          eyebrow="Pro vs Pro Max"
          title="One Pro idea. Two sizes."
          lede="The two models are expected to share silicon and design language. The differences are size, battery, and the variable aperture feature, which late reporting points toward the Pro Max exclusively."
        />
      </div>

      {/* Lands beside the rendered caption as the phone finishes turning. */}
      <div className={styles.callout}>
        <span className={styles.calloutLine} data-line aria-hidden="true" />
        <span className={styles.calloutLabel} data-label>
          <ConfidenceBadge level="developing" size="sm">
            48MP: the footage’s claim
          </ConfidenceBadge>
        </span>
      </div>
    </div>
  );
}
