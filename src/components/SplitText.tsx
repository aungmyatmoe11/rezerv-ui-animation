import type { CSSProperties } from 'react';
import styles from './SplitText.module.scss';

export interface SplitTextProps {
  text: string;
  /** Marks each word for the entrance timeline to target. */
  itemAttr?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Splits a line into per-word spans so type can be animated with transform and
 * opacity only.
 *
 * The obvious alternative — animating letter-spacing, as the content spec
 * suggested — triggers layout on every frame of the hero entrance, which is
 * exactly the "layout thrash" the brief rules out. Each word gets a clipping
 * outer span and a transformed inner span instead.
 */
export function SplitText({ text, itemAttr = 'data-word', className, style }: SplitTextProps) {
  const words = text.split(' ');

  return (
    <span className={`${styles.root} ${className ?? ''}`} style={style}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          <span className={styles.mask}>
            <span className={styles.word} {...{ [itemAttr]: '' }}>
              {word}
            </span>
          </span>
          {/* The separator must live OUTSIDE the clipping inline-block, or it
              is collapsed away and the headline renders as "iPhone18Pro". */}
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  );
}
