import type { Confidence } from './confidence';
import type { CompareRow } from '@/components/CompareTable';

/**
 * Copy and figures for the Pro act (sections 03–11).
 *
 * Kept out of the components so the wording can be reviewed against the
 * content spec in one place, and so every number on the page is a named
 * constant rather than a literal buried in JSX. Each claim carries the grade
 * the spec assigns it; nothing here is asserted harder than the reporting is.
 */

// ---- 03 Design --------------------------------------------------------------

export interface Callout {
  title: string;
  body: string;
}

export const DESIGN_CALLOUTS: readonly Callout[] = [
  {
    title: 'Unified rear finish',
    body: 'The camera plateau and the back panel may read as one continuous surface rather than two tones.',
  },
  {
    title: 'Thicker body',
    body: 'Reports point to a slightly deeper chassis, most plausibly to make room for a larger battery.',
  },
  {
    title: 'Deeper camera plateau',
    body: 'The plateau introduced with iPhone 17 Pro stays, and may sit prouder of the body.',
  },
  {
    title: 'Larger lenses',
    body: 'More prominent lens rings, consistent with the larger-aperture telephoto said to be under test.',
  },
];

// ---- 04 Dynamic Island --------------------------------------------------------

/** Cutout widths in millimetres. The rumoured figure is the widely quoted ~35% reduction. */
export const ISLAND = {
  currentMm: 20.7,
  rumouredMm: 13.5,
  ratio: 13.5 / 20.7,
} as const;

// ---- 05 Display -----------------------------------------------------------------

export interface Stat {
  label: string;
  value: string;
  confidence: Confidence;
}

export const DISPLAY_STATS: readonly Stat[] = [
  { label: 'iPhone 18 Pro', value: '~6.3″', confidence: 'high' },
  { label: 'iPhone 18 Pro Max', value: '~6.9″', confidence: 'high' },
  { label: 'Panel', value: 'LTPO+', confidence: 'developing' },
];

// ---- 06 Camera sensor -----------------------------------------------------------

export interface SensorCallout {
  label: string;
  note: string;
  /** Horizontal anchor as a percentage of the picture width. */
  x: number;
  /** Which side of the anchor the label sits on. */
  align: 'start' | 'end';
  /** Film position (0..1) at which the callout appears. */
  at: number;
}

/**
 * Anchors were read off the exploded frames: the front ring separates first at
 * the far left, the lens elements spread across the middle, and the sensor
 * stays with the body at the right. Later callouts point into the body, where
 * the readout and processing layers sit behind the sensor.
 */
export const SENSOR_CALLOUTS: readonly SensorCallout[] = [
  { label: 'Light', note: 'Enters through the front element', x: 7, align: 'start', at: 0.14 },
  { label: 'Lens system', note: 'Elements separate as the module opens', x: 30, align: 'start', at: 0.32 },
  { label: 'Image sensor', note: 'Three-layer stacked design under evaluation', x: 62, align: 'start', at: 0.5 },
  { label: 'Signal layer', note: 'Readout circuitry on its own layer', x: 80, align: 'end', at: 0.66 },
  { label: 'Image processing', note: 'Handed to the A20 Pro pipeline', x: 92, align: 'end', at: 0.82 },
];

export const SENSOR_GAINS = [
  'Sensor responsiveness',
  'Dynamic range',
  'Noise performance',
  'Motion handling',
  'Low-light photography',
] as const;

// ---- 07 Variable aperture -------------------------------------------------------

export const APERTURE_EFFECTS = [
  'Exposure',
  'Depth of field',
  'Background separation',
  'Low-light photography',
  'Bright daylight scenes',
] as const;

// ---- 08 A20 Pro ---------------------------------------------------------------

export interface SpecRow {
  key: string;
  value: string;
  confidence: Confidence;
  note: string;
}

/**
 * The render behind this section bakes seven spec lines into its pixels,
 * including "Up to 15% Faster". The rows below say what the page is prepared
 * to stand behind, and grade each line; the percentages are deliberately not
 * repeated (spec §49.3).
 */
