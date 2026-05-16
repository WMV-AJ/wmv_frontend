'use client';

import { Easing, clamp, lerp } from '@/lib/landing/animation-core';
import { CANVAS_H, CANVAS_W, CENTER_X, CENTER_Y, DUR } from '@/lib/landing/constants';

type Side = 'left' | 'right' | 'center';

interface SourceLabel {
  idx: string;
  text: string;
  x: number;        // 0..1 normalized — label CENTER
  y: number;
  color: string;    // bright accent — used for border glow, scanner bar, dot
  textColor: string; // dark readable variant for the main label on white glass
  delay: number;
  count: string;
  side: Side;
}

// Each label has both a bright accent `color` (used for glow, scanner bar,
// pulse dot, thread, traveling dot) AND a darker readable `textColor` for the
// main label on the white-glass background. The dark variants are tuned for
// AAA contrast on translucent white — yellow especially needs the dark
// variant since bright yellow text is unreadable on light backgrounds.
const LABELS: SourceLabel[] = [
  { idx: '01', text: 'INSTAGRAM STORIES', x: 0.25, y: 0.26, color: '#ec4899', textColor: '#9d174d', delay: 0.2, count: '2,341 stories', side: 'left'   },
  { idx: '02', text: 'INSTAGRAM POSTS',   x: 0.75, y: 0.28, color: '#eab308', textColor: '#713f12', delay: 0.5, count: '1,089 posts',   side: 'right'  },
  { idx: '03', text: 'TICKETING APIs',    x: 0.50, y: 0.18, color: '#10b981', textColor: '#064e3b', delay: 0.8, count: '12 sources',    side: 'center' },
  { idx: '04', text: 'PLATINUM LIST',     x: 0.50, y: 0.82, color: '#0ea5e9', textColor: '#0c4a6e', delay: 1.1, count: 'live feed',     side: 'center' },
  { idx: '05', text: 'VENUE WEBSITES',    x: 0.27, y: 0.68, color: '#f97316', textColor: '#7c2d12', delay: 1.4, count: '380 venues',    side: 'left'   },
  { idx: '06', text: 'DUBAI EVENT SITES', x: 0.73, y: 0.70, color: '#8b5cf6', textColor: '#4c1d95', delay: 1.7, count: '47 sites',      side: 'right'  },
];

// Approximate bounding box of each card — used to start the data thread at
// the card edge rather than from the card center. Slightly oversized so the
// dashed line never appears to come from inside the box. The boxes auto-size
// to their longest child (no maxWidth), so this is an upper-bound estimate
// covering the widest label ("INSTAGRAM STORIES").
const BOX_W = 420;
const BOX_H = 160;
// Logo radius — line stops short of the logo so it reads as "data flowing
// INTO the brand" instead of piercing through it.
const LOGO_RADIUS = 240;
// Seconds per dot trip (card edge → logo edge).
const DOT_TRAVEL_S = 1.6;

// Rectangle-edge intersection: where does the ray from the box center, in
// direction (ux, uy), hit the box's bounding rectangle?
function rectExit(cx: number, cy: number, ux: number, uy: number) {
  const halfW = BOX_W / 2;
  const halfH = BOX_H / 2;
  const tx = Math.abs(ux) < 1e-6 ? Infinity : halfW / Math.abs(ux);
  const ty = Math.abs(uy) < 1e-6 ? Infinity : halfH / Math.abs(uy);
  const t = Math.min(tx, ty);
  return { x: cx + ux * t, y: cy + uy * t };
}

