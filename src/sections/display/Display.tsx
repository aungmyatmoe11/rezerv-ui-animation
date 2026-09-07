'use client';

import { useRef } from 'react';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { ScrubStage, useScrubTimeline } from '@/components/ScrubStage';
import { SectionHead } from '@/components/SectionHead';
import { DISPLAY_STATS } from '@/data/pro';
import styles from './Display.module.scss';

const ALT =
  'Concept render: three iPhone 18 Pro finishes seen from behind turn away, then a single ' +
  'Sky Blue unit faces forward with a 6.9-inch measurement drawn across its display.';

/**
 * Section 05 — Display. Scroll-scrubbed: scrolling down turns the three
 * finishes away and brings the 6.9-inch panel forward; scrolling up runs the
 * film back.
 *
 * The clip has a 6.9" figure rendered into its pixels, which matches the
 * reporting for the Pro Max, so it is used rather than fought (spec §49.3).
 * The size cards are keyed to the film's position rather than a timer: they
 * arrive with the measurement and leave with it.
 */
export function Display() {
  return (
    <ScrubStage
      id="display"
      slug="display"
      alt={ALT}
      pinVh={2.2}
      smoothing={0.7}
      fit="contain"
      mediaHeight={0.92}
      videoLayout="stacked"
      hint="Scroll to turn"
    >
      <DisplayPanel />
    </ScrubStage>
  );
}

function DisplayPanel() {
  const ref = useRef<HTMLDivElement | null>(null);

  const mode = useScrubTimeline(ref, (tl, root) => {
    const stats = root.querySelectorAll<HTMLElement>('[data-stat]');
    const note = root.querySelector<HTMLElement>('[data-note]');
    if (stats.length) {
      tl.fromTo(
        stats,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.12, stagger: 0.03 },
        0.5,
      );
    }
    if (note) tl.fromTo(note, { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.68);
  });

  return (
    <div ref={ref} className={styles.panel} data-mode={mode}>
      <div className={styles.copy}>
        <SectionHead
          tone="film"
          eyebrow="Display"
          title="Efficiency you don’t see."
          lede="Reports point toward upgraded LTPO+ panel technology. The most important improvement may not be a headline specification, but energy efficiency while keeping the adaptive high refresh rate a Pro is expected to have."
        />

        <dl className={styles.stats}>
          {DISPLAY_STATS.map((stat) => (
            <div key={stat.label} className={styles.stat} data-stat>
              <dt className={styles.statLabel}>{stat.label}</dt>
              <dd className={styles.statValue}>{stat.value}</dd>
              <dd className={styles.statBadge}>
                <ConfidenceBadge level={stat.confidence} size="sm" />
              </dd>
            </div>
          ))}
        </dl>

        <p className={styles.note} data-note>
          The 6.9-inch figure drawn into the footage matches the reporting, so it is used as-is.
        </p>
      </div>
    </div>
  );
}
