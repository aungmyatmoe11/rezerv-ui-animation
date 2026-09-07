'use client';

import { useRef } from 'react';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { ScrubStage, useScrubTimeline } from '@/components/ScrubStage';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { A20_ROWS } from '@/data/pro';
import styles from './A20Pro.module.scss';

const ALT =
  'Concept render of an A20 Pro package lifted in tweezers under a loupe, with a list of ' +
  'unconfirmed specifications rendered beside it.';

/**
 * Section 08 — A20 Pro. Scroll-scrubbed: the loupe closes on the package as
 * the visitor scrolls, and backs away when they scroll up.
 *
 * The render bakes "Up to 15% Faster" and six more spec lines into its pixels.
 * They stay — cropping would destroy the shot — so a badge on the film says
 * what they are, and a callout lands on the list the moment it resolves. The
 * rows beneath are what the page is prepared to stand behind, each with its
 * own grade (spec §49.3).
 */
export function A20Pro() {
  return (
    <>
      <ScrubStage
        id="performance"
        slug="a20-pro"
        alt={ALT}
        pinVh={2.4}
        smoothing={0.14}
        fit="contain"
        mediaHeight={0.92}
        videoLayout="stacked"
        hint="Scroll to reveal the package"
      >
        <A20Panel />
      </ScrubStage>

      <Section rhythm="tight">
        <div className={styles.grid}>
          <div className={styles.wmcm} data-reveal>
            <p className={styles.wmcmEyebrow}>Packaging</p>
            <h3 className={styles.wmcmTitle}>Wafer-level multi-chip module</h3>
            <p className={styles.wmcmBody}>
              Reports also describe a move to WMCM packaging, which could bring memory closer to the
              CPU, GPU and Neural Engine: shorter paths, better efficiency, a smaller package, calmer
              thermals, and faster on-device AI.
            </p>
            <ConfidenceBadge level="developing" size="sm" />
          </div>

          <ul className={styles.rows} aria-label="What this page asserts about the A20 Pro">
            {A20_ROWS.map((row) => (
              <li key={row.key} className={styles.row} data-reveal>
                <span className={styles.rowKey}>{row.key}</span>
                <span className={styles.rowValue}>{row.value}</span>
                <span className={styles.rowBadge}>
                  <ConfidenceBadge level={row.confidence} size="sm" />
                </span>
                <p className={styles.rowNote}>{row.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}

function A20Panel() {
  const ref = useRef<HTMLDivElement | null>(null);

  const mode = useScrubTimeline(ref, (tl, root) => {
    const line = root.querySelector<HTMLElement>('[data-line]');
    const label = root.querySelector<HTMLElement>('[data-label]');
    if (!line || !label) return;
    tl.fromTo(line, { scaleY: 0 }, { scaleY: 1, duration: 0.08 }, 0.62).fromTo(
      label,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.1 },
      0.66,
    );
  });

  return (
    <div ref={ref} className={styles.panel} data-mode={mode}>
      <div className={styles.corner}>
        <ConfidenceBadge level="concept" size="sm">
          Concept render — figures unconfirmed
        </ConfidenceBadge>
      </div>

      <div className={styles.copy}>
        <SectionHead
          tone="film"
          eyebrow="A20 Pro"
          title="2nm changes the equation."
          lede="iPhone 18 Pro is widely expected to move to Apple’s A20 generation on TSMC’s 2nm process. A smaller node packs more transistors into the same area and improves performance per watt. Apple has published no benchmarks, and this page repeats none."
        />
      </div>

      {/* Lands on the rendered spec list as the loupe resolves it. */}
      <div className={styles.callout}>
        <span className={styles.calloutLabel} data-label>
          Seven claims are rendered into the footage. This page asserts none of them as fact.
        </span>
        <span className={styles.calloutLine} data-line aria-hidden="true" />
      </div>
    </div>
  );
}
