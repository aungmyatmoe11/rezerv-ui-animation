'use client';

import { ScrollTrigger } from './gsap';

/**
 * ONE scroll subscription for the whole page.
 *
 * The nav and the back-to-top control each used to attach their own `scroll`
 * listener, and each read `document.documentElement.scrollHeight` inside it —
 * two forced synchronous layouts per scroll event, on a document ~44,000px tall
 * carrying eight pin-spacers. `getTotalLength()` on the progress ring made a
 * third. Scroll events fire far more often than any of those values change, so
 * the page was re-laying itself out to redraw a one-pixel rule.
 *
 * This module reads the expensive values exactly once per invalidation — a
 * resize, or a ScrollTrigger refresh, which is precisely when they can actually
 * change — and hands every subscriber the same snapshot from a single rAF tick.
 * Subscribers write styles and never measure.
 */

export interface ScrollSnapshot {
  y: number;
  /** Furthest scrollable offset. Cached; never read per event. */
  max: number;
  /** 0..1 through the document. */
  progress: number;
}

export type ScrollListener = (snapshot: ScrollSnapshot) => void;
export type ActiveListener = (id: string | null) => void;

const scrollListeners = new Set<ScrollListener>();
const activeListeners = new Set<ActiveListener>();

let snapshot: ScrollSnapshot = { y: 0, max: 0, progress: 0 };
let max = 0;
let metricsStale = true;

let anchorIds: readonly string[] = [];
let anchors: { id: string; top: number }[] = [];
let anchorsStale = true;
let activeId: string | null = null;

let frame = 0;
let bound = false;

/**
 * Where a section really starts.
 *
 * A pinned section is `position: fixed` for the length of its pin, so its own
 * rect reports the viewport rather than the document. ScrollTrigger leaves a
 * `.pin-spacer` in the flow holding the real position, so that is the element
 * worth measuring.
 */
export function anchorFor(el: HTMLElement): HTMLElement {
  const parent = el.parentElement;
  return parent?.classList.contains('pin-spacer') ? parent : el;
}

export function sectionTop(el: HTMLElement): number {
  return anchorFor(el).getBoundingClientRect().top + window.scrollY;
}

function measureMetrics() {
  max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  metricsStale = false;
}

function measureAnchors() {
  anchors = [];
  for (const id of anchorIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    anchors.push({ id, top: sectionTop(el) });
  }
  // Document order is not guaranteed by the nav model, and the "last one passed"
  // rule below depends on it.
  anchors.sort((a, b) => a.top - b.top);
  anchorsStale = false;
}

/**
 * Which section owns the viewport.
 *
 * The nav used to answer this with one ScrollTrigger per item and an `onToggle`
 * callback, which failed in two ways at once. The triggers were built at mount,
 * before any scrub section had created its pin, so two of the nine were measured
 * against elements that later became `position: fixed`. And `onToggle` only
 * fires when a trigger's active state *changes* between updates: a fast scroll —
 * a nav click especially — can step clean over a short section without ever
 * registering it, leaving whatever was last highlighted stuck there. That is why
 * "Sources" stayed lit halfway up the page.
 *
 * Reading it from cached offsets instead makes it a pure function of the scroll
 * position: the active item is simply the last section whose top has passed the
 * reading line. It cannot stick, cannot be skipped, and costs nine comparisons.
 */
function computeActive(y: number): string | null {
  if (anchors.length === 0) return null;
  const line = y + window.innerHeight * 0.42;

  let current: string | null = null;
  for (const anchor of anchors) {
    if (anchor.top <= line) current = anchor.id;
    else break;
  }
  return current;
}

function publish() {
  frame = 0;
  if (metricsStale) measureMetrics();
  if (anchorsStale && anchorIds.length > 0) measureAnchors();

  const y = window.scrollY;
  snapshot = { y, max, progress: max > 0 ? Math.min(1, Math.max(0, y / max)) : 0 };
  for (const listener of scrollListeners) listener(snapshot);

  if (activeListeners.size > 0) {
    const next = computeActive(y);
    if (next !== activeId) {
      activeId = next;
      for (const listener of activeListeners) listener(next);
    }
  }
}

function schedule() {
  if (frame === 0) frame = requestAnimationFrame(publish);
}

function invalidate() {
  metricsStale = true;
  anchorsStale = true;
  schedule();
}

function bind() {
  if (bound || typeof window === 'undefined') return;
  bound = true;
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', invalidate);
  // Pins are created and killed as the page loads and as the motion tier
  // changes; both move every offset below them.
  ScrollTrigger.addEventListener('refresh', invalidate);
}

function unbind() {
  if (!bound) return;
  if (scrollListeners.size > 0 || activeListeners.size > 0) return;
  bound = false;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', invalidate);
  ScrollTrigger.removeEventListener('refresh', invalidate);
}

export function subscribeScroll(listener: ScrollListener): () => void {
  bind();
  scrollListeners.add(listener);
  invalidate();
  listener(snapshot);
  return () => {
    scrollListeners.delete(listener);
    unbind();
  };
}

/**
 * Track the section that currently owns the viewport.
 *
 * `ids` is captured on first subscription; the page has one nav, so a second
 * caller with a different list is a bug rather than a case to support.
 */
export function subscribeActiveSection(
  ids: readonly string[],
  listener: ActiveListener,
): () => void {
  bind();
  anchorIds = ids;
  anchorsStale = true;
  activeListeners.add(listener);
  schedule();
  listener(activeId);
  return () => {
    activeListeners.delete(listener);
    unbind();
  };
}

/** Force a re-measure — after a layout change this module cannot observe. */
export function invalidateScrollMetrics(): void {
  invalidate();
}
