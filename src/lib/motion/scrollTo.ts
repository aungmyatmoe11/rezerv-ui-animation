'use client';

import { sectionTop } from './scrollState';

export { sectionTop };

/**
 * Getting from one section to another on a 44,000px page.
 *
 * Two problems had to be answered here, and they have different answers.
 *
 * FIRST: the destination used to move. Pins were created lazily as their frames
 * downloaded, so the document grew by ~14,000px in seven jumps while a scroll
 * was in flight, and a click on "Evidence" landed 12,620px short. The fix for
 * that is not in this file — it is in useScrubSequence, where the pin is now
 * reserved at mount. The target now holds still, so this file no longer has to
 * chase it across half the page.
 *
 * SECOND, and this is what the visitor calls "flashing": animating a 31,000px
 * scroll is the wrong idea however smoothly it is done. Thirty screens of film
 * strobing past in a second is not a transition, it is a seizure risk with an
 * easing curve. Measured on the old build the ease was moving 3,029px per frame.
 *
 * So the behaviour is distance-aware, the way a film cuts rather than whip-pans
 * when the two shots are far apart:
 *
 *   near  (under ~2.2 screens)  ease across, so the movement stays legible
 *   far   (anything longer)     cut: dip to black, jump, come back up
 *
 * The cut is 170ms down and 320ms up. It reads as deliberate, it lands exactly
 * on the target because nothing is in flight while the scroll happens, and it
 * never strobes.
 */

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function maxScroll(): number {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

/** Past this, a jump is cut rather than travelled. */
const CUT_THRESHOLD_SCREENS = 2.2;
/** Matches the `in` transition in global.scss. */
const VEIL_DOWN_MS = 170;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

let frame = 0;
let veilTimer = 0;

function veil(): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.getElementById('scroll-veil');
}

function stop() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  window.removeEventListener('wheel', stop);
  window.removeEventListener('touchstart', stop);
}

/**
 * Short journeys: ease, re-measuring the destination each frame.
 *
 * The re-measure is cheap insurance rather than the load-bearing trick it used
 * to be — a late-loading image inside a revealed section can still shift a
 * target by a few dozen pixels, and following it costs one `getBoundingClientRect`
 * per frame on one element. A wheel or a touch cancels the whole thing, because
 * a scroll animation that fights the visitor is worse than none.
 */
function easeScrollTo(getTarget: () => number) {
  stop();

  const start = window.scrollY;
  const distance = Math.abs(Math.min(getTarget(), maxScroll()) - start);
  if (distance < 2) return;

  const duration = Math.min(900, Math.max(380, distance * 0.42));
  const t0 = performance.now();

  window.addEventListener('wheel', stop, { passive: true, once: true });
  window.addEventListener('touchstart', stop, { passive: true, once: true });

  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / duration);
    const target = Math.min(getTarget(), maxScroll());
    window.scrollTo(0, Math.round(start + (target - start) * easeInOutCubic(p)));
    if (p < 1) frame = requestAnimationFrame(step);
    else {
      window.scrollTo(0, Math.min(getTarget(), maxScroll()));
      stop();
    }
  };

  frame = requestAnimationFrame(step);
}

/**
 * Long journeys: cut.
 *
 * Nothing animates the scroll itself, so there is no strobe and no chance of
 * landing short. The veil is a plain element in the document (see layout.tsx and
 * global.scss) rather than something built here, so its timing lives with the
 * rest of the page's motion tokens and collapses automatically under
 * prefers-reduced-motion.
 */
function cutScrollTo(getTarget: () => number) {
  stop();
  const curtain = veil();

  const land = () => {
    window.scrollTo(0, Math.min(getTarget(), maxScroll()));
    // One frame later the pins have settled onto the new position, so the target
    // can be trusted a second time — a few pixels, invisible behind the veil.
    requestAnimationFrame(() => {
      window.scrollTo(0, Math.min(getTarget(), maxScroll()));
      // Removing the attribute IS the exit: the resting rule carries the 320ms
      // fade back up, so there is no second state to clean up afterwards.
      if (curtain) delete curtain.dataset.state;
    });
  };

  if (!curtain) {
    land();
    return;
  }

  window.clearTimeout(veilTimer);
  curtain.dataset.state = 'in';
  veilTimer = window.setTimeout(land, VEIL_DOWN_MS);
}

function goTo(getTarget: () => number) {
  if (prefersReducedMotion()) {
    stop();
    window.scrollTo(0, Math.min(getTarget(), maxScroll()));
    return;
  }

  const distance = Math.abs(Math.min(getTarget(), maxScroll()) - window.scrollY);
  if (distance > window.innerHeight * CUT_THRESHOLD_SCREENS) cutScrollTo(getTarget);
  else easeScrollTo(getTarget);
}

/**
 * Scroll to a section by id WITHOUT writing a hash into the address bar.
 *
 * Nav links stay real anchors, so keyboard, right-click and no-JS all still
 * work, but the click handler takes over and history is never touched: leaving
 * `/#colors` in the address bar meant a reload reopened the page mid-film.
 */
export function scrollToSection(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  goTo(() => sectionTop(el));
  return true;
}

export function scrollToTop(): void {
  goTo(() => 0);
}
