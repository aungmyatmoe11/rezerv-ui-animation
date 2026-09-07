'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { scrollToSection, scrollToTop } from '@/lib/motion/scrollTo';
import { subscribeActiveSection, subscribeScroll } from '@/lib/motion/scrollState';
import { NAV_ITEMS } from '@/data/sections';
import styles from './SiteNav.module.scss';

const NAV_IDS = NAV_ITEMS.map((item) => item.id);

// Debug: log NAV_ITEMS order
if (typeof window !== 'undefined') {
  console.log('NAV_ITEMS order:', NAV_ITEMS.map(i => i.id).join(', '));
}

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
            {/* Render all items in document/scroll order - hardcoded to verify order */}
            <li data-priority="high">
              <a className={styles.link} href="#colors" data-nav-id="colors" data-active={'colors' === active} aria-current={'colors' === active ? 'true' : undefined} onClick={(e) => onNavClick(e, 'colors')}>Colors</a>
            </li>
            <li data-priority="high">
              <a className={styles.link} href="#design" data-nav-id="design" data-active={'design' === active} aria-current={'design' === active ? 'true' : undefined} onClick={(e) => onNavClick(e, 'design')}>Design</a>
            </li>
            <li data-priority="high">
              <a className={styles.link} href="#camera" data-nav-id="camera" data-active={'camera' === active} aria-current={'camera' === active ? 'true' : undefined} onClick={(e) => onNavClick(e, 'camera')}>Camera</a>
            </li>
            <li data-priority="normal">
              <a className={styles.link} href="#performance" data-nav-id="performance" data-active={'performance' === active} aria-current={'performance' === active ? 'true' : undefined} onClick={(e) => onNavClick(e, 'performance')}>Performance</a>
            </li>
            <li data-priority="normal">
              <a className={styles.link} href="#battery" data-nav-id="battery" data-active={'battery' === active} aria-current={'battery' === active ? 'true' : undefined} onClick={(e) => onNavClick(e, 'battery')}>Battery</a>
            </li>
            <li data-priority="normal">
              <a className={styles.link} href="#compare" data-nav-id="compare" data-active={'compare' === active} aria-current={'compare' === active ? 'true' : undefined} onClick={(e) => onNavClick(e, 'compare')}>Compare</a>
            </li>
            <li data-priority="high">
              <a className={styles.link} href="#ultra" data-nav-id="ultra" data-active={'ultra' === active} aria-current={'ultra' === active ? 'true' : undefined} onClick={(e) => onNavClick(e, 'ultra')}>Ultra</a>
            </li>
            <li data-priority="normal">
              <a className={styles.link} href="#compare-ultra" data-nav-id="compare-ultra" data-active={'compare-ultra' === active} aria-current={'compare-ultra' === active ? 'true' : undefined} onClick={(e) => onNavClick(e, 'compare-ultra')}>Compare</a>
            </li>
            <li data-priority="normal">
              <a className={styles.link} href="#evidence" data-nav-id="evidence" data-active={'evidence' === active} aria-current={'evidence' === active ? 'true' : undefined} onClick={(e) => onNavClick(e, 'evidence')}>Evidence</a>
            </li>
            <li data-priority="high">
              <a className={styles.link} href="#sources" data-nav-id="sources" data-active={'sources' === active} aria-current={'sources' === active ? 'true' : undefined} onClick={(e) => onNavClick(e, 'sources')}>Sources</a>
            </li>

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

          {/* Mobile overflow menu - normal priority items in scroll order */}
          {overflowOpen && (
            <div ref={overflowRef} className={styles.overflowMenu}>
              {NAV_ITEMS.filter((item) => item.priority === 'normal').map((item) => (
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
              ))}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
