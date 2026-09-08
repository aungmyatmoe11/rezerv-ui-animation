'use client';

import { type RefObject, useEffect } from 'react';
import { preloadStore } from './preloadStore';
import { posterSrc, type ClipSlug } from '@/data/media';

/**
 * Drives the preloader from the hero film's real readiness.
 *
 * The hero used to be a frame sequence and the preloader counted frames. Now the
 * hero is a single one-shot video, so the honest thing to gate on is whether that
 * video can actually play through — which is also the moment Apple's own hero
 * starts. Progress is read from the element's `buffered` ranges, not a timer, so a
 * slow connection genuinely holds the loading screen.
 *
 * Weighted so the poster (which paints first and is the LCP candidate) is worth a
 * quarter of the bar and the video the rest. Pass `waitForFilm=false` on the
 * static tier and on lite (phone) autoplay so the curtain never waits on the
 * 4K hero. Phones play `hero-1280.mp4` after unlock.
 */
const POSTER_WEIGHT = 0.25;

export function useHeroPreload(
  videoRef: RefObject<HTMLVideoElement | null>,
  slug: ClipSlug,
  waitForFilm = true,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let posterDone = 0;
    let videoDone = 0;
    let settled = false;

    const report = () => {
      if (settled) return;
      const value = posterDone * POSTER_WEIGHT + videoDone * (1 - POSTER_WEIGHT);
      preloadStore.setProgress(Math.round(value * 100), 100);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      preloadStore.setProgress(100, 100);
      preloadStore.setReady();
    };

    // --- poster ---
    const img = new Image();
    img.onload = img.onerror = () => {
      posterDone = 1;
      report();
      // Poster-gated tiers hold on this still. Waiting on the 4K film would
      // keep the curtain up through a multi-megabyte fetch.
      if (!waitForFilm) finish();
    };
    img.src = posterSrc(slug);
    if (img.complete) {
      posterDone = 1;
      report();
      if (!waitForFilm) finish();
    }

    if (!waitForFilm) return () => {
      img.onload = img.onerror = null;
    };

    // --- video ---
    const onProgress = () => {
      const { buffered, duration } = video;
      if (!duration || !Number.isFinite(duration) || buffered.length === 0) return;
      videoDone = Math.min(1, buffered.end(buffered.length - 1) / duration);
      report();
    };

    const onReady = () => {
      videoDone = 1;
      finish();
    };

    // The page must open even if the film cannot be fetched; the poster still
    // carries the section.
    const onError = () => finish();

    video.addEventListener('progress', onProgress);
    video.addEventListener('loadedmetadata', onProgress);
    video.addEventListener('canplaythrough', onReady);
    video.addEventListener('error', onError);

    // Deliberately does NOT touch video.preload or call load(): React owns that
    // attribute and would revert an imperative change on the next render. The
    // element declares preload="auto" only while this hook waits on the film
    // (desktop/tablet autoplay). Lite and static use preload="none". A warm
    // cache can be ready before this effect runs, so check once up front.
    onProgress();
    if (video.readyState >= 3) onReady();

    return () => {
      img.onload = img.onerror = null;
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('loadedmetadata', onProgress);
      video.removeEventListener('canplaythrough', onReady);
      video.removeEventListener('error', onError);
    };
  }, [videoRef, slug, waitForFilm]);
}
