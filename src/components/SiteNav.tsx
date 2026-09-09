'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { scrollToSection, scrollToTop } from '@/lib/motion/scrollTo';
import { useMotionPolicy } from '@/lib/motion/motionPolicy';
import { subscribeActiveSection, subscribeScroll } from '@/lib/motion/scrollState';
import { NAV_ITEMS } from '@/data/sections';
import styles from './SiteNav.module.scss';

const NAV_IDS = NAV_ITEMS.map((item) => item.id);

/**
 * Fixed chrome that stays out of the way of the film.
 *
 * The bar used to run the full width of the viewport as a gradient veil with a
 * backdrop blur. At 1440px that put nine 12px labels adrift in an otherwise
 * empty 1,400px rule, and the blur's own rectangle was visible as a seam across
 * the top of every dark shot. It read as a browser toolbar sitting on a film.
 *
 * It is two floating capsules now — the wordmark, and the sections — inset from
 * the edges with the picture running under and around them. Same information,
 * but it reads as an object placed on the page rather than a band cut across it,
 * and the blur has an edge it is allowed to have because the capsule has one.
 *
 * The current section is a filled pill: the one piece of state worth showing
 * plainly. Nothing travels between items — the previous version slid a pill
 * across nine positions, and mid-flight it sat under nothing at all.
 *
 * Both the progress rule and the active item are driven from the shared scroll
 * tick in lib/motion/scrollState.ts, so the whole nav costs one style write per
 * frame and never measures anything during a scroll.
 *
 * One list at every width. The compact bar used to keep three anchors visible
 * and fold the other six behind a `⋯` menu, which asked a phone visitor to open
 * a popover to find out what the page even contains, and lit the button rather
 * than a label whenever the current section lived inside it. All nine ride the
 * same horizontal scroller now, and the active one is scrolled into view — the
 * list moves with the page instead of hiding two thirds of it.
 */
export function SiteNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const policy = useMotionPolicy();
  const listRef = useRef<HTMLUListElement | null>(null);
  const progressRef = useRef<HTMLSpanElement | null>(null);

  // ---- reveal past the hero, and drive the progress rule -------------------
  useEffect(
    () =>
      subscribeScroll(({ y, progress }) => {
        const past = y > window.innerHeight * 0.85;
        setVisible((prev) => (prev === past ? prev : past));

        const bar = progressRef.current;
        // scaleX on a one-pixel element: no layout, no paint beyond the rule.
        if (bar) bar.style.transform = `scaleX(${progress})`;
      }),
    [],
  );

  // ---- which section owns the viewport ------------------------------------
  useEffect(() => subscribeActiveSection(NAV_IDS, setActive), []);

  // Keep the current item in view in the horizontally scrolling list.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !active) return;
    if (list.scrollWidth <= list.clientWidth) return;
    const link = list.querySelector<HTMLElement>(`[data-nav-id="${active}"]`);
    // This fires on every section the visitor passes, so it is real motion the
    // reduced-motion setting has to be able to switch off. The item still ends
    // up in view — it just gets there without travelling.
    link?.scrollIntoView({
      behavior: policy.tier === 'static' ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [active, policy.tier]);

  const modified = (event: React.MouseEvent) =>
    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;

  const onNavClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (modified(event)) return;
    event.preventDefault();
    // Take focus off the link before the jump. Leaving it focused is what put a
    // stray focus ring around whichever item was last clicked.
    event.currentTarget.blur();
    scrollToSection(id);
  }, []);

  const onWordmarkClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    if (modified(event)) return;
    event.preventDefault();
    event.currentTarget.blur();
    scrollToTop();
  }, []);

  return (
    <header className={styles.nav} data-visible={visible}>
      {/* How far through the page you are. One scaleX write per frame, from the
          shared scroll tick. */}
      <span className={styles.progress} ref={progressRef} aria-hidden="true" />

      <div className={styles.inner}>
        <a className={styles.wordmark} href="#top" onClick={onWordmarkClick}>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.wordmarkName}>
            <span className={styles.wordmarkBrand}>iPhone&nbsp;</span>
            18&nbsp;Pro
          </span>
          <span className={styles.wordmarkNote}>concept</span>
        </a>

        <nav aria-label="Sections" className={styles.links}>
          <div className={styles.scroller}>
            <ul className={styles.list} ref={listRef}>
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    className={styles.link}
                    href={`#${item.id}`}
                    data-nav-id={item.id}
                    data-active={item.id === active}
                    aria-current={item.id === active ? 'true' : undefined}
                    onClick={(e) => onNavClick(e, item.id)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}
