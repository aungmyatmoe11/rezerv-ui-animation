/** Nav model. IDs match the section element ids so the nav can anchor to them. */
export interface NavItem {
  id: string;
  label: string;
  /** High items stay in the compact bar (<1024); normal items live in overflow. */
  priority: 'high' | 'normal';
}

/**
 * Only sections that actually exist on the page. Extended as each wave lands,
 * so the nav can never point at an anchor that is not there.
 *
 * Wave 2 adds the Pro act: nav order is Design, Camera,
 * Performance, Battery, then Compare. Ultra, Evidence and Sources arrive with
 * waves 3 and 4.
 *
 * Compact nav (<1024): `priority: 'high'` stays in the bar; `normal` collapses
 * into the overflow menu. Three high items is what actually fits beside the
 * wordmark on a phone, and it keeps the tablet capsule from stretching into a
 * hollow bar. The previous bar kept all nine in the scroller, so the sections
 * capsule grew past the wordmark on mobile and spanned the leftover row on tablet.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'colors', label: 'Colors', priority: 'high' },
  { id: 'design', label: 'Design', priority: 'high' },
  { id: 'camera', label: 'Camera', priority: 'high' },
  { id: 'performance', label: 'Performance', priority: 'normal' },
  { id: 'battery', label: 'Battery', priority: 'normal' },
  { id: 'ultra', label: 'Ultra', priority: 'normal' },
  { id: 'compare-ultra', label: 'Compare', priority: 'normal' },
  { id: 'evidence', label: 'Evidence', priority: 'normal' },
  { id: 'sources', label: 'Sources', priority: 'normal' },
] as const;

export const DISCLAIMER =
  'Unofficial concept project. Not affiliated with, sponsored by, or endorsed by Apple Inc. ' +
  'Specifications, colours and designs shown before any official announcement are based on public ' +
  'reporting, leaks and physical mockups. All visuals are independent concept renders.';
