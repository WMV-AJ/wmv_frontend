'use client';

import { Easing, clamp, phaseProgress } from '@/lib/landing/animation-core';
import { DUR } from '@/lib/landing/constants';

type IconName =
  | 'food' | 'music' | 'club' | 'pool'
  | 'day' | 'happy' | 'sports' | 'ladies'
  | 'brunch' | 'comedy' | 'activities' | 'wellness';

interface Category {
  label: string;
  count: number;
  color: string;
  icon: IconName;
}

const CATS: Category[] = [
  { label: 'Food',         count: 18, color: '#f59e0b', icon: 'food' },
  { label: 'Live Music',   count: 10, color: '#22d3ee', icon: 'music' },
  { label: 'Clubs',        count: 8,  color: '#f4c430', icon: 'club' },
  { label: 'Pool Party',   count: 6,  color: '#34d399', icon: 'pool' },
  { label: 'Day Party',    count: 4,  color: '#f97316', icon: 'day' },
  { label: 'Comedy',       count: 5,  color: '#ef4444', icon: 'comedy' },
  { label: 'Happy Hour',   count: 3,  color: '#facc15', icon: 'happy' },
  { label: 'Sports',       count: 2,  color: '#84cc16', icon: 'sports' },
  { label: 'Ladies Night', count: 2,  color: '#f472b6', icon: 'ladies' },
  { label: 'Brunch',       count: 1,  color: '#60a5fa', icon: 'brunch' },
  { label: 'Activities',   count: 4,  color: '#14b8a6', icon: 'activities' },
  { label: 'Wellness',     count: 3,  color: '#d946ef', icon: 'wellness' },
];

function Icon({ name, color }: { name: IconName; color: string }) {
  const s = {
    stroke: color,
    strokeWidth: 2.2,
    fill: 'none' as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'food':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path {...s} d="M5 3v8a2 2 0 0 0 2 2v8M9 3v8a2 2 0 0 1-2 2M19 3c-1.5 0-3 1.5-3 5s1.5 5 3 5v8" />
        </svg>
      );
    case 'music':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path {...s} d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" {...s} />
          <circle cx="18" cy="16" r="3" {...s} />
        </svg>
      );
    case 'club':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path {...s} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      );
    case 'pool':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path {...s} d="M2 12c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
          <path {...s} d="M2 18c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
        </svg>
      );
    case 'day':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" {...s} />
          <path {...s} d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case 'happy':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" {...s} />
          <path {...s} d="M12 7v5l3 2" />
        </svg>
      );
    case 'sports':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path {...s} d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M6 5v6a6 6 0 0 0 12 0V5z M9 21h6M12 17v4" />
        </svg>
      );
    case 'ladies':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path {...s} d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z M18 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
        </svg>
      );
    case 'brunch':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path {...s} d="M3 8h14v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z M17 9h2a3 3 0 0 1 0 6h-2 M5 3v2M9 3v2M13 3v2" />
        </svg>
      );
    case 'comedy':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path {...s} d="M12 4l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
        </svg>
      );
    case 'activities':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" {...s} />
          <path {...s} d="M5 12l3-3 4 1 2 4 4 4M9 22l3-6 4-1 3 3" />
        </svg>
      );
    case 'wellness':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path {...s} d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
        </svg>
      );
    default:
      return null;
  }
}

interface PillProps {
  cat: Category;
  delay: number;
  pillsP: number;
}

// Deliberately styled as a static readout, NOT a button: faint border, no
// glow, no pointer events. These pills are part of the settled hero frame —
// the real (tappable) vibe filters live on the city pages, and a button-like
// treatment here kept inviting dead taps.
function Pill({ cat, delay, pillsP }: PillProps) {
  const pp = clamp((pillsP - delay) / (1 - delay), 0, 1);
  const py = (1 - Easing.easeOutBack(pp)) * 30;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '13px 22px',
        borderRadius: 9999,
        background: 'rgba(10,10,26,0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${cat.color}55`,
        color: cat.color,
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        fontSize: 24,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        lineHeight: 1,
        transform: `translateY(${py}px)`,
        opacity: pp * 0.9,
        boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center' }}>
        <Icon name={cat.icon} color={cat.color} />
      </span>
      <span>
        {cat.label} <span style={{ opacity: 0.9 }}>({cat.count})</span>
      </span>
    </div>
  );
}

