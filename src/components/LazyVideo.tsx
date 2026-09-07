'use client';

import { useEffect, useRef } from 'react';
import { useMotionPolicy } from '@/lib/motion/motionPolicy';
import { posterSrc, videoSrc, type ClipSlug } from '@/data/media';
import styles from './LazyVideo.module.scss';

export interface LazyVideoProps {
  slug: ClipSlug;
  /** Describe the shot. Omit only when adjacent copy already says the same thing. */
  alt?: string;
  className?: string;
  loop?: boolean;
  /** `contain` for clips whose background is not pure black. */
  fit?: 'cover' | 'contain';
}

/**
 * A clip that costs nothing until it is nearly on screen.
 *
 * preload="none" plus a poster means the initial page transfers ~40KB per
 * section instead of a whole video. The observer starts the fetch one viewport
 * early so playback begins as the section arrives, and pauses on exit so a
 * 20-section page is never decoding twenty videos at once.
 */
export function LazyVideo({
  slug,
  alt,
  className,
  loop = true,
  fit = 'cover',
}: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const policy = useMotionPolicy();

  /**
   * `clipVariant` is `mobile` on the phone width — and on the server snapshot —
   * so a desktop briefly holds the small file and swaps up, rather than a phone
   * briefly holding the large one and swapping down.
   *
   * Reduced motion still reports a variant from the viewport. That costs
   * nothing: `canAutoplay` is false, so the observer never promotes `preload`,
   * no controls are rendered, and the poster carries the section.
   */
  const src = videoSrc(slug, policy.clipVariant);
  const applied = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /**
     * A <source> is read once, by the resource selection algorithm, when the
     * element is inserted. React updating that attribute afterwards changes
     * nothing on its own — and the variant resolves a tick after hydration, so
     * the element always starts on the server's guess. `load()` is the only way
     * to make the element look again.
     *
     * Skipped on mount: nothing has been selected to correct yet, and with
     * preload="none" there is no fetch in flight either way.
     *
     * The observer is rebuilt after a swap because it already fired while the
     * element was intersecting, so it will not fire again — and `load()` resets
     * preload to the React attribute `none`. A new observer picks up the
     * current intersection and re-promotes the fetch.
     */
    const swapped = applied.current !== null && applied.current !== src;
    applied.current = src;
    if (swapped) el.load();

    if (!policy.canAutoplay) {
      el.pause();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (el.preload !== 'auto') el.preload = 'auto';
            // Autoplay can reject (power saving, backgrounded tab). The poster
            // stays up in that case, which is a fine resting state.
            void el.play().catch(() => undefined);
          } else {
            el.pause();
          }
        }
      },
      { rootMargin: '100% 0px 100% 0px', threshold: 0 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [src, policy.canAutoplay]);

  const decorative = !alt;

  return (
    <video
      ref={ref}
      className={`${styles.video} ${className ?? ''}`}
      data-fit={fit}
      data-clip-variant={policy.clipVariant}
      poster={posterSrc(slug)}
      preload="none"
      muted
      loop={loop}
      playsInline
      disablePictureInPicture
      aria-hidden={decorative || undefined}
      aria-label={alt}
      role={decorative ? undefined : 'img'}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
