import type { Confidence } from '@/data/confidence';
import { CONFIDENCE_LABEL, CONFIDENCE_NOTE } from '@/data/confidence';
import styles from './ConfidenceBadge.module.scss';

export interface ConfidenceBadgeProps {
  level: Confidence;
  /** Overrides the default label, e.g. "Figures unconfirmed". */
  children?: string;
  size?: 'sm' | 'md';
}

/**
 * Grades a claim in place.
 *
 * The dot is redundant with the text label on purpose — colour alone must not
 * be the only carrier of the confidence level.
 */
export function ConfidenceBadge({ level, children, size = 'md' }: ConfidenceBadgeProps) {
  return (
    <span className={styles.badge} data-level={level} data-size={size} title={CONFIDENCE_NOTE[level]}>
      <span className={styles.dot} aria-hidden="true" />
      {children ?? CONFIDENCE_LABEL[level]}
    </span>
  );
}
