'use client';

import { useId, useState } from 'react';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { ScrubStage } from '@/components/ScrubStage';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { CONFIDENCE_NOTE } from '@/data/confidence';
import { ULTRA_FINISHES, type UltraFinish } from '@/data/ultra';
import styles from './UltraColors.module.scss';

const ALT = 'Concept render of a foldable iPhone turning to show its rear finish.';

/**
 * Section 17 — Ultra finishes. Scroll turns the device; the picker sits beneath.
 *
 * The film is now scroll-scrubbed like the fold rather than looping on its own,
 * so this section reads as part of the same scroll language as the rest of the
 * Ultra act instead of being the one clip that plays to its own clock.
 *
 * Two options, and that is the point. The Pro colours section offers three
 * expected finishes and one demoted early mockup; here the evidence supports
 * two, weakly.
 * Padding this out to match would be the single easiest way to overstate what
 * is known, which is exactly what this page exists not to do.
 *
 * There are no device renders for the Ultra, so the selection retints the panel
 * rather than swapping an image it does not have.
 */
export function UltraColors() {
  const [active, setActive] = useState<UltraFinish>(ULTRA_FINISHES[0]!);
  const groupName = useId();

  return (
    <>
      {/* The headline lives ABOVE the film, not over it.
          Laid over the footage it needed a top scrim, and this is the brightest
          clip in the Ultra act — a silver body fills the upper left. A dark band
          across a bright, moving image reads as a grey rectangle with hard
          edges, which is exactly what it looked like. Nothing is scrimmed now
          because nothing sits on the picture. */}
      <Section>
        <SectionHead
          eyebrow="Ultra finishes"
          title="Two shades, thinly sourced."
          lede="Colour reporting for the foldable is far weaker than for the Pro. Two directions have surfaced, and neither is settled."
        />
      </Section>

      <ScrubStage
        slug="ultra-colors"
        alt={ALT}
        pinVh={1.9}
        smoothing={0.7}
        fit="contain"
        mediaHeight={0.9}
        videoLayout="stacked"
        hint="Scroll to turn"
      />

      <Section rhythm="tight">
        <div
          className={styles.picker}
          data-reveal
          style={{ '--swatch': active.swatch } as React.CSSProperties}
        >
          <div key={active.id} className={styles.copy}>
            <h3 className={styles.name}>{active.name}</h3>
            <ConfidenceBadge level={active.confidence} size="sm" />
            <p className={styles.body}>{active.copy}</p>
            <p className={styles.note}>{CONFIDENCE_NOTE[active.confidence]}</p>
          </div>

          <div className={styles.controls}>
            <fieldset className={styles.swatches}>
              <legend className="visually-hidden">Choose an Ultra finish</legend>
              {ULTRA_FINISHES.map((finish) => (
                <label
                  key={finish.id}
                  className={styles.swatch}
                  data-active={finish.id === active.id}
                  style={{ '--chip': finish.swatch } as React.CSSProperties}
                >
                  <input
                    type="radio"
                    name={groupName}
                    value={finish.id}
                    checked={finish.id === active.id}
                    onChange={() => setActive(finish)}
                    className="visually-hidden"
                  />
                  <span className={styles.chip} aria-hidden="true" />
                  <span className={styles.swatchLabel}>{finish.name}</span>
                </label>
              ))}
            </fieldset>

            <p className={styles.caveat}>
              Only two are shown because only two are reported. A four-swatch row here would look
              more finished and claim more than the sourcing supports.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
