/** Nav model. IDs match the section element ids so the nav can anchor to them. */
export interface NavItem {
  id: string;
  label: string;
}

/**
 * Only sections that actually exist on the page. Extended as each wave lands,
 * so the nav can never point at an anchor that is not there.
 *
 * Wave 2 adds the Pro act: nav order is Design, Camera,
 * Performance, Battery, then Compare. Ultra, Evidence and Sources arrive with
 * waves 3 and 4.
 *
 * Every item is in the bar at every width. The compact layout used to promote
 * three of them and fold the rest behind a `⋯` menu, which hid two thirds of the
 * page behind a popover on the devices with the least patience for one; below
 * 1024 the capsule is a horizontal scroller instead.
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
