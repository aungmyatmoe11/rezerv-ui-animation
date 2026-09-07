'use client';

import { useRef } from 'react';
import { useScrubTimeline } from '@/components/ScrubStage';
import { SENSOR_CALLOUTS } from '@/data/pro';
import styles from './CameraSensor.module.scss';

/**
 * Five leader-line callouts that appear as the lens stack separates.
 *
 * They have no ScrollTrigger of their own: useScrubTimeline scrubs a paused
 * timeline with the film's painted position, so each callout lands exactly
 * when its element leaves the body, runs backwards when the visitor scrolls
 * up and the module reassembles, and can never drift from the frame on screen.
 *
 * On the video tier (mobile, reduced motion, a failed frame fetch) there is
 * no position to follow, so the same five labels render as a static legend.
 * Opacity is the only thing animated, so assistive tech reads the full legend
 * on every tier.
 */
export function SensorCallouts() {
  const ref = useRef<HTMLDivElement | null>(null);

  const mode = useScrubTimeline(ref, (tl, root) => {
    SENSOR_CALLOUTS.forEach((callout, i) => {
      const item = root.querySelector<HTMLElement>(`[data-callout="${i}"]`);
      const line = item?.querySelector<HTMLElement>('[data-line]');
      const label = item?.querySelector<HTMLElement>('[data-label]');
      if (!line || !label) return;

      tl.fromTo(line, { scaleY: 0 }, { scaleY: 1, duration: 0.07 }, callout.at).fromTo(
        label,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.08 },
        callout.at + 0.03,
      );
    });
  });

  return (
    <div ref={ref} className={styles.callouts} data-mode={mode}>
      {SENSOR_CALLOUTS.map((callout, i) => (
        <div
          key={callout.label}
          className={styles.callout}
          data-callout={i}
          data-row={i % 2}
          data-align={callout.align}
          style={{ '--x': `${callout.x}%` } as React.CSSProperties}
        >
          <span className={styles.calloutLabel} data-label>
            <span className={styles.calloutIndex}>{String(i + 1).padStart(2, '0')}</span>
            <span className={styles.calloutText}>{callout.label}</span>
            <span className={styles.calloutNote}>{callout.note}</span>
          </span>
          <span className={styles.line} data-line aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
