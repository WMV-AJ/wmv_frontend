'use client';

import { useEffect, useRef } from 'react';

/** Sets data-in="1" on the returned ref's element the first time it scrolls
 *  into view, then stops observing. CSS keys its one-shot transitions on it.
 *  `root` is the scrolling <main> (the page doesn't scroll the window). */
export function useRevealOnce<T extends HTMLElement>(root: React.RefObject<HTMLElement | null>, threshold = 0.2) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { el.dataset.in = '1'; return; }
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        el.dataset.in = '1';
        obs.disconnect();
      }
    }, { root: root.current, threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [root, threshold]);
  return ref;
}
