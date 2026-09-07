'use client';

import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { LazyVideo } from '@/components/LazyVideo';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { clipAspect } from '@/data/media';
import { IslandGauge } from './IslandGauge';
import styles from './DynamicIsland.module.scss';

const ALT =
  'Concept render of the top of an iPhone 18 Pro display in Dark Cherry, the Dynamic Island ' +
  'cutout catching the light as the device tilts.';

/**
 * Section 04 — Dynamic Island. Film beside the copy, and a scroll-linked gauge
 * that shrinks a pill from today's cutout to the rumoured one.
 */
export function DynamicIsland() {
  return (
    <Section id="island">
      <div className={styles.grid}>
        <div className={styles.copy}>
          <SectionHead
            eyebrow="Dynamic Island"
            title="More display. Less interruption. Maybe."
            lede="Multiple reports suggest a smaller Dynamic Island for iPhone 18 Pro. One widely circulated estimate puts the cutout about 35 percent narrower."
            badge={
              <ConfidenceBadge level="developing" size="sm">
                Developing rumour
              </ConfidenceBadge>
            }
          />
          <p className={styles.caveat} data-reveal>
            But the reporting is not unanimous. Other sources suggest Apple may keep the current
            size for another generation.
          </p>
        </div>

        <div className={styles.media}>
          <div
            className={styles.filmBox}
            style={{ aspectRatio: clipAspect('dynamic-island') }}
            data-reveal
          >
            <LazyVideo slug="dynamic-island" alt={ALT} />
          </div>
          <IslandGauge />
        </div>
      </div>
    </Section>
  );
}
