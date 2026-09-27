'use client';

// Live hero for the city home: where and when you are, in one glance —
// "Tonight in {City}", the city's date and the live counts, over a small
// radar. The tagline and the map/list actions live in the plan block right
// below; the source chips moved to How it works.

import { T } from '@/lib/theme/tokens';
import { H4_LABEL, getCardAccent } from '@/components/shared/card-style';
import styles from './home.module.css';

// Radar dot positions; colours come from the city's live top categories.
const RADAR_DOTS = [
  { t: '22%', l: '32%' },
  { t: '58%', l: '68%' },
  { t: '38%', l: '78%' },
  { t: '72%', l: '38%' },
  { t: '50%', l: '22%' },
  { t: '28%', l: '58%' },
  { t: '68%', l: '82%' },
];

/** Where the listings come from — shown in How it works, step 01. */
export const SOURCES: Array<[string, string]> = [
  ['IG stories', '#ec4899'],
  ['IG posts', '#eab308'],
  ['Ticketing', '#10b981'],
  ['Venue sites', '#f97316'],
];

export default function HomeHero({ cityName, dateLabel, tonightCount, liveCount, loading, topCategories }: {
  cityName: string;
  /** e.g. "Saturday 26 Sept" — in the city's calendar. */
  dateLabel: string;
  tonightCount: number;
  liveCount: number;
  loading: boolean;
  topCategories: string[];
}) {
  const dotColours = topCategories.length > 0
    ? topCategories.map((c) => getCardAccent(c).text)
    : ['#f4c430', '#22d3ee', '#f97316', '#84cc16'];

  return (
    <section className="relative px-[18px] pt-5 overflow-hidden" aria-labelledby="home-hero-title">
      {/* Radar — decoration, kept small */}
      <div aria-hidden className="absolute top-2 -right-[50px] w-[220px] h-[220px] pointer-events-none opacity-70">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="absolute rounded-full" style={{ inset: `${i * 22}px`, border: `1px solid rgba(255,255,255,${0.14 - i * 0.025})` }} />
        ))}
        <div className={`absolute top-1/2 left-1/2 w-2.5 h-2.5 -mt-[5px] -ml-[5px] rounded-full ${styles.radarPulse}`}
          style={{ background: T.accent, boxShadow: `0 0 14px ${T.accent}80` }} />
        {RADAR_DOTS.map((d, i) => {
          const c = dotColours[i % dotColours.length];
          return (
            <div key={i} className={`absolute w-1.5 h-1.5 rounded-full ${styles.radarPulse}`}
              style={{ top: d.t, left: d.l, background: c, boxShadow: `0 0 8px ${c}`, animationDelay: `${i * 0.25}s` }} />
          );
        })}
        <div className={`absolute inset-0 rounded-full ${styles.radarSweep}`}
          style={{ background: `conic-gradient(from 0deg, transparent 82%, ${T.accent}33 95%, ${T.accent}66 100%)` }} />
      </div>
      <div aria-hidden className="absolute -left-[60px] -top-5 w-[300px] h-[240px] pointer-events-none"
        style={{ background: `radial-gradient(ellipse 60% 50% at 35% 40%, ${T.accent}14, transparent 70%)` }} />

      <div className="relative z-[1]">
        <div className={`${H4_LABEL} inline-flex items-center gap-1.5`} style={{ color: T.live }}>
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${styles.radarPulse}`} style={{ background: T.live }} />
          Live · {dateLabel}
        </div>

        <h1 id="home-hero-title" className="font-tight font-semibold uppercase text-[46px] leading-[0.92] tracking-[-0.045em] text-pale mt-3">
          Tonight in<br />
          <span style={{ color: T.accent, textShadow: `0 0 40px ${T.accent}40` }}>{cityName}</span>
        </h1>

        <p className={`${H4_LABEL} text-silver mt-3`}>
          {loading
            ? 'Scanning every venue’s stories…'
            : <><span className="text-pale tabular-nums">{tonightCount}</span> events tonight · <span className="text-pale tabular-nums">{liveCount}</span> live now</>}
        </p>
      </div>
    </section>
  );
}
