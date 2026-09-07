'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { useMotionPolicy } from '@/lib/motion/motionPolicy';
import { APPLE_EVENT } from '@/data/ultra';
import styles from './EventTheatre.module.scss';

/**
 * Privacy-enhanced host: nothing is written to a YouTube cookie until the
 * viewer actually plays the stream.
 */
const EMBED_SRC =
  `https://www.youtube-nocookie.com/embed/${APPLE_EVENT.videoId}` +
  '?autoplay=1&rel=0&modestbranding=1&playsinline=1';

export interface EventTheatreProps {
  open: boolean;
  onClose: () => void;
  /** Short state line: "Live now", "Starts in 2 days", "Replay available". */
  status: string;
  /** The start time, in the reader's own timezone once hydrated. */
  when: string;
}

/**
 * The stream, in the page.
 *
 * A native <dialog> opened with showModal() rather than a hand-built overlay:
 * the top layer puts it above the fixed nav and the scroll veil without
 * entering the z-index argument at all, and the platform already gives us the
 * focus trap, Escape, inert background and focus restore that a div would have
 * to reimplement — badly.
 *
 * The player is mounted only while the dialog is open. Nothing is requested
 * from YouTube until someone asks for it, and closing the dialog unmounts the
 * iframe rather than leaving a keynote playing behind the page.
 */
export function EventTheatre({ open, onClose, status, when }: EventTheatreProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const policy = useMotionPolicy();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    setMounted(true);
    if (!dialog.open) dialog.showModal();
  }, [open]);

  /** Both exits end here: the dialog leaves the top layer, the player unmounts. */
  const settle = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    setMounted(false);
  }, []);

  useGSAP(
    () => {
      const dialog = dialogRef.current;
      const panel = panelRef.current;
      if (!dialog || !panel) return;

      if (open) {
        if (policy.tier === 'static') {
          gsap.set(panel, { opacity: 1, y: 0, scale: 1 });
          return;
        }
        gsap.fromTo(
          panel,
          { opacity: 0, y: 24, scale: 0.985 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out', overwrite: true },
        );
        return;
      }

      if (!dialog.open) return;
      if (policy.tier === 'static') {
        settle();
        return;
      }
      gsap.to(panel, {
        opacity: 0,
        y: 14,
        scale: 0.99,
        duration: 0.24,
        ease: 'power2.in',
        overwrite: true,
        onComplete: settle,
      });
    },
    { dependencies: [open, policy.tier] },
  );

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="event-theatre-title"
      // Escape is intercepted so the close runs through the same exit as the
      // button and the backdrop, instead of the dialog vanishing on one route
      // and fading on the other.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className={styles.panel} ref={panelRef}>
        <header className={styles.bar}>
          <div className={styles.heading}>
            <p className={styles.kicker}>
              <span className={styles.dot} aria-hidden="true" />
              {APPLE_EVENT.channel} &middot; {status}
            </p>
            <h3 className={styles.title} id="event-theatre-title">
              {APPLE_EVENT.title}
            </h3>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close the event player"
            autoFocus
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <div className={styles.frame}>
          {mounted ? (
            <iframe
              className={styles.player}
              src={EMBED_SRC}
              title={APPLE_EVENT.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : null}
        </div>

        <footer className={styles.meta}>
          <p className={styles.when}>{when}</p>
          <a
            className={styles.out}
            href={APPLE_EVENT.watchHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open on YouTube <span aria-hidden="true">↗</span>
          </a>
        </footer>
      </div>
    </dialog>
  );
}
