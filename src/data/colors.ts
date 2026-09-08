import type { Confidence } from './confidence';

export interface Finish {
  id: string;
  name: string;
  /** File in /public/img/colors — copied byte-for-byte from the source library. */
  file: string;
  confidence: Confidence;
  /** Measured off the render's back panel, not eyeballed. */
  base: string;
  highlight: string;
  shadow: string;
  copy: string;
  /** Late reporting includes this in the expected three-finish lineup. */
  expected: boolean;
}

/**
 * Colour values are SAMPLED from the actual device renders (see
 * docs/ASSET_INVENTORY.md §1.2). An earlier colour list guessed these, and
 * was materially wrong — it listed Sky Blue as #B6CEE3, a pale tint, where the
 * render is a mid blue at #6785B6.
 *
 * Registration note: all four renders share the same device centre (470.5-471.0px)
 * and the same body width (760-763px) at every scanline, so they crossfade
 * cleanly with no per-file transform correction. The PNGs ship untouched.
 */
export const FINISHES: readonly Finish[] = [
  {
    id: 'cherry',
    name: 'Dark Cherry',
    file: 'iphone18_cherry_red.png',
    confidence: 'high',
    base: '#4d2439',
    highlight: '#71405b',
    shadow: '#280114',
    copy: 'The strongest colour rumour of this generation. A dark red with wine and plum undertones that reads more violet or more red depending on the light.',
    expected: true,
  },
  {
    id: 'blue',
    name: 'Sky Blue',
    file: 'iphone18_blue.png',
    confidence: 'high',
    base: '#6785b6',
    highlight: '#9ab7dc',
    shadow: '#2a4572',
    copy: 'A cooler, more restrained alternative. Reporting points to a considered blue in the lineage of previous Pro blues rather than a saturated consumer colour.',
    expected: true,
  },
  {
    id: 'silver',
    name: 'Silver',
    file: 'iphone18_silver.png',
    confidence: 'developing',
    base: '#a5a4a5',
    highlight: '#c2c2c2',
    shadow: '#6c6a6b',
    copy: 'The third expected finish. Late leaks treat Silver as the likely name; the exact marketing label is still settling.',
    expected: true,
  },
  {
    id: 'graphite',
    name: 'Dark Gray',
    file: 'iphone18_black.png',
    confidence: 'uncertain',
    base: '#2c2c2c',
    highlight: '#817e7f',
    shadow: '#030303',
    copy: 'Not in the expected lineup. Early dummy units showed a dark finish; later colour reporting dropped it from the three.',
    expected: false,
  },
] as const;

export const DEFAULT_FINISH = FINISHES[0]!;
