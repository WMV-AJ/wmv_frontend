'use client';

import { useEffect, useRef, useState } from 'react';

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

/** Like useRevealOnce, but also returns whether it has come into view, for
 *  JS-driven animations (count-ups, timed sequences). */
export function useInViewOnce<T extends HTMLElement>(root: React.RefObject<HTMLElement | null>, threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        el.dataset.in = '1';
        setInView(true);
        obs.disconnect();
      }
    }, { root: root.current, threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [root, threshold]);
  return [ref, inView] as const;
}

/** True when the viewer asked for reduced motion (client only). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Counts 0 → target (ease-out, 1.2s) once `run` turns true; jumps straight
 *  to the target under reduced motion. */
export function useCountUp(target: number, run: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (prefersReducedMotion()) { setValue(target); return; }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 1200);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return value;
}
