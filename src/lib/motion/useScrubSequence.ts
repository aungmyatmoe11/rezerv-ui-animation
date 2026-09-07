'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from './gsap';
import { loadFrames, type FrameSet } from './frameLoader';
import { createFrameRenderer, type FrameRenderer } from './frameRenderer';
import { useMotionPolicy } from './motionPolicy';
import { preloadStore, usePreloadState } from './preloadStore';

export type ScrubMode = 'pending' | 'scrub' | 'video';

export type ProgressListener = (progress: number) => void;

export interface UseScrubSequenceOptions {
  /** Folder under /public/frames. */
  slug: string;
  frameCount: number;
  /** Hero only: load during the preloader and report progress to it. */
  eager?: boolean;
  /** Pin length as a multiple of viewport height, before the tier's pinScale. */
  pinVh?: number;
  /** 0..1 — how fast the painted position chases the scroll position. */
  smoothing?: number;
  /** 'contain' keeps the whole frame visible instead of cropping to fill. */
  fit?: 'cover' | 'contain';
}

export interface UseScrubSequenceResult {
  sectionRef: React.RefObject<HTMLElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  mode: ScrubMode;
  /** 0..1, mirrors the painted position — for syncing captions to the film. */
  progressRef: React.RefObject<number>;
  /**
   * Follow the painted position without a React render per frame.
   *
   * Listeners fire from the render tick with the smoothed position — the one
   * actually on the canvas, after the lerp — so an overlay that scrubs its own
   * GSAP timeline with it can never drift from the frame on screen, and runs
   * backwards exactly when the film does. Returns an unsubscribe.
   */
  subscribe: (listener: ProgressListener) => () => void;
}

/**
 * Scroll-driven canvas frame scrub.
 *
 * Why not scrub a <video> with currentTime: seek accuracy depends on GOP
 * structure, so making it reliable needs -g 1, which inflates every file 3-5x.
 * Frame sequences are deterministic and behave identically in every browser.
 * Documented as a rejected alternative in the README.
 */
