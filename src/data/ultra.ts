import type { Confidence } from './confidence';
import type { CompareRow } from '@/components/CompareTable';

/**
 * Copy and figures for the Ultra act (sections 12–18) and the closing
 * differentiators (19–20).
 *
 * The Ultra evidence is materially weaker than the Pro evidence, and the page
 * says so rather than flattening the two. Content spec §19–§31 and §41.
 */

// ---- 13 Ultra hero ----------------------------------------------------------

export interface UltraSpec {
  label: string;
  value: string;
  confidence: Confidence;
}

export const ULTRA_SPECS: readonly UltraSpec[] = [
  { label: 'Exterior display', value: '~5.5″', confidence: 'developing' },
  { label: 'Inner display', value: '~7.8″', confidence: 'developing' },
  { label: 'Inner aspect', value: '~4:3', confidence: 'developing' },
];

// ---- 14 Fold ----------------------------------------------------------------

/** The label swaps at the midpoint of the scrub, as the device passes half-open. */
export const FOLD_STATES = {
  closed: {
    size: 'About 5.5 inches.',
    body: 'Closed, it is meant to work like an everyday iPhone.',
  },
  open: {
    size: 'About 7.8 inches.',
    body: 'Open, it becomes a wider, iPad-like canvas for apps, media and multitasking.',
  },
} as const;

export const CREASE = {
  title: 'The fold you’re meant to forget.',
  body:
    'Apple is reportedly concentrating on minimising the visible crease and improving hinge ' +
    'durability. Those are the two compromises most associated with current foldables, and the ' +
    'two hardest to verify before anyone has held one.',
} as const;

// ---- 15 Thickness -----------------------------------------------------------

export const THICKNESS = {
  reported: '~4.5 mm',
  reference: '5.6 mm',
  /**
   * Which figure in the footage is which.
   *
   * The clip renders two measurements and they describe different things, which
   * is the single most misread fact in this section — the thin one is routinely
   * quoted as the folded thickness. This decodes them WITHOUT reprinting them:
   * the page's rule is that a number rendered into a shot is not repeated
   * beside it, and reprinting these would be the one place that rule slipped.
   */
  decode: [
    { key: 'The thin figure', value: 'The unfolded chassis' },
    { key: 'The second figure', value: 'The closed-body reference' },
  ],
  note: 'Both come from the same reporting, and neither is confirmed.',
} as const;

// ---- 17 Ultra colours -------------------------------------------------------

export interface UltraFinish {
  id: string;
  name: string;
  confidence: Confidence;
  swatch: string;
  copy: string;
}

/**
 * Two only. The spec is explicit that presenting four or five Ultra colours
 * would overstate evidence that barely supports two.
 */
export const ULTRA_FINISHES: readonly UltraFinish[] = [
  {
    id: 'silver',
    name: 'Silver',
    confidence: 'developing',
    swatch: '#a5a4a5',
    copy: 'The higher-confidence direction. A clean, neutral finish of the kind a first-generation foldable usually launches in.',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    confidence: 'uncertain',
    swatch: '#2f3a5c',
    copy: 'Reporting points to a conservative dark shade rather than a bright consumer colour. The name itself is not settled.',
  },
];

// ---- 18 Pro vs Ultra --------------------------------------------------------

export const PRO_VS_ULTRA: readonly CompareRow[] = [
  { feature: 'Form', a: 'Traditional smartphone', b: 'Book-style foldable' },
  { feature: 'Display', a: '~6.3″', b: '~5.5″ closed / ~7.8″ open', confidence: 'developing' },
  { feature: 'Chip', a: 'A20 Pro expected', b: 'A20 Pro expected', confidence: 'high' },
  { feature: 'RAM', a: '~12 GB expected', b: '~12 GB expected', confidence: 'developing' },
  { feature: 'Cameras', a: 'Triple camera', b: 'Dual camera', confidence: 'developing' },
  { feature: 'Telephoto', a: 'Yes', b: 'Not expected', confidence: 'developing' },
  { feature: 'Face ID', a: 'Expected', b: 'Not expected', confidence: 'developing' },
  { feature: 'Touch ID', a: 'No', b: 'Expected, in the side button', confidence: 'developing' },
  { feature: 'Main focus', a: 'Camera and performance', b: 'A new form factor' },
  { feature: 'Colour identity', a: 'Dark Cherry', b: 'Silver / Indigo' },
  { feature: 'Pricing', a: 'Premium', b: '$2,000+ rumoured', confidence: 'uncertain' },
  { feature: 'Confidence', a: 'Higher', b: 'Lower' },
];

/** §25 and §26 — the trade-off is stated, not hidden. */
export const ULTRA_TRADEOFFS = [
  {
    title: 'Two cameras, not three',
    body: 'A main and an ultra wide, with no dedicated telephoto. The thin chassis is the likely reason.',
    confidence: 'developing' as Confidence,
  },
  {
    title: 'Pro-class silicon, foldable constraints',
    body: 'A20 Pro expected, around 12 GB of memory and vapour-chamber cooling, in a two-part body.',
    confidence: 'developing' as Confidence,
  },
  {
    title: 'No Face ID expected',
    body: 'Internal space is the reported constraint, which is what moves authentication to the side button.',
    confidence: 'developing' as Confidence,
  },
];

