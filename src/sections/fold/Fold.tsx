'use client';

import { useRef } from 'react';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { ScrubStage, useScrubTimeline } from '@/components/ScrubStage';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { CREASE, FOLD_STATES } from '@/data/duo';
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
        mediaHeight={0.68}
        mediaAlign="start"
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

  // The swap tracks the hinge, not a clock, and runs backwards on scroll-up.
  //
  // Both labels share one grid cell. A 0.05 overlap (0.50–0.55) used to hold
  // "5.5 inches" and "7.8 inches" on screen together. They now yield through
  // an empty beat: outgoing leaves, incoming arrives. `y` keeps the handoff
  // on the compositor — blur is reserved for the one-shot ApertureLab dissolve,
  // not a filter that would repaint on every scrub tick.
  const mode = useScrubTimeline(ref, (tl, root) => {
    const closed = root.querySelector<HTMLElement>('[data-state="closed"]');
    const open = root.querySelector<HTMLElement>('[data-state="open"]');
    if (!closed || !open) return;

    tl.fromTo(
      closed,
      { autoAlpha: 1, y: 0 },
      { autoAlpha: 0, y: -14, duration: 0.07, ease: 'none' },
      0.44,
    ).fromTo(
      open,
      { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: 0.08, ease: 'none' },
      0.53,
    );
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
