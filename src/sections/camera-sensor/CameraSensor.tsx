'use client';

import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { ScrubStage } from '@/components/ScrubStage';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { SENSOR_GAINS } from '@/data/pro';
import { SensorCallouts } from './SensorCallouts';
import styles from './CameraSensor.module.scss';

const ALT =
  'Concept render of the iPhone 18 Pro camera module coming apart: the front ring, a row of ' +
  'lens elements and a stacked image sensor separating from the Dark Cherry body.';

/**
 * Section 06 — Camera sensor. The second scroll-scrubbed film on the page.
 *
 * Scrolling down explodes the lens stack; scrolling up reassembles it — that
 * is inherent to a frame scrub, not a second animation. Five leader-line
 * callouts follow the same position (see SensorCallouts), so they appear as
 * the matching element leaves the body and retract when it returns.
 */
export function CameraSensor() {
  return (
    <>
      <Section id="camera">
        <SectionHead
          eyebrow="Camera sensor"
          title="More information in every frame."
          lede="Apple is reported to be evaluating a new three-layer stacked image sensor for at least one iPhone 18 Pro model — separating the photodiodes, the readout and the processing onto their own layers."
          badge={<ConfidenceBadge level="developing" size="sm" />}
        />
      </Section>

      <ScrubStage
        slug="camera-sensor"
        alt={ALT}
        pinVh={2.6}
        smoothing={0.14}
        fit="contain"
        mediaHeight={0.86}
        videoLayout="stacked"
        hint="Scroll to take it apart"
      >
        <SensorCallouts />
      </ScrubStage>

      <Section rhythm="tight">
        <div className={styles.after}>
          <ul className={styles.gains} aria-label="What the architecture could improve">
            {SENSOR_GAINS.map((gain) => (
              <li key={gain} className={styles.gain} data-reveal>
                {gain}
              </li>
            ))}
          </ul>
          <p className={styles.tele} data-reveal>
            A larger-aperture telephoto camera is also reportedly under testing, which could help
            low-light zoom and background separation.{' '}
            <ConfidenceBadge level="developing" size="sm" />
          </p>
        </div>
      </Section>
    </>
  );
}
