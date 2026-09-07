'use client';

import { useRef, type ReactNode } from 'react';
import { useSectionReveal } from '@/lib/motion/useSectionReveal';
import styles from './Section.module.scss';

export interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Vertical rhythm multiplier. */
  rhythm?: 'tight' | 'normal' | 'loose' | 'compact';
  /** Visual variant for section-opening variety. */
  variant?: 'default' | 'inset' | 'breathe';
  as?: 'section' | 'div' | 'footer';
}

/**
 * Standard content section: page shell, vertical rhythm, and the one reveal
 * primitive wired to any descendant marked `data-reveal`.
 */
export function Section({
  id,
  children,
  className,
  rhythm = 'normal',
  variant = 'default',
  as: Tag = 'section',
}: SectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  useSectionReveal(ref);

  return (
    <Tag
      id={id}
      ref={ref as React.RefObject<HTMLElement & HTMLDivElement>}
      className={`${styles.section} ${className ?? ''}`}
      data-rhythm={rhythm}
      data-variant={variant}
    >
      <div className={styles.shell}>{children}</div>
    </Tag>
  );
}
