'use client';

import { Easing, phaseProgress } from '@/lib/landing/animation-core';
import { DUR } from '@/lib/landing/constants';

export function LogoLayer({ time }: { time: number }) {
  const dissolveStart = DUR.COLLAPSE_END - 0.3;
  const dissolveP = phaseProgress(time, dissolveStart, DUR.BURST_END);
  const op = 1 - Easing.easeInQuad(dissolveP);
  if (op < 0.02) return null;

  const scale = 1 + dissolveP * 0.5;
  const logoRot = time * 18;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        width: 460,
        height: 460,
        opacity: op,
        zIndex: 10,
        willChange: 'transform, opacity',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -30,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(202, 138, 4,0.5), rgba(202, 138, 4,0) 65%)',
          filter: 'blur(8px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '50%',
          border: '2px solid rgba(244, 196, 48,0.4)',
          borderTopColor: 'rgba(244, 196, 48,0.95)',
          borderRightColor: 'rgba(236,72,153,0.75)',
          transform: `rotate(${logoRot}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow:
            '0 0 80px rgba(202, 138, 4,0.6), 0 0 40px rgba(236,72,153,0.35), 0 20px 60px rgba(0,0,0,0.6)',
          background: '#000',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/wmv-logo.gif"
          alt="Where's My Vibe"
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
        />
      </div>
    </div>
  );
}