function StatCell({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        minWidth: 200,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontSize: 104,
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '-0.035em',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          textShadow: '0 4px 14px rgba(0,0,0,0.85)',
        }}
      >
        {value.toLocaleString()}
      </div>
      <div
        style={{
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          fontSize: 24,
          fontWeight: 700,
          color: accent,
          textTransform: 'uppercase',
          letterSpacing: '3.5px',
          lineHeight: 1,
          textShadow: '0 2px 10px rgba(0,0,0,0.9)',
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function HUDLayer({ time }: { time: number }) {
  const statsP = phaseProgress(time, DUR.BURST_END - 0.1, DUR.SETTLE_END + 0.2);
  const statsOp = Easing.easeOutCubic(statsP);
  const statsTy = (1 - statsOp) * 30;

  const countP = phaseProgress(time, DUR.BURST_END, DUR.SETTLE_END + 0.2);
  const eased = Easing.easeOutCubic(countP);
  const venues = Math.round(eased * 876);
  const stories = Math.round(eased * 1389);
  const posts = Math.round(eased * 408);
  const events = Math.round(eased * 179);

  const pillsP = phaseProgress(time, DUR.SETTLE_END + 0.1, DUR.SETTLE_END + 0.5);

  if (statsP <= 0 && pillsP <= 0) return null;

  const rowA = CATS.slice(0, 4);
  const rowB = CATS.slice(4, 8);
  const rowC = CATS.slice(8, 12);

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 70,
          transform: `translateY(${statsTy}px)`,
          opacity: statsOp,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 36,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#ec4899',
              boxShadow: '0 0 26px #ec4899, 0 0 60px rgba(236,72,153,0.55)',
              animation: 'wmv-pulse 1.2s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              fontSize: 32,
              fontWeight: 800,
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '6px',
              textShadow: '0 2px 14px rgba(0,0,0,0.9), 0 0 32px rgba(236,72,153,0.5)',
            }}
          >
            <span style={{ color: '#ec4899' }}>LIVE</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 16px' }}>·</span>
            TONIGHT
            <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 16px' }}>·</span>
            DUBAI
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 60,
            padding: '0 50px',
          }}
        >
          <StatCell value={venues}  label="venues"  accent="#7dd3fc" />
          <StatCell value={stories} label="stories" accent="#ec4899" />
          <StatCell value={posts}   label="posts"   accent="#facc15" />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginTop: 14 }}>
          <div
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: 200,
              fontWeight: 700,
              letterSpacing: '-0.045em',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              color: '#fff',
              textShadow: '0 6px 20px rgba(0,0,0,0.95)',
            }}
          >
            {events.toLocaleString()}
          </div>
          <div
            style={{
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              fontSize: 40,
              fontWeight: 800,
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '5px',
              lineHeight: 1,
              paddingBottom: 18,
              textShadow: '0 2px 14px rgba(0,0,0,0.9)',
            }}
          >
            events <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>tonight</span>
          </div>
        </div>
      </div>

      {/* Left-edge multi-stop accent rail */}
      <div
        style={{
          position: 'absolute',
          left: 50,
          bottom: 210,
          width: 8,
          height: 420,
          borderRadius: 6,
          background: `linear-gradient(180deg,
            rgba(125,211,252,0)    0%,
            rgba(125,211,252,0.9)  12%,
            rgba(236,72,153,1)     45%,
            rgba(250,204,21,1)     75%,
            rgba(250,204,21,0)     100%)`,
          transform: `scaleY(${Easing.easeOutCubic(pillsP)})`,
          transformOrigin: 'top',
          opacity: Easing.easeOutCubic(pillsP),
          boxShadow: `0 0 24px rgba(125,211,252,0.7),
            0 0 60px rgba(236,72,153,0.55),
            0 0 120px rgba(250,204,21,0.30)`,
          filter: 'saturate(1.15)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 1,
            top: 0,
            bottom: 0,
            width: 2,
            borderRadius: 2,
            background:
              'linear-gradient(180deg, transparent, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.55) 60%, transparent)',
            filter: 'blur(1px)',
            opacity: 0.8,
          }}
        />
      </div>

      {/* "Pick your vibe" headline — sits low so the centered login row
          above it keeps clear breathing room */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 570,
          transform: `translate(-50%, ${(1 - pillsP) * 30}px)`,
          opacity: Easing.easeOutCubic(pillsP),
          textAlign: 'center',
          width: '90%',
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: '#7dd3fc',
            textTransform: 'uppercase',
            letterSpacing: '4px',
            marginBottom: 8,
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          real-time · instagram · live
        </div>
        <div
          style={{
            // Playfair Display italic — the editorial flourish moment, paired
            // against Fraunces for the structured tabular counters below.
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: 96,
            fontWeight: 700,
            fontStyle: 'italic',
            color: '#fff',
            letterSpacing: '-0.025em',
            lineHeight: 0.95,
            textShadow: '0 4px 30px rgba(0,0,0,0.85)',
          }}
        >
          pick your vibe
        </div>
      </div>

      {/* Filter pills — three rows of 4 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '0 20px',
          opacity: Easing.easeOutCubic(pillsP),
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'center', gap: 10 }}>
          {rowA.map((c, i) => <Pill key={c.label} cat={c} delay={i * 0.05} pillsP={pillsP} />)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'center', gap: 10 }}>
          {rowB.map((c, i) => <Pill key={c.label} cat={c} delay={0.20 + i * 0.05} pillsP={pillsP} />)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'center', gap: 10 }}>
          {rowC.map((c, i) => <Pill key={c.label} cat={c} delay={0.40 + i * 0.05} pillsP={pillsP} />)}
        </div>
      </div>
    </>
  );
}
