'use client';

// Gate for the landing intro animation:
//   - every load plays the intro (logo opening, then the animation)
//   - prefers-reduced-motion renders the settled final frame at once
//
// Decided in useLayoutEffect: the intro renders nothing while 'pending', so a
// one-frame decision after hydration causes no visible flash and no
// hydration mismatch.
import { useLayoutEffect, useState } from 'react';

export type IntroState = 'pending' | 'playing' | 'done';

export function useIntroGate(): {
  state: IntroState;
  markDone: () => void;
} {
  const [state, setState] = useState<IntroState>('pending');

  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setState(reducedMotion ? 'done' : 'playing');
  }, []);

  const markDone = () => setState('done');

  return { state, markDone };
}
