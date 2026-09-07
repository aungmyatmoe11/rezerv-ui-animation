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
 * Wave 2 adds the Pro act: the spec's nav order (§40) is Design, Camera,
 * Performance, Battery, then Compare. Ultra, Evidence and Sources arrive with
 * waves 3 and 4.
 *
 * Mobile nav: priority='high' anchors show always; others collapse to overflow menu.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'colors', label: 'Colors' },
  { id: 'design', label: 'Design' },
  { id: 'camera', label: 'Camera' },
  { id: 'performance', label: 'Performance' },
  { id: 'battery', label: 'Battery' },
  { id: 'ultra', label: 'Ultra' },
  { id: 'compare-ultra', label: 'Compare' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'sources', label: 'Sources' },
] as const;

export const DISCLAIMER =
  'Unofficial concept project. Not affiliated with, sponsored by, or endorsed by Apple Inc. ' +
  'Specifications, colours and designs shown before any official announcement are based on public ' +
  'reporting, leaks and physical mockups. All visuals are independent concept renders.';
