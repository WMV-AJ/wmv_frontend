'use client';

import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { TimelineContext } from './animation-core';

export interface StageHandle {
  /** Jump the playhead (e.g. skipTo(duration) to skip the intro). */
  skipTo: (t: number) => void;
  /** Current playhead in seconds. */
  getTime: () => number;
}

interface StageProps {
  width: number;
  height: number;
  duration: number;
  background?: string;
  loop?: boolean;
  /** Start the playhead here (duration = render the settled final frame). */
  initialTime?: number;
  /** Fires once when a non-looping run reaches the end (incl. via skipTo). */
  onComplete?: () => void;
  children: ReactNode;
}

// Stripped-down version of animations.jsx Stage — production runtime only.
// rAF + scale-to-fit, plus: initialTime (returning visitors render the final
// frame statically), onComplete (marketing-home handoff), and a skipTo handle.
// When loop=false the rAF loop CANCELS at duration — a settled hero costs
// zero animation work.
export const Stage = forwardRef<StageHandle, StageProps>(function Stage(
  {
    width,
    height,
    duration,
    background = '#0a0a1a',
    loop = true,
    initialTime = 0,
    onComplete,
    children,
  },
  ref,
) {
  const [time, setTime] = useState(Math.min(initialTime, duration));
  // Start at 0 so the SSR'd HTML paints an invisible canvas. Without this,
  // the browser briefly shows the canvas at full 1080×1920 (scale 1) before
  // JS hydrates and runs the measurement — content spills past the viewport.
  const [scale, setScale] = useState(0);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const doneRef = useRef(initialTime >= duration);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // The clock lives in a ref (state is only the propagation mechanism):
  // deriving the next tick from state-fed values stalls permanently if a
  // setTime bails out on an unchanged value (no re-render → stale input).
  const clockRef = useRef(Math.min(initialTime, duration));

  useImperativeHandle(ref, () => ({
    skipTo: (t: number) => {
      const clamped = Math.min(t, duration);
      clockRef.current = clamped;
      setTime(clamped);
      if (!loop && clamped >= duration && !doneRef.current) {
        doneRef.current = true;
        onCompleteRef.current?.();
      }
    },
    getTime: () => clockRef.current,
  }));

  // Auto-scale canvas to fit wrapper while preserving aspect ratio.
  // useLayoutEffect so the measurement runs BEFORE the browser paints.
  useLayoutEffect(() => {
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

  // rAF playhead loop. Wraps via modulo when loop=true; STOPS at the end
  // when loop=false (fires onComplete exactly once) so a settled hero costs
  // zero animation work.
  useEffect(() => {
    if (doneRef.current && !loop) return; // already settled — nothing to run

    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      let next = clockRef.current + dt;
      let finished = false;
      if (next >= duration) {
        if (loop) {
          next = next % duration;
        } else {
          next = duration;
          finished = true;
        }
      }
      clockRef.current = next;
      setTime(next);

      if (finished || doneRef.current) {
        if (!doneRef.current) {
          doneRef.current = true;
          onCompleteRef.current?.();
        }
        rafRef.current = null;
        return; // do not reschedule
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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
});
