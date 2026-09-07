/** Nav model. IDs match the section element ids so the nav can anchor to them. */
export interface NavItem {
  id: string;
  label: string;
  /** မိုဘိုင်းမှာ ပင်မဆိုင်ရာများအဖြစ် ပြသမည် (သို့) overflow menu ထဲတွင် ထားမည် */
  priority?: 'high' | 'normal';
}

/**
 * Only sections that actually exist on the page. Extended as each wave lands,
 * so the nav can never point at an anchor that is not there.
 *
 * Order matches document scroll order in page.tsx. Not all mounted sections
 * have nav items (e.g., DynamicIsland, Display, Aperture, C2Modem are skipped).
 *
 * Mobile nav: priority='high' anchors show always; others collapse to overflow menu.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'colors', label: 'Colors', priority: 'high' },
  { id: 'design', label: 'Design', priority: 'high' },
  { id: 'camera', label: 'Camera', priority: 'high' },
  { id: 'performance', label: 'Performance', priority: 'normal' },
  { id: 'battery', label: 'Battery', priority: 'normal' },
  { id: 'compare', label: 'Compare', priority: 'normal' },
  { id: 'ultra', label: 'Ultra', priority: 'high' },
  { id: 'compare-ultra', label: 'Compare', priority: 'normal' },
  { id: 'evidence', label: 'Evidence', priority: 'normal' },
  { id: 'sources', label: 'Sources', priority: 'high' },
];

export const DISCLAIMER =
  'Unofficial concept project. Not affiliated with, sponsored by, or endorsed by Apple Inc. ' +
  'Specifications, colours and designs shown before any official announcement are based on public ' +
  'reporting, leaks and physical mockups. All visuals are independent concept renders.';
