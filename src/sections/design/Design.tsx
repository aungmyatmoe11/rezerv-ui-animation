'use client';

import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { FeatureFilm } from '@/components/FeatureFilm';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { DESIGN_CALLOUTS } from '@/data/pro';
import { SECTION_COPY } from '@/data/copy';
import styles from './Design.module.scss';

/**
 * Section 03 — Design. A macro film, then four callouts.
 *
 * The callouts sit below the film rather than pinned to points on it: the clip
 * tracks across the plateau, so any marker anchored to a lens would drift off
 * it within a second. Hover brightens a callout and lifts it; every word is
 * on screen regardless, so keyboard users lose nothing.
 */
export function Design() {
  return (
    <>
      <FeatureFilm id="design" slug="design" alt={SECTION_COPY.design.alt} height="full" place="bottom-start" scrim="bottom">
        <SectionHead
          tone="film"
          eyebrow={SECTION_COPY.design.eyebrow}
          title={SECTION_COPY.design.title}
          lede={SECTION_COPY.design.lede}
          badge={<ConfidenceBadge level="developing" size="sm" />}
        />
      </FeatureFilm>

      <Section rhythm="compact" variant="inset">
        <ol className={styles.callouts}>
          {DESIGN_CALLOUTS.map((callout, i) => (
            <li key={callout.title} className={styles.callout} data-reveal>
              <span className={styles.index} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className={styles.calloutTitle}>{callout.title}</h3>
              <p className={styles.calloutBody}>{callout.body}</p>
            </li>
          ))}
        </ol>
        <p className={styles.coda} data-reveal>
          The result could feel evolutionary rather than revolutionary.
        </p>
      </Section>
    </>
  );
}
