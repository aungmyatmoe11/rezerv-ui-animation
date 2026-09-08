'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import {
  useScrubSequence,
  type ProgressListener,
  type ScrubMode,
} from '@/lib/motion/useScrubSequence';
import { clipAspect, playedFrames, posterSrc, type ScrubSlug } from '@/data/media';
import { LazyVideo } from './LazyVideo';
import styles from './ScrubStage.module.scss';

export interface ScrubStageState {
  /** 'scrub' once frames are painted; 'pending' while they load; 'video' on the fallback tier. */
  mode: ScrubMode;
  /** Follow the painted 0..1 position. Fires from the render tick, never from React. */
  subscribe: (listener: ProgressListener) => () => void;
}

const ScrubStageContext = createContext<ScrubStageState | null>(null);

/**
 * Read the enclosing stage's mode and position — for overlay content that
 * choreographs itself to the film.
 */
export function useScrubStage(): ScrubStageState {
  const ctx = useContext(ScrubStageContext);
  if (!ctx) throw new Error('useScrubStage must be used inside <ScrubStage>');
  return ctx;
}

/**
 * Choreograph overlay content to the film.
 *
 * Builds a paused GSAP timeline padded to exactly one second, so a position on
 * it reads as a fraction of the film, and scrubs it with the stage's painted
 * position — the smoothed one, after the lerp, so nothing can drift from the
 * frame on screen. The timeline runs backwards when the visitor scrolls up,
 * because the position does.
 *
 * On the video tier nothing is built: the overlay's own CSS is its resting
 * state, so everything is simply visible. Returns the mode so the overlay can
 * restyle itself for that case.
 */
export function useScrubTimeline(
  scope: RefObject<HTMLElement | null>,
  build: (tl: gsap.core.Timeline, root: HTMLElement) => void,
): ScrubMode {
  const { mode, subscribe } = useScrubStage();

  useGSAP(
    () => {
      const root = scope.current;
      if (!root || mode === 'video') return;

      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
      build(tl, root);
      tl.to({}, { duration: 0.001 }, 0.999);

      const unsubscribe = subscribe((progress) => {
        tl.progress(progress);
      });

      return () => {
        unsubscribe();
        tl.kill();
      };
    },
    { scope, dependencies: [mode, subscribe] },
  );

  return mode;
}

export interface ScrubStageProps {
  slug: ScrubSlug;
  id?: string;
  alt: string;
  eager?: boolean;
  pinVh?: number;
  /** 0..1 - how fast the painted frame chases the scroll position. Lower is smoother. */
  smoothing?: number;
  /** 'contain' keeps the whole frame visible instead of cropping to fill. */
  fit?: 'cover' | 'contain';
  /**
   * Height of the media box as a fraction of the pinned stage (0..1).
   *
   * The section stays full-bleed; only the film is inset. A wide product shot
   * needs headroom so it does not read as a cropped wall of phone, and it leaves
   * a clean band for the caption.
   */
  mediaHeight?: number;
  /**
   * How the video tier lays out. 'overlay' keeps the viewport-height stage with
   * the content over the clip; 'stacked' shows the clip at its own aspect ratio
   * with the content in normal flow beneath it — for overlays that carry real
   * copy, which a phone cannot hold over a letterboxed clip.
   */
  videoLayout?: 'overlay' | 'stacked';
  /** Scroll hint under the film. Hidden on the video tier, where the clip loops by itself. */
  hint?: string;
  className?: string;
  /** Overlay content, pinned with the stage. */
  children?: ReactNode;
}

/**
 * A pinned, scroll-scrubbed film.
 *
 * Renders a canvas where the device can afford it and the same clip as a
 * looping video everywhere else — mobile, reduced motion, or a failed frame
 * fetch. Both paths show the identical footage, so the story never depends on
 * the expensive path being available.
 */
export function ScrubStage({
  slug,
  id,
  alt,
  eager = false,
  pinVh = 2,
  smoothing,
  fit = 'cover',
  mediaHeight = 1,
  videoLayout = 'overlay',
  hint,
  className,
  children,
}: ScrubStageProps) {
  const { start, count } = playedFrames(slug);
  const { sectionRef, canvasRef, mode, failed, subscribe } = useScrubSequence({
    slug,
    frameCount: count,
    startFrame: start,
    eager,
    pinVh,
    fit,
    ...(smoothing === undefined ? {} : { smoothing }),
  });

  const state = useMemo<ScrubStageState>(() => ({ mode, subscribe }), [mode, subscribe]);
  // Stacked layout is the intentional video tier (mobile / reduced-motion).
  // A mid-session frame 404 must not collapse the pin by switching to it.
  const stacked = mode === 'video' && videoLayout === 'stacked' && !failed;

  /**
   * Drop the holding poster once the canvas owns the picture.
   *
   * It used to stay mounted at full opacity underneath every scrub canvas for
   * the whole session. The canvas is opaque, so nothing was visible, but seven
   * full-bleed background images were still being composited for nothing. The
   * delay covers the canvas fade-in so the handover is never a flash.
   */
  const [holdingGone, setHoldingGone] = useState(false);
  useEffect(() => {
    if (mode !== 'scrub') {
      setHoldingGone(false);
      return;
    }
    const t = window.setTimeout(() => setHoldingGone(true), 600);
    return () => window.clearTimeout(t);
  }, [mode]);

  return (
    <section
      id={id}
      ref={sectionRef as React.RefObject<HTMLElement>}
      className={`${styles.section} ${className ?? ''}`}
      data-mode={mode}
      data-fit={fit}
      data-layout={stacked ? 'stacked' : 'overlay'}
    >
      <div
        className={styles.stage}
        style={{ '--aspect': clipAspect(slug) } as React.CSSProperties}
      >
        <div
          className={styles.media}
          style={{ '--media-h': `${Math.round(mediaHeight * 100)}%` } as React.CSSProperties}
        >
          {mode === 'video' ? (
            <LazyVideo slug={slug} alt={alt} fit={fit} className={styles.fallback} />
          ) : (
            <>
              {/* Holding image while the sequence downloads.
                  A 2D context created with `alpha: false` is opaque BLACK until
                  something is drawn to it, so an unpainted canvas is not a
                  transparent hole — it is a black wall over the whole section.
                  At ~4 MB per sequence that wall can stand for seconds on a slow
                  connection. The poster is a frame of the very same film, so the
                  section reads as content the entire time; the canvas fades in
                  over it once the renderer has painted. Decorative: the canvas
                  beside it already carries the accessible name. */}
              {holdingGone ? null : (
                <div
                  className={styles.holding}
                  style={{ backgroundImage: `url(${posterSrc(slug)})` }}
                  data-fit={fit}
                  aria-hidden="true"
                />
              )}
              <canvas ref={canvasRef} className={styles.canvas} role="img" aria-label={alt} />
            </>
          )}
        </div>
        {children ? (
          <ScrubStageContext.Provider value={state}>
            <div className={styles.overlay}>{children}</div>
          </ScrubStageContext.Provider>
        ) : null}
        {hint ? (
          <p className={styles.hint} aria-hidden="true">
            {hint}
          </p>
        ) : null}
      </div>
    </section>
  );
}
