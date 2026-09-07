'use client';

import { useRef } from 'react';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { ScrubStage, useScrubTimeline } from '@/components/ScrubStage';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { CREASE, FOLD_STATES } from '@/data/ultra';
import styles from './Fold.module.scss';

const ALT =
  'Concept render of a foldable iPhone opening from a closed phone-sized device into a ' +
  'square tablet-sized inner display.';

/**
 * Section 14 — closed to open. The clearest use of the scrub on the page.
 *
 * Scrolling down opens the device, scrolling up refolds it, and the caption
 * swaps at the midpoint: "About 5.5 inches" while it is closed, "About 7.8
 * inches" once it is past half open. Both labels live in the DOM the whole
 * time and only their opacity changes, so the sizes are always readable to
 * assistive technology regardless of scroll position.
 */
export function Fold() {
  return (
    <>
      <ScrubStage
        slug="fold"
        alt={ALT}
        pinVh={2.8}
        smoothing={0.13}
        fit="contain"
        mediaHeight={0.86}
        videoLayout="stacked"
        hint="Scroll to open · scroll up to refold"
      >
        <FoldCaption />
      </ScrubStage>

      <Section rhythm="tight">
        <div className={styles.crease}>
          <SectionHead
            eyebrow="Crease and hinge"
            title={CREASE.title}
            lede={CREASE.body}
            badge={
              <ConfidenceBadge level="concept" size="sm">
                Conceptual simulation
              </ConfidenceBadge>
            }
          />
        </div>
      </Section>
    </>
  );
}

function FoldCaption() {
  const ref = useRef<HTMLDivElement | null>(null);

  // The swap happens at the film's midpoint, not on a timer, so it tracks the
  // device rather than the clock — and reverses when the visitor scrolls back.
  const mode = useScrubTimeline(ref, (tl, root) => {
    const closed = root.querySelector<HTMLElement>('[data-state="closed"]');
    const open = root.querySelector<HTMLElement>('[data-state="open"]');
    if (!closed || !open) return;

    tl.fromTo(closed, { opacity: 1 }, { opacity: 0, duration: 0.1 }, 0.45)
      .fromTo(open, { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.5);
  });

  return (
    <div ref={ref} className={styles.caption} data-mode={mode}>
      <p className={styles.eyebrow}>One device. Two states.</p>

      <div className={styles.states}>
        <div className={styles.state} data-state="closed">
          <span className={styles.size}>{FOLD_STATES.closed.size}</span>
          <span className={styles.body}>{FOLD_STATES.closed.body}</span>
        </div>
        <div className={styles.state} data-state="open">
          <span className={styles.size}>{FOLD_STATES.open.size}</span>
          <span className={styles.body}>{FOLD_STATES.open.body}</span>
        </div>
      </div>
    </div>
  );
}
