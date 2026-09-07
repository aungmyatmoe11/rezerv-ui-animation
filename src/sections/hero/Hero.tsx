'use client';

import { useEffect, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/motion/gsap';
import { usePreloadState } from '@/lib/motion/preloadStore';
import { useMotionPolicy } from '@/lib/motion/motionPolicy';
import { useHeroPreload } from '@/lib/motion/useHeroPreload';
import { scrollToSection } from '@/lib/motion/scrollTo';
import { posterSrc, videoSrc } from '@/data/media';
import { SplitText } from '@/components/SplitText';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import styles from './Hero.module.scss';

const SLUG = 'hero';

/** Scroll to a section without leaving a fragment in the address bar. */
const onJump = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
    return;
  }
  event.preventDefault();
  scrollToSection(id);
};

const ALT =
  'Concept render of a Dark Cherry iPhone 18 Pro turning in darkness and resolving ' +
  'into an iPhone 18 Pro title card.';

/**
 * The hero plays like Apple's own product hero: one film, once, on load.
 *
 * Verified against apple.com/iphone-17-pro directly — their hero video is
 * `loop=false`, `muted`, `playsInline`, `controls=false` and `autoplay=false`,
 * i.e. started from script so the page owns the exact moment it begins. This
 * section mirrors that. There is no pin, no scrub and no parallax; it scrolls
 * away like any other section. The scroll-scrubbed film lives in the colours
 * section instead.
 *
 * The clip resolves onto its own "iPhone 18 PRO" title card and simply stops
 * there. No swap to a separate still: the video's own last frame is that same
 * artwork at 1280px, so holding it is sharper than cross-fading to a smaller
 * image, and it costs no extra request.
 *
 * That title card IS the visible headline, which is why the <h1> below is
 * visually hidden: rendering the same words again in HTML on top of the film
 * would collide with the baked type and read as a duplicate.
 */
export function Hero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const { entranceUnlocked } = usePreloadState();
  const policy = useMotionPolicy();

  // The preloader's percentage is this film actually buffering.
  useHeroPreload(videoRef, SLUG);

  // ---- start the film exactly when the loader hands over ------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !entranceUnlocked) return;

    if (!policy.canAutoplay) {
      // Reduced motion: hold on the poster. Nothing moves.
      video.pause();
      return;
    }

    video.currentTime = 0;
    // Autoplay can be refused (power saving, backgrounded tab). The poster is a
    // fine resting state, so a rejection needs no recovery.
    void video.play().catch(() => undefined);
  }, [entranceUnlocked, policy.canAutoplay]);

  // ---- entrance (P1-R03): copy rises as the film starts --------------------
  useGSAP(
    () => {
      const root = overlayRef.current;
      if (!root || !entranceUnlocked) return;

      const words = root.querySelectorAll<HTMLElement>('[data-word]');
      const lines = root.querySelectorAll<HTMLElement>('[data-line]');

      if (policy.tier === 'static') {
        gsap.set([...words, ...lines], { opacity: 1, y: 0, clearProps: 'transform' });
        return;
      }

      /**
       * Preloader ၏ ကန့်လန့်ကာသည် 0.72s ဖြင့် အပေါ်သို့တက်နေဆဲတွင်
       * `entranceUnlocked` ဖြစ်သွားသည်။ Delay မပါလျှင် စာသားသည် ကန့်လန့်ကာ
       * နှင့်အတူ တက်နေသည့်အလား မြင်ရသည်။ 0.1s က ကန့်လန့်ကာနောက်မှ
       * ထွက်လာသည့်ခံစားမှုပေးသည် — hero သည် LCP candidate ဖြစ်၍ ဤထက်မတိုးရ။
       */
      const tl = gsap.timeline({ delay: 0.1, defaults: { ease: 'power3.out' } });

      tl.fromTo(
        words,
        { yPercent: 108, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1, stagger: 0.055 },
      ).fromTo(
        lines,
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.09,
          onComplete: () => gsap.set(lines, { willChange: 'auto' }),
        },
        '-=0.7',
      );

      return () => {
        tl.kill();
      };
    },
    { scope: overlayRef, dependencies: [entranceUnlocked, policy.tier] },
  );

  return (
    <section id="top" className={styles.section}>
      <div className={styles.stage}>
        <video
          ref={videoRef}
          className={styles.film}
          poster={posterSrc(SLUG)}
          /* Declarative, never mutated in an effect: React re-applies its own
             attributes on every render, so an imperative preload change is
             silently reverted. The hero is the LCP candidate and the thing the
             preloader waits on, so it starts fetching immediately. */
          preload="auto"
          muted
          playsInline
          disablePictureInPicture
          role="img"
          aria-label={ALT}
        >
          <source src={videoSrc(SLUG)} type="video/mp4" />
        </video>

        <div ref={overlayRef} className={styles.overlay}>
          <div className={styles.badge}>
            <ConfidenceBadge level="concept" size="sm">
              Unofficial concept
            </ConfidenceBadge>
          </div>

          {/* The visible title is rendered inside the film itself. This keeps the
              document outline correct without printing the words twice. */}
          <h1 className="visually-hidden">iPhone 18 Pro — the next Pro, reconstructed</h1>

          <div className={styles.lower}>
            <p className={styles.eyebrow} data-line>
              Based on current reports
            </p>
            <p className={styles.sub} aria-hidden="true">
              <SplitText text="The next Pro, reconstructed." />
            </p>

            {/* Real anchors so keyboard, right-click and a no-JS load all work,
                but the handler takes over so the address bar never gains a
                hash — a reload has to reopen on the hero, not mid-page. */}
            <div className={styles.actions}>
              <a className={styles.cta} href="#colors" data-line onClick={onJump('colors')}>
                <span>Explore the evidence</span>
                <span className={styles.arrow} aria-hidden="true">
                  &#8595;
                </span>
              </a>
              <a className={styles.ctaGhost} href="#ultra" data-line onClick={onJump('ultra')}>
                Discover iPhone Ultra
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