export function ChaosOverlay({ time }: { time: number }) {
  if (time > DUR.CHAOS_END + 0.4) return null;

  const fadeIn = clamp(time / 0.5, 0, 1);
  const fadeOut = 1 - clamp((time - (DUR.CHAOS_END - 0.6)) / 0.6, 0, 1);
  const baseOp = Easing.easeOutCubic(fadeIn) * Easing.easeOutCubic(fadeOut);

  const blink = (Math.sin(time * Math.PI * 5) + 1) / 2;
  const dotOp = 0.55 + 0.45 * blink;

  // Precompute thread geometry per label: starts at the card edge, ends at
  // the logo rim. Unit vector points label → logo.
  const geometry = LABELS.map((L) => {
    const labelX = L.x * CANVAS_W;
    const labelY = L.y * CANVAS_H;
    const dx = CENTER_X - labelX;
    const dy = CENTER_Y - labelY;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const start = rectExit(labelX, labelY, ux, uy);
    return {
      labelX,
      labelY,
      startX: start.x,
      startY: start.y,
      endX: CENTER_X - ux * LOGO_RADIUS,
      endY: CENTER_Y - uy * LOGO_RADIUS,
    };
  });

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: baseOp }}>
      {/* SCANNING · REVIEWING headline */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 60,
          transform: 'translate(-50%, 0)',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#ef4444',
            boxShadow: `0 0 ${14 + 18 * blink}px #ef4444, 0 0 ${30 + 26 * blink}px rgba(239,68,68,${0.4 + 0.4 * blink})`,
            opacity: dotOp,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-geist-sans), ui-monospace, monospace",
            fontSize: 30,
            fontWeight: 800,
            color: '#ef4444',
            textTransform: 'uppercase',
            letterSpacing: '6px',
            opacity: dotOp,
            textShadow: `0 0 18px rgba(239,68,68,${0.6 + 0.3 * blink}), 0 2px 12px rgba(0,0,0,0.9)`,
          }}
        >
          SCANNING · REVIEWING
        </span>
      </div>

      {/* Diagonal scan rays */}
      {[0, 1].map((i) => {
        const phase = ((time * 0.35) + i * 0.5) % 1;
        const rayY = phase * CANVAS_H + (i % 2 ? -200 : 0);
        const rayOp = Math.sin(phase * Math.PI) * 0.18;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: rayY,
              height: 140,
              background: 'linear-gradient(180deg, transparent, rgba(239,68,68,0.55), transparent)',
              opacity: rayOp,
              mixBlendMode: 'screen',
            }}
          />
        );
      })}

      {/* Data threads — dashed lines from each card edge → logo rim */}
      <svg
        width={CANVAS_W}
        height={CANVAS_H}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {LABELS.map((L, i) => {
          const g = geometry[i];
          const lt = time - L.delay;
          if (lt < 0) return null;
          const lineOp = clamp(lt / 0.4, 0, 1) * 0.95;
          return (
            <line
              key={`line-${i}`}
              x1={g.startX}
              y1={g.startY}
              x2={g.endX}
              y2={g.endY}
              stroke={L.color}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray="10 10"
              opacity={lineOp}
              style={{ filter: `drop-shadow(0 0 8px ${L.color}) drop-shadow(0 0 18px ${L.color})` }}
            />
          );
        })}
      </svg>

      {/* Source cards — scanner-annotation layout inside a dark glass box */}
      {LABELS.map((L, i) => {
        const lt = time - L.delay;
        if (lt < 0) return null;
        const inOp = clamp(lt / 0.5, 0, 1);
        const wave = Math.sin(time * 1.2 + i) * 4;
        const scanP = clamp((lt - 0.3) / 0.8, 0, 1);
        const align = L.side === 'right' ? 'flex-end' : L.side === 'left' ? 'flex-start' : 'center';
        const textAlign: 'left' | 'right' | 'center' =
          L.side === 'right' ? 'right' : L.side === 'left' ? 'left' : 'center';

        return (
          <div
            key={`card-${i}`}
            style={{
              position: 'absolute',
              left: `${L.x * 100}%`,
              top: `${L.y * 100}%`,
              transform: `translate(-50%, calc(-50% + ${wave}px))`,
              opacity: inOp,
              width: 'max-content',
              minWidth: 280,
              padding: '18px 24px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              border: `1px solid rgba(255,255,255,0.55)`,
              boxShadow: `0 0 32px ${L.color}55, 0 12px 36px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(255,255,255,0.18)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: align,
              gap: 8,
              whiteSpace: 'nowrap',
            }}
          >
            {/* Top row: index + scanner progress line */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: L.side === 'right' ? 'row-reverse' : 'row',
                gap: 10,
                width: '100%',
                justifyContent: align,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-geist-sans), ui-monospace, monospace",
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'rgba(15,15,30,0.5)',
                  letterSpacing: '2px',
                }}
              >
                {L.idx}
              </span>
              <div
                style={{
                  flex: 1,
                  maxWidth: 200,
                  height: 2,
                  borderRadius: 1,
                  background: `linear-gradient(90deg, ${L.color} 0%, ${L.color} ${scanP * 100}%, rgba(15,15,30,0.18) ${scanP * 100}%, rgba(15,15,30,0.18) 100%)`,
                  boxShadow: `0 0 8px ${L.color}88`,
                }}
              />
            </div>

            {/* Main label — clean dark-on-glass, color from textColor variant */}
            <div
              style={{
                fontFamily: "var(--font-geist-sans), ui-monospace, monospace",
                fontSize: 28,
                fontWeight: 800,
                color: L.textColor,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                lineHeight: 1.1,
                textAlign,
                textShadow: '0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              {L.text}
            </div>

            {/* Status row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: L.side === 'right' ? 'row-reverse' : 'row',
                gap: 10,
                opacity: scanP,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: L.color,
                  boxShadow: `0 0 10px ${L.color}, 0 0 4px ${L.color}`,
                  animation: 'wmv-pulse 1.2s ease-in-out infinite',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-geist-sans), ui-monospace, monospace",
                  fontSize: 17,
                  fontWeight: 600,
                  color: 'rgba(15,15,30,0.65)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                }}
              >
                scanning · <span style={{ color: L.textColor, fontWeight: 700 }}>{L.count}</span>
              </span>
            </div>
          </div>
        );
      })}

      {/* Traveling data dots — exit card edge → arrive at logo rim, looping */}
      {LABELS.map((L, i) => {
        const g = geometry[i];
        const lt = time - L.delay - 0.4;
        if (lt < 0) return null;
        const cyclePos = (lt % DOT_TRAVEL_S) / DOT_TRAVEL_S;
        const eased = Easing.easeInOutCubic(cyclePos);
        const dotX = lerp(g.startX, g.endX, eased);
        const dotY = lerp(g.startY, g.endY, eased);
        const arrivalFade = cyclePos < 0.85 ? 1 : 1 - (cyclePos - 0.85) / 0.15;
        return (
          <div
            key={`dot-${i}`}
            style={{
              position: 'absolute',
              left: dotX,
              top: dotY,
              transform: 'translate(-50%, -50%)',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: L.color,
              opacity: arrivalFade,
              boxShadow: `0 0 18px ${L.color}, 0 0 40px ${L.color}cc, 0 0 6px #fff`,
              willChange: 'transform, opacity',
            }}
          />
        );
      })}
    </div>
  );
}
