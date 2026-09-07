'use client';

import { useSyncExternalStore } from 'react';

/**
 * Bridges the hero frame loader to the preloader UI.
 *
 * Kept as a 30-line external store rather than context: the preloader unmounts
 * as soon as it is done, and putting a value that changes ~40 times during load
 * into context would re-render the whole tree behind it.
 */
export type PreloadPhase = 'loading' | 'ready' | 'failed';

interface PreloadState {
  phase: PreloadPhase;
  loaded: number;
  total: number;
  /** Flipped when the preloader begins its exit, handing the stage to the
   *  hero's entrance timeline. Keeps the two sequences from overlapping. */
  entranceUnlocked: boolean;
}

// Must be a stable reference: useSyncExternalStore compares snapshots by
// identity, so returning a fresh object per call is an infinite render loop.
const INITIAL: PreloadState = {
  phase: 'loading',
  loaded: 0,
  total: 1,
  entranceUnlocked: false,
};

let state: PreloadState = INITIAL;
const listeners = new Set<() => void>();

function emit(next: PreloadState) {
  state = next;
  listeners.forEach((l) => l());
}

export const preloadStore = {
  setProgress(loaded: number, total: number) {
    if (state.phase !== 'loading') return;
    emit({ ...state, phase: 'loading', loaded, total });
  },
  setReady() {
    emit({ ...state, phase: 'ready' });
  },
  /** The page must still be usable if frames 404 or the network dies. */
  setFailed() {
    emit({ ...state, phase: 'failed' });
  },
  unlockEntrance() {
    if (state.entranceUnlocked) return;
    emit({ ...state, entranceUnlocked: true });
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

const getSnapshot = () => state;
const getServerSnapshot = (): PreloadState => INITIAL;

export function usePreloadState(): PreloadState {
  return useSyncExternalStore(preloadStore.subscribe, getSnapshot, getServerSnapshot);
}
