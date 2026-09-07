import type { ReactNode } from 'react';
import styles from './SectionHead.module.scss';

export interface SectionHeadProps {
  /**
   * Short kicker above the headline. Name the subject, not the position:
   * "Finishes", not "Section 02 · Finishes". A reader does not care that a
   * block is the fourteenth thing on the page, and numbering it makes an
   * editorial page read like a slide deck.
   */
  eyebrow: string;
  title: string;
  lede?: string;
  /** Usually one or more ConfidenceBadges. Rendered after the lede. */
  badge?: ReactNode;
  /** 'film' sits over footage: adds a text shadow and a slightly tighter measure. */
  tone?: 'page' | 'film';
  className?: string;
}

/**
 * Eyebrow, headline, lede, badge — the opening of every section, so every
 * section opens identically.
 *
 * There is deliberately no size prop. One headline size runs the whole page;
 * the only thing `tone` changes is legibility over moving footage, never scale.
 * Each line carries data-reveal for the enclosing Section's batch reveal.
 */
export function SectionHead({
  eyebrow,
  title,
  lede,
  badge,
  tone = 'page',
  className,
}: SectionHeadProps) {
  return (
    <header className={`${styles.head} ${className ?? ''}`} data-tone={tone}>
      <p className={styles.eyebrow} data-reveal>
        {eyebrow}
      </p>
      <h2 className={styles.title} data-reveal>
        {title}
      </h2>
      {lede ? (
        <p className={styles.lede} data-reveal>
          {lede}
        </p>
      ) : null}
      {badge ? (
        <div className={styles.badge} data-reveal>
          {badge}
        </div>
      ) : null}
    </header>
  );
}
