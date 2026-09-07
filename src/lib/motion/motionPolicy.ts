'use client';

import { useSyncExternalStore } from 'react';
import type { ClipVariant } from '../../data/media';
import { ScrollTrigger } from './gsap';

/**
 * One place decides how much motion this device/user gets.
 *
 * ADR-005: responsive motion is a behaviour decision, not just responsive CSS.
 * The desktop timeline is NOT squeezed onto mobile — mobile gets a different,
 * cheaper timeline, and reduced-motion gets essentially none.
 */
export type MotionTier = 'full' | 'reduced-desktop' | 'lite' | 'static';

export interface MotionPolicy {
  tier: MotionTier;
  /** Canvas frame-scrub is affordable here. */
  canScrub: boolean;
  /** ScrollTrigger may pin sections. */
  canPin: boolean;
  /** Videos may autoplay when they enter the viewport. */
  canAutoplay: boolean;
  /** Multiplier applied to every pin distance. */
  pinScale: number;
  /**
   * Which encode `LazyVideo` should fetch.
   *
   * Driven by viewport, not by whether motion is reduced: a phone still gets
   * the 1280 file if it ever played, and a desktop never does. The server
   * snapshot is `mobile` so a phone is not briefly handed the 2880 file.
   */
  clipVariant: ClipVariant;
}

const QUERIES = {
  reduce: '(prefers-reduced-motion: reduce)',
  tablet: '(min-width: 768px)',
  desktop: '(min-width: 1024px)',
} as const;

const STATIC: MotionPolicy = {
  tier: 'static',
  canScrub: false,
  canPin: false,
  canAutoplay: false,
  pinScale: 0,
  clipVariant: 'full',
};

const LITE: MotionPolicy = {
  tier: 'lite',
  canScrub: false,
  canPin: false,
  canAutoplay: true,
  pinScale: 0,
  clipVariant: 'mobile',
};

const FULL: MotionPolicy = {
  tier: 'full',
  canScrub: true,
  canPin: true,
  canAutoplay: true,
  pinScale: 1,
  clipVariant: 'full',
};

const TABLET: MotionPolicy = {
  tier: 'reduced-desktop',
  canScrub: true,
  canPin: true,
  canAutoplay: true,
  // Tablet keeps the scrub but shortens the pin so a section does not eat an
  // uncomfortable amount of scroll on a shorter viewport.
  pinScale: 0.6,
  clipVariant: 'full',
};

function compute(): MotionPolicy {
  if (typeof window === 'undefined') return LITE;

  const reduced = window.matchMedia(QUERIES.reduce).matches;
  const isDesktop = window.matchMedia(QUERIES.desktop).matches;
  const isTablet = window.matchMedia(QUERIES.tablet).matches;
  const clipVariant: ClipVariant = isDesktop || isTablet ? 'full' : 'mobile';

  if (reduced) return { ...STATIC, clipVariant };
  if (isDesktop) return FULL;
  if (isTablet) return TABLET;
  return LITE;
}

let current: MotionPolicy = typeof window === 'undefined' ? LITE : compute();
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);

  if (listeners.size === 1 && typeof window !== 'undefined') {
    const mqls = Object.values(QUERIES).map((q) => window.matchMedia(q));
    const handle = () => {
      const next = compute();
      if (next.tier === current.tier && next.clipVariant === current.clipVariant) return;
      const pinsMayMove = next.tier !== current.tier;
      current = next;
      listeners.forEach((l) => l());

      /**
       * A tier change adds or removes every pin on the page at once.
       *
       * Crossing 1024px turns eight pinned films into eight looping clips (or
       * back), which changes the document height by tens of thousands of pixels
       * and invalidates every start and end ScrollTrigger has cached. React
       * rebuilds the triggers it owns, but the ones that survive keep stale
       * measurements — which is why a window dragged across the breakpoint left
       * some sections animating against positions that no longer existed and
       * others not animating at all.
       *
       * Deferred by a frame so React has committed the new tier's markup before
       * anything is measured. A clip-variant-only change (reduced-motion phone
       * crossing 768px) does not move pins, so it skips the refresh.
       */
      if (pinsMayMove) requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    mqls.forEach((m) => m.addEventListener('change', handle));
    handle();
    cleanup = () => mqls.forEach((m) => m.removeEventListener('change', handle));
  }

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      cleanup?.();
      cleanup = undefined;
    }
  };
}

let cleanup: (() => void) | undefined;

const getSnapshot = () => current;
// Server renders the conservative tier, so the markup that ships is the
// video-fallback markup. The canvas only ever appears after hydration decides
// the device can afford it — which also keeps the canvas out of the SSR HTML.
const getServerSnapshot = () => LITE;

export function useMotionPolicy(): MotionPolicy {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const MOTION_TIERS = { STATIC, LITE, TABLET, FULL };