export const A20_ROWS: readonly SpecRow[] = [
  {
    key: 'Process',
    value: '2 nm, TSMC',
    confidence: 'high',
    note: 'Widely and consistently reported. Apple has published no figures.',
  },
  {
    key: 'Packaging',
    value: 'WMCM',
    confidence: 'developing',
    note: 'Wafer-level multi-chip module: memory sits closer to the compute.',
  },
  {
    key: 'Memory',
    value: 'Closer, not necessarily more',
    confidence: 'developing',
    note: 'The render claims LPDDR6 on a 96-bit bus. Neither is asserted here.',
  },
  {
    key: 'Thermals',
    value: 'Vapour chamber, continued',
    confidence: 'developing',
    note: 'Inferred from the current Pro generation, not confirmed for 18 Pro.',
  },
  {
    key: 'Benchmarks',
    value: 'Not asserted',
    confidence: 'concept',
    note: '“Up to 15% faster” is the render’s claim, not this page’s.',
  },
];

// ---- 09 Connectivity -----------------------------------------------------------

export interface ModemStep {
  chip: string;
  device: string;
  year: string;
  confidence: Confidence;
  note: string;
}

/** The transition the headline refers to. The first two steps shipped; the third is the rumour. */
export const MODEM_LINEAGE: readonly ModemStep[] = [
  {
    chip: 'C1',
    device: 'iPhone 16e',
    year: '2025',
    confidence: 'official',
    note: 'Apple’s first in-house modem. Shipped.',
  },
  {
    chip: 'C1X',
    device: 'iPhone Air',
    year: '2025',
    confidence: 'official',
    note: 'Second generation, faster and more efficient. Shipped.',
  },
  {
    chip: 'C2',
    device: 'iPhone 18 Pro',
    year: '2026, reported',
    confidence: 'developing',
    note: 'Would be the first Pro to carry an Apple modem, if the reports hold.',
  },
];

export const MODEM_CLAIMS = [
  { key: 'Reported', text: 'C2 has been linked to iPhone 18 Pro repeatedly, across several outlets.' },
  { key: 'Unsettled', text: 'Regional deployment. Configurations could differ between markets.' },
  { key: 'Not claimed', text: 'That every iPhone 18 Pro will carry C2. This page does not say it.' },
] as const;

// ---- 10 Battery -----------------------------------------------------------------

export const BATTERY_FACTORS = [
  'Larger physical battery',
  '2 nm A20-series efficiency',
  'LTPO+ display efficiency',
  'Improved thermal management',
  'Modem efficiency',
] as const;

export interface Capacity {
  model: string;
  us: string;
  cn: string;
}

/** Reported pre-release figures. Regional variation is reportedly tied to physical-SIM requirements. */
export const BATTERY_CAPACITIES: readonly Capacity[] = [
  { model: 'iPhone 18 Pro', us: '~4,288 mAh', cn: '~4,056 mAh' },
  { model: 'iPhone 18 Pro Max', us: '~5,567 mAh', cn: '~5,391 mAh' },
];

// ---- 11 Pro vs Pro Max ----------------------------------------------------------

export const PRO_VS_PROMAX: readonly CompareRow[] = [
  { feature: 'Display', a: '~6.3″', b: '~6.9″', confidence: 'high' },
  { feature: 'Chip', a: 'A20 Pro expected', b: 'A20 Pro expected', confidence: 'high' },
  { feature: 'Design', a: 'Compact Pro', b: 'Large Pro' },
  { feature: 'Battery', a: '~4,288 mAh U.S., reported', b: '~5,567 mAh U.S., reported', confidence: 'developing' },
  { feature: 'Variable aperture', a: 'Not expected', b: 'Expected', confidence: 'developing' },
  { feature: 'Camera', a: 'Pro triple camera', b: 'Strongest camera candidate' },
  { feature: 'Main advantage', a: 'Compact flagship', b: 'Camera and battery' },
];
