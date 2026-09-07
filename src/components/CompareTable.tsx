import type { Confidence } from '@/data/confidence';
import { ConfidenceBadge } from './ConfidenceBadge';
import styles from './CompareTable.module.scss';

export interface CompareRow {
  feature: string;
  a: string;
  b: string;
  /** Grades the row's claim; omitted where the row is descriptive rather than a rumour. */
  confidence?: Confidence;
}

export interface CompareTableProps {
  /** Accessible name for the table. Visually hidden. */
  caption: string;
  columns: readonly [string, string];
  rows: readonly CompareRow[];
  className?: string;
}

/**
 * A comparison that reflows rather than shrinks.
 *
 * Under 768px each row becomes a small block — feature on top, the two values
 * side by side with their column names repeated from data-label — because a
 * three-column table at 360px either overflows or drops to an unreadable size.
 * The explicit ARIA roles keep it a table for assistive tech once CSS turns
 * the rows into grids.
 *
 * Hover feedback is background and colour only. Transforms on table rows are
 * unevenly supported, and there is nothing to reveal: every cell is always on
 * screen, so keyboard users lose nothing.
 */
export function CompareTable({ caption, columns, rows, className }: CompareTableProps) {
  return (
    <table role="table" className={`${styles.table} ${className ?? ''}`}>
      <caption className="visually-hidden">{caption}</caption>
      <thead role="rowgroup" className={styles.head}>
        <tr role="row">
          <th role="columnheader" scope="col" className={styles.th}>
            Feature
          </th>
          <th role="columnheader" scope="col" className={styles.th}>
            {columns[0]}
          </th>
          <th role="columnheader" scope="col" className={styles.th}>
            {columns[1]}
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {rows.map((row) => (
          <tr key={row.feature} role="row" className={styles.row} data-reveal>
            <th role="rowheader" scope="row" className={styles.feature}>
              <span className={styles.featureInner}>
                <span>{row.feature}</span>
                {row.confidence ? <ConfidenceBadge level={row.confidence} size="sm" /> : null}
              </span>
            </th>
            <td role="cell" className={styles.cell} data-label={columns[0]}>
              {row.a}
            </td>
            <td role="cell" className={styles.cell} data-label={columns[1]}>
              {row.b}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
