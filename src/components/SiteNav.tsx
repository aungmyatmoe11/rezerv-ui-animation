'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { scrollToSection, scrollToTop } from '@/lib/motion/scrollTo';
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
 */
export function SiteNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);
  const progressRef = useRef<HTMLSpanElement | null>(null);
  const overflowRef = useRef<HTMLDivElement | null>(null);

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

  // Keep the current item in view in the horizontally scrolling mobile nav.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !active) return;
    // Measuring is fine here: this runs on a section change, not on every frame.
    if (list.scrollWidth <= list.clientWidth) return;
    const link = list.querySelector<HTMLElement>(`[data-nav-id="${active}"]`);
    link?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [active]);

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

  // Close overflow when clicking outside on mobile
  useEffect(() => {
    if (!overflowOpen) return;
    const handle = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [overflowOpen]);

  return (
    <header className={styles.nav} data-visible={visible}>
      {/* How far through the page you are. One scaleX write per frame, from the
          shared scroll tick. */}
      <span className={styles.progress} ref={progressRef} aria-hidden="true" />

      <div className={styles.inner}>
        <a className={styles.wordmark} href="#top" onClick={onWordmarkClick}>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.wordmarkName}>iPhone&nbsp;18&nbsp;Pro</span>
          <span className={styles.wordmarkNote}>concept</span>
        </a>

        <nav aria-label="Sections" className={styles.links}>
          <ul className={styles.list} ref={listRef}>
            {/* Render all items in document/scroll order */}
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

            {/* Mobile: overflow menu button */}
            <li className={styles.mobileOnly}>
              <button
                className={styles.moreButton}
                onClick={(e) => {
                  e.stopPropagation();
                  setOverflowOpen(!overflowOpen);
                }}
                aria-label="More sections"
                aria-expanded={overflowOpen}
              >
                <span className={styles.moreIcon}>⋯</span>
              </button>
            </li>
          </ul>

          {/* Mobile overflow menu - hardcode list for now */}
          {overflowOpen && (
            <div ref={overflowRef} className={styles.overflowMenu}>
              {['performance', 'battery', 'compare-ultra', 'evidence'].map((id) => {
                const item = NAV_ITEMS.find(i => i.id === id);
                if (!item) return null;
                return (
                  <a
                    key={item.id}
                    className={styles.overflowLink}
                    href={`#${item.id}`}
                    data-active={item.id === active}
                    onClick={(e) => {
                      onNavClick(e, item.id);
                      setOverflowOpen(false);
                    }}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
