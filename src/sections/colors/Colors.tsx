'use client';

import Image from 'next/image';
import { useId, useState } from 'react';
import { FINISHES, DEFAULT_FINISH, type Finish } from '@/data/colors';
import { CONFIDENCE_NOTE } from '@/data/confidence';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { ScrubStage } from '@/components/ScrubStage';
import { Section } from '@/components/Section';
import styles from './Colors.module.scss';

const ALT =
  'Concept renders of three iPhone 18 Pro finishes - silver, sky blue and dark cherry - ' +
  'rotating side by side against black.';

/**
 * Three blocks, deliberately separate sections rather than one:
 *
 *   1. header      - normal flow, scroll reveals
 *   2. scrub film  - pinned, scroll-scrubbed both directions
 *   3. picker      - normal flow, generous top rhythm so it never crowds the film
 *
 * Keeping them as siblings is what gives the pinned stage a clean entry and exit,
 * and gives the picker real breathing room below the pin spacer.
 */
export function Colors() {
  const [active, setActive] = useState<Finish>(DEFAULT_FINISH);
  const groupName = useId();

  return (
    <>
      <Section id="colors" className={styles.section}>
        <header className={styles.head}>
          <p className={styles.eyebrow} data-reveal>
            Finishes
          </p>
          <h2 className={styles.title} data-reveal>
            A new shade of Pro.
          </h2>
          <p className={styles.lede} data-reveal>
            Late reporting points to three finishes: Dark Cherry, Sky Blue and Silver. A dark grey showed in early dummy units; it is not in the expected lineup.
          </p>
        </header>
      </Section>

      {/* Scroll owns this film. Down runs it forward, up runs it backward. */}
      <ScrubStage
        slug="colors"
        alt={ALT}
        pinVh={2.2}
        smoothing={0.14}
        fit="contain"
        mediaHeight={0.78}
        videoLayout="stacked"
        className={styles.film}
      >
        <div className={styles.filmOverlay}>
          <p className={styles.filmCaption}>Three expected finishes, side by side</p>
          <p className={styles.filmHint} aria-hidden="true">
            Scroll to turn
          </p>
        </div>
      </ScrubStage>

      <Section rhythm="loose">
        {/* The tint of the whole panel is driven by the selected finish. */}
        <div
          className={styles.picker}
          data-reveal
          style={
            {
              '--theme-base': active.base,
              '--theme-hi': active.highlight,
              '--theme-lo': active.shadow,
            } as React.CSSProperties
          }
        >
          <div className={styles.deviceStage}>
            <div className={styles.glow} aria-hidden="true" />
            {FINISHES.map((finish) => (
              <Image
                key={finish.id}
                className={styles.device}
                src={`/img/colors/${finish.file}`}
                alt={
                  finish.id === active.id
                    ? `Concept render of iPhone 18 Pro in ${finish.name}`
                    : ''
                }
                aria-hidden={finish.id !== active.id}
                width={941}
                height={1672}
                sizes="(max-width: 767px) 70vw, (max-width: 1023px) 44vw, 32vw"
                quality={82}
                data-active={finish.id === active.id}
              />
            ))}
          </div>

          <div className={styles.panel}>
            {/* Keyed so the copy replays its own entrance on every change without
                a timer or a manual tween. */}
            <div key={active.id} className={styles.copy}>
              <h3 className={styles.finishName}>{active.name}</h3>
              <ConfidenceBadge level={active.confidence} size="sm" />
              <p className={styles.finishCopy}>{active.copy}</p>
              <p className={styles.note}>{CONFIDENCE_NOTE[active.confidence]}</p>
            </div>

            <div className={styles.swatchGroups}>
              <fieldset className={styles.swatches}>
                <legend className={styles.swatchLegend}>Expected lineup</legend>
                {FINISHES.filter((finish) => finish.expected).map((finish) => (
                  <Swatch
                    key={finish.id}
                    finish={finish}
                    groupName={groupName}
                    active={finish.id === active.id}
                    onSelect={setActive}
                  />
                ))}
              </fieldset>
              <fieldset className={styles.swatches}>
                <legend className={styles.swatchLegend}>Early mockups — not expected</legend>
                {FINISHES.filter((finish) => !finish.expected).map((finish) => (
                  <Swatch
                    key={finish.id}
                    finish={finish}
                    groupName={groupName}
                    active={finish.id === active.id}
                    onSelect={setActive}
                  />
                ))}
              </fieldset>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

function Swatch({
  finish,
  groupName,
  active,
  onSelect,
}: {
  finish: Finish;
  groupName: string;
  active: boolean;
  onSelect: (finish: Finish) => void;
}) {
  return (
    <label
      className={styles.swatch}
      data-active={active}
      data-expected={finish.expected}
      style={{ '--swatch': finish.base } as React.CSSProperties}
    >
      <input
        type="radio"
        name={groupName}
        value={finish.id}
        checked={active}
        onChange={() => onSelect(finish)}
        className="visually-hidden"
        aria-label={finish.expected ? finish.name : `${finish.name}, not expected`}
      />
      <span className={styles.chip} aria-hidden="true" />
      <span className={styles.swatchLabel}>{finish.name}</span>
    </label>
  );
}