// ---- 19 Confidence map ------------------------------------------------------

export interface ConfidenceBar {
  claim: string;
  /** 0..1 — how strongly the public reporting supports it. */
  value: number;
  level: Confidence;
  note: string;
}

/**
 * The one part of this page with no equivalent on any Apple product page.
 * It is what makes the site a reconstruction rather than a fan render, and it
 * costs nothing in assets.
 */
export const CONFIDENCE_MAP: readonly ConfidenceBar[] = [
  { claim: 'Dark Cherry finish', value: 0.9, level: 'high', note: 'Multiple independent reports, plus colour dummies.' },
  { claim: 'A20 on 2 nm', value: 0.9, level: 'high', note: 'Consistent across supply-chain reporting.' },
  { claim: '6.3″ and 6.9″ Pro sizes', value: 0.9, level: 'high', note: 'Carried over from the current generation.' },
  { claim: 'Variable aperture feature', value: 0.8, level: 'high', note: 'The feature itself is well reported across multiple sources.' },
  { claim: 'Variable aperture on Pro Max', value: 0.6, level: 'developing', note: 'Model assignment is less certain. Late reporting leans Pro Max exclusive.' },
  { claim: 'Smaller Dynamic Island', value: 0.7, level: 'developing', note: 'Widely repeated, but some sources expect no change at all.' },
  { claim: 'C2 modem in 18 Pro', value: 0.6, level: 'developing', note: 'Repeatedly linked, regional deployment unclear.' },
  { claim: 'The name “iPhone Ultra”', value: 0.5, level: 'developing', note: 'Ultra and Fold are both in circulation.' },
  { claim: 'Ultra colour lineup', value: 0.4, level: 'uncertain', note: 'The weakest claim on this page. Two shades, thinly sourced.' },
];

// ---- 20 Ending, timeline and sources ---------------------------------------

export interface TimelineNode {
  month: string;
  what: string;
  href: string;
}

export const SOURCE_TIMELINE: readonly TimelineNode[] = [
  { month: 'Feb', what: 'Early colour and design reporting', href: 'https://www.macrumors.com/roundup/iphone-18-pro/' },
  { month: 'Mar', what: 'Dynamic Island reporting', href: 'https://www.macrumors.com/roundup/iphone-18-pro/' },
  { month: 'Apr', what: 'CAD and physical model development', href: 'https://www.macrumors.com/roundup/iphone-18/' },
  { month: 'May', what: 'Colour dummy models', href: 'https://www.macrumors.com/guide/iphone-18-pro-ultra-colors/' },
  { month: 'Jun', what: 'Camera and Fold engineering reports', href: 'https://www.macrumors.com/roundup/iphone-fold/' },
  { month: 'Jul', what: 'Battery and regulatory filings', href: 'https://www.macrumors.com/roundup/iphone-18-pro/' },
  { month: 'Aug', what: 'Final-stage colours, Fold, event reporting', href: 'https://www.macrumors.com/roundup/iphone-18/' },
  { month: 'Sep 9', what: 'Apple Event', href: 'https://www.apple.com/apple-events/' },
];

export interface SourceLink {
  label: string;
  href: string;
  kind: string;
}

export const SOURCES: readonly SourceLink[] = [
  { label: 'iPhone 18 Pro roundup', href: 'https://www.macrumors.com/roundup/iphone-18-pro/', kind: 'MacRumors' },
  { label: 'iPhone 18 roundup', href: 'https://www.macrumors.com/roundup/iphone-18/', kind: 'MacRumors' },
  { label: 'iPhone Fold roundup', href: 'https://www.macrumors.com/roundup/iphone-fold/', kind: 'MacRumors' },
  { label: 'iPhone 18 Pro / Ultra colours', href: 'https://www.macrumors.com/guide/iphone-18-pro-ultra-colors/', kind: 'MacRumors' },
  { label: 'iPhone 17 Pro product page', href: 'https://www.apple.com/iphone-17-pro/', kind: 'Apple, reference' },
  { label: 'Apple Events', href: 'https://www.apple.com/apple-events/', kind: 'Apple, official' },
];

export const ENDING = {
  title: 'September 9 changes everything.',
  body:
    'Until Apple makes it official, this remains a reconstruction: public reporting, physical ' +
    'mockups, supply-chain information, analyst research and independent concept work, each ' +
    'graded by how much weight it can actually carry.',
} as const;

// ---- 20a The event itself ---------------------------------------------------

/**
 * The one live thing on the page.
 *
 * `startsAt` and the title are taken from the stream's own metadata rather than
 * typed by hand, so the countdown cannot drift away from what YouTube will
 * actually do at 10:00 Pacific. `whenFallback` is what the server renders: the
 * real line is formatted in the reader's own timezone after hydration, and a
 * timezone-dependent string cannot be rendered on the server without a mismatch.
 */
export const APPLE_EVENT = {
  title: 'Apple Event — September 9',
  tagline: 'Surprise and shine.',
  channel: 'Apple',
  videoId: '39BalPDuTo0',
  startsAt: '2026-09-09T17:00:00Z',
  whenFallback: '9 September, 10:00 AM PT',
  watchHref: 'https://www.youtube.com/live/39BalPDuTo0',
} as const;
