'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { TimelineContext } from './animation-core';

interface StageProps {
  width: number;
  height: number;
  duration: number;
  background?: string;
  loop?: boolean;
  children: ReactNode;
}

// Stripped-down version of animations.jsx Stage — production runtime only.
// No PlaybackBar, no localStorage, no keyboard handlers. Just rAF + scale-to-fit.
export function Stage({
  width,
  height,
  duration,
  background = '#0a0a1a',
  loop = true,
  children,
}: StageProps) {
  const [time, setTime] = useState(0);
  const [scale, setScale] = useState(1);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  // Auto-scale canvas to fit wrapper while preserving aspect ratio.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const measure = () => {
      const s = Math.min(el.clientWidth / width, el.clientHeight / height);
      setScale(Math.max(0.05, s));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [width, height]);

  // rAF playhead loop. Runs continuously; wraps via modulo when loop=true.
  useEffect(() => {
    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((t) => {
        let next = t + dt;
        if (next >= duration) {
          next = loop ? next % duration : duration;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [duration, loop]);

  const ctxValue = useMemo(
    () => ({ time, duration, playing: true }),
    [time, duration],
  );

  const wrapperStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: '#000',
  };

  const canvasStyle: CSSProperties = {
    width,
    height,
    background,
    position: 'relative',
    transform: `scale(${scale})`,
    transformOrigin: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  };

  return (
    <div ref={wrapperRef} style={wrapperStyle}>
      <div style={canvasStyle}>
        <TimelineContext.Provider value={ctxValue}>
          {children}
        </TimelineContext.Provider>
      </div>
    </div>
  );
}
