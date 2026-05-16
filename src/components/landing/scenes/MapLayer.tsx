'use client';

import { Easing, phaseProgress } from '@/lib/landing/animation-core';
import { DUR } from '@/lib/landing/constants';

export function MapLayer({ time }: { time: number }) {
  const p = phaseProgress(time, DUR.BURST_END - 0.3, DUR.SETTLE_END - 0.3);
  const op = Easing.easeOutCubic(p);
  if (op < 0.02) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/landing/dubai-map.png"
      alt=""
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: op,
        pointerEvents: 'none',
      }}
    />
  );
}