export function useScrubSequence({
  slug,
  frameCount,
  eager = false,
  pinVh = 2,
  smoothing = 0.18,
  fit = 'cover',
}: UseScrubSequenceOptions): UseScrubSequenceResult {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef<number>(0);

  const policy = useMotionPolicy();
  const { entranceUnlocked } = usePreloadState();
  const [frames, setFrames] = useState<FrameSet | null>(null);
  const [failed, setFailed] = useState(false);

  const rendererRef = useRef<FrameRenderer | null>(null);
  const targetRef = useRef(0);
  const currentRef = useRef(0);

  // Stable for the life of the hook, so subscribing components can list it as
  // a dependency without re-subscribing on every render.
  const [listeners] = useState(() => new Set<ProgressListener>());
  const subscribe = useCallback(
    (listener: ProgressListener) => {
      listeners.add(listener);
      // A late subscriber gets the current position at once, so an overlay
      // mounted mid-scroll does not sit at frame 0 until the next scroll event.
      listener(currentRef.current);
      return () => {
        listeners.delete(listener);
      };
    },
    [listeners],
  );

  // ---- 1. acquire frames -------------------------------------------------
  useEffect(() => {
    if (!policy.canScrub) return;

    /**
     * Nothing lazy competes with the film the loading screen is waiting on.
     *
     * The colours sequence sits inside the 150% root margin at scroll 0, so its
     * 56 frames — 3.6MB, measured — used to start downloading beside the 3.8MB
     * hero video that actually gates the preloader. Two equal downloads share
     * the pipe, so the loading screen stayed up for roughly twice as long as
     * the film it was waiting for needed.
     *
     * The frames lose nothing by waiting: their section is a full viewport
     * below the fold and cannot be reached until the loader has handed over.
     */
    if (!eager && !entranceUnlocked) return;

    const controller = new AbortController();
    let cancelled = false;

    const run = () => {
      loadFrames(slug, frameCount, {
        signal: controller.signal,
        onProgress: eager
          ? (loaded, total) => preloadStore.setProgress(loaded, total)
          : undefined,
      })
        .then((set) => {
          if (cancelled) return;
          setFrames(set);
          if (eager) preloadStore.setReady();
        })
        .catch((err: unknown) => {
          if (cancelled || (err as Error)?.name === 'AbortError') return;
          // A missing frame set must never strand the visitor on a loading
          // screen — fall through to the video rendering of the same clip.
          console.warn(`[scrub:${slug}] falling back to video`, err);
          setFailed(true);
          if (eager) preloadStore.setFailed();
        });
    };

    if (eager) {
      run();
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    // Lazy sections start fetching ~1.5 viewports out, so the sequence is
    // resident by the time it is pinned but costs nothing on first paint.
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { rootMargin: '150% 0px' },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      controller.abort();
    };
  }, [slug, frameCount, eager, entranceUnlocked, policy.canScrub]);

  // ---- 2. renderer + resize ---------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!frames || !canvas) return;

    const renderer = createFrameRenderer(canvas, frames, { fit });
    rendererRef.current = renderer;
    renderer.draw(currentRef.current, true);

    const ro = new ResizeObserver(() => renderer.resize());
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [frames, fit]);

  // ---- 3. scroll wiring --------------------------------------------------
  /**
   * The pin is created on mount, NOT when the frames arrive.
   *
   * This is the single most important line in the file. The pin used to wait on
   * `frames`, and the frames are fetched lazily an viewport and a half out — so
   * each of the eight scrub sections silently added its own pin distance to the
   * document *while the visitor was scrolling toward it*. Measured on the
   * production build: the page grew from 29,340px to 43,650px in seven discrete
   * jumps of 1,620–2,520px each. Every jump re-measured every ScrollTrigger
   * below it and moved whatever was on screen. That is the "not smooth", and it
   * is also why a nav click had to chase a target that kept running away.
   *
   * The pin's length is `pinVh` — known at mount, independent of any download —
   * so reserving it up front costs nothing and makes the document height a
   * constant. The poster holds the stage until the canvas can paint, exactly as
   * it did before.
   */
  useGSAP(
    () => {
      const section = sectionRef.current;
      // `failed` falls back to a looping video, and the stacked video layout is
      // not a pinnable box — so that one case genuinely must not pin.
      if (!section || !policy.canPin || failed) return;

      const distance = Math.round(pinVh * policy.pinScale * 100);
      let running = false;

      /**
       * Paint from GSAP's ticker rather than a private rAF loop.
       *
       * Eight sections each running their own `requestAnimationFrame` chase put
       * eight clocks on the page, none of them phase-locked to the one
       * ScrollTrigger updates on. Sharing the ticker means the canvas is painted
       * in the same frame as the pin it belongs to, so the frame on screen can
       * never be one tick out of step with the scroll position that chose it.
       */
      const tick = () => {
        const target = targetRef.current;
        const next = currentRef.current + (target - currentRef.current) * smoothing;
        currentRef.current = Math.abs(target - next) < 0.0005 ? target : next;
        progressRef.current = currentRef.current;
        rendererRef.current?.draw(currentRef.current);
        for (const listener of listeners) listener(currentRef.current);

        // Settled: stop drawing until the scroll moves again.
        if (currentRef.current === target) {
          running = false;
          gsap.ticker.remove(tick);
        }
      };

      const kick = () => {
        if (running) return;
        running = true;
        gsap.ticker.add(tick);
      };

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: `+=${distance}%`,
        pin: true,
        pinSpacing: true,
        // Switching an element to `position: fixed` at the pin start is a
        // one-frame layout change. On a fast scroll the visitor sees it as a
        // jolt; anticipating it applies the switch fractionally early, which is
        // the difference between a pin that catches and one that snaps.
        anticipatePin: 1,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          targetRef.current = self.progress;
          kick();
        },
        onRefresh: () => rendererRef.current?.resize(),
      });

      return () => {
        gsap.ticker.remove(tick);
        running = false;
        trigger.kill();
      };
    },
    {
      scope: sectionRef,
      dependencies: [policy.canPin, policy.pinScale, pinVh, smoothing, listeners, failed],
    },
  );

  const mode: ScrubMode = !policy.canScrub || failed
    ? 'video'
    : frames
      ? 'scrub'
      : 'pending';

  return { sectionRef, canvasRef, mode, progressRef, subscribe };
}
