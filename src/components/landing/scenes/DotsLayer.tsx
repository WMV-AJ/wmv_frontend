'use client';

import { Easing, clamp, lerp, phaseProgress } from '@/lib/landing/animation-core';
import { CENTER_X, CENTER_Y, DOTS, DUR } from '@/lib/landing/constants';

export function DotsLayer({ time }: { time: number }) {
  if (time < DUR.COLLAPSE_END - 0.2 || time > DUR.TOTAL) return null;

  const burstP = phaseProgress(time, DUR.COLLAPSE_END, DUR.BURST_END);
  const settleP = phaseProgress(time, DUR.BURST_END, DUR.SETTLE_END);

  return (
    <>
      {DOTS.map((d, i) => {
        let x: number;
        let y: number;
        let scale: number;
        let opacity: number;
        let glow: number;

        if (settleP <= 0) {
          // BURST phase — explode outward
          const e = Easing.easeOutCubic(burstP);
          x = lerp(CENTER_X, d.scatterX, e);
          y = lerp(CENTER_Y, d.scatterY, e);
          scale = 0.3 + 0.9 * burstP;
          opacity = burstP < 0.1 ? burstP / 0.1 : 1;
          glow = 30 * (1 - burstP * 0.5);
        } else {
          // SETTLE phase — arc into final map position
          const stagger = (d.seed % 7) * 0.04;
          const localE = clamp((settleP - stagger) / (1 - stagger), 0, 1);
          const eased = Easing.easeInOutCubic(localE);
          x = lerp(d.scatterX, d.finalX, eased);
          y = lerp(d.scatterY, d.finalY, eased);
          const arc = Math.sin(eased * Math.PI) * 60;
          y -= arc;
          scale = 1.2 - 0.4 * eased;
          opacity = 1;
          glow = 30 * (1 - eased * 0.7);
        }

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`,
              width: d.size,
              height: d.size,
              borderRadius: '50%',
              background: d.color,
              opacity,
              boxShadow: `0 0 ${glow}px ${d.color}cc, 0 0 ${glow * 2}px ${d.color}66`,
              willChange: 'transform',
            }}
          />
        );
      })}
    </>
  );
}
