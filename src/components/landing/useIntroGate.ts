'use client';

// Gate for the landing intro animation:
//   - first visit → play the 3.4s intro once, then mark seen
//   - returning visit / prefers-reduced-motion → render the settled final
//     frame statically (Stage initialTime = TOTAL, zero animation work)
//
// Decided in useLayoutEffect: the Stage SSRs at scale 0 (invisible), so a
// one-frame decision after hydration causes no visible flash and avoids the
// localStorage-in-initial-render hydration mismatch.
import { useLayoutEffect, useState } from 'react';

const SEEN_KEY = 'wmv_intro_v2';

export type IntroState = 'pending' | 'playing' | 'done';

export function useIntroGate(): {
  state: IntroState;
  markDone: () => void;
} {
  const [state, setState] = useState<IntroState>('pending');

  useLayoutEffect(() => {
    try {
      const seen = window.localStorage.getItem(SEEN_KEY);
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      setState(seen || reducedMotion ? 'done' : 'playing');
    } catch {
      // Storage unavailable (private mode etc.) — just play it.
      setState('playing');
    }
  }, []);

  const markDone = () => {
    try {
      window.localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {
      /* non-fatal */
    }
    setState('done');
  };

  return { state, markDone };
}
