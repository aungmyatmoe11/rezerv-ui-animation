'use client';

import { useRef, type ReactNode } from 'react';
import { useSectionReveal } from '@/lib/motion/useSectionReveal';
import { clipAspect, type ClipSlug } from '@/data/media';
import { LazyVideo } from './LazyVideo';
import styles from './FeatureFilm.module.scss';

export type FilmPlace =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'
  | 'center-start'
  | 'center-end';

export interface FeatureFilmProps {
  id?: string;
  slug: ClipSlug;
  alt: string;
  /** Stage height from tablet up. Mobile always shows the clip at its own aspect ratio. */
  height?: 'full' | 'tall' | 'half';
  /** Where the copy sits over the film from tablet up. */
  place?: FilmPlace;
  /** Darkening weighted toward the copy, so type stays legible over bright footage. */
  scrim?: 'none' | 'bottom' | 'top' | 'start' | 'end';
  /** Pinned to the film's top-left corner: the place for a provenance badge. */
  corner?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * A full-bleed film with copy laid over it — the PLAY sections' shared shell.
 *
 * Every clip in the library but one sits on pure black, so `cover` against the
 * black page leaves no visible video edge (docs/ASSET_INVENTORY.md §2), and on
 * a portrait tablet the same fact lets the film switch to `contain`: the
 * letterbox bands are black on black, invisible, and the copy sits in them.
 *
 * Under 768px the overlay would fight a portrait crop for the subject, so the
 * film is shown at its own aspect ratio with the copy stacked beneath it. A
 * layout decision, not a content one: nothing is dropped on mobile.
 */
export function FeatureFilm({
  id,
  slug,
  alt,
  height = 'full',
  place = 'bottom-start',
  scrim = 'bottom',
  corner,
  className,
  children,
}: FeatureFilmProps) {
  const ref = useRef<HTMLElement | null>(null);
  useSectionReveal(ref);

  return (
    <section
      id={id}
      ref={ref}
      className={`${styles.root} ${className ?? ''}`}
      data-height={height}
      data-place={place}
      data-scrim={scrim}
    >
      <div className={styles.stage} style={{ '--aspect': clipAspect(slug) } as React.CSSProperties}>
        <LazyVideo slug={slug} alt={alt} className={styles.film} />
        <div className={styles.scrim} aria-hidden="true" />
        {corner ? <div className={styles.corner}>{corner}</div> : null}
      </div>
      <div className={styles.overlay}>
        <div className={styles.copy}>{children}</div>
      </div>
    </section>
  );
}
