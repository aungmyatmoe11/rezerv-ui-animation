'use client';

import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { LazyVideo } from '@/components/LazyVideo';
import { Section } from '@/components/Section';
import { SectionHead } from '@/components/SectionHead';
import { clipAspect } from '@/data/media';
import { APERTURE_EFFECTS } from '@/data/pro';
import { ApertureLab } from './ApertureLab';
import styles from './Aperture.module.scss';

const ALT_CUTAWAY =
  'Concept cutaway of a Dark Cherry iPhone 18 Pro camera module, the lens stack and sensor ' +
  'shown in translucent grey.';
const ALT_IRIS = 'Concept macro of a nine-blade iris opening and closing over a lens.';

/**
 * Section 07 — Variable aperture. Two contained films, then the interactive.
 *
 * Both clips have grey backgrounds rather than the library's usual pure black,
 * so they are the one place on the Pro act where a hairline card is right:
 * cinematic clips go full bleed, evidence stays in a contained card,
 * and cover-cropping a grey clip against a black page would show its edges.
 *
 * The iris animation was NOT built — it already exists as `aperture.mp4`. The
 * interactivity sits beside it, driven by a slider rather than scroll.
 */
export function Aperture() {
  return (
    <Section id="aperture">
      <SectionHead
        eyebrow="Variable aperture"
        title="A camera that controls the light."
        lede="One of the most significant iPhone 18 Pro Max camera rumours is a variable aperture. Instead of a permanently fixed opening, the lens could physically change how much light reaches the sensor."
        badge={
          <>
            <ConfidenceBadge level="high" size="sm">
              Feature: high confidence
            </ConfidenceBadge>
            <ConfidenceBadge level="developing" size="sm">
              Pro Max expected
            </ConfidenceBadge>
          </>
        }
      />

      <div className={styles.films}>
        <figure className={styles.card} data-reveal>
          <div className={styles.cardMedia} style={{ aspectRatio: clipAspect('camera-penetration') }}>
            <LazyVideo slug="camera-penetration" alt={ALT_CUTAWAY} fit="contain" />
          </div>
          <figcaption className={styles.caption}>
            <span>Cutaway of the lens stack and sensor</span>
            <ConfidenceBadge level="concept" size="sm" />
          </figcaption>
        </figure>

        <figure className={styles.card} data-reveal>
          <div className={styles.cardMedia} style={{ aspectRatio: clipAspect('aperture') }}>
            <LazyVideo slug="aperture" alt={ALT_IRIS} fit="contain" />
          </div>
          <figcaption className={styles.caption}>
            <span>An iris opening and closing</span>
            <ConfidenceBadge level="concept" size="sm" />
          </figcaption>
        </figure>
      </div>

      <div className={styles.effects} data-reveal>
        <p className={styles.effectsLead}>More direct control over</p>
        <ul className={styles.effectList}>
          {APERTURE_EFFECTS.map((effect) => (
            <li key={effect} className={styles.effect}>
              {effect}
            </li>
          ))}
        </ul>
        <p className={styles.disagree}>
          Late reporting leans toward the Pro Max receiving this feature, with the standard Pro not expected to include it.
        </p>
      </div>

      <ApertureLab />
    </Section>
  );
}
