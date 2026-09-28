'use client';

// Live hero for the city home: "Tonight in {City}" with the city's date,
// the live-radar graphic and the two entry CTAs — in the map/list type
// system (Inter Tight display caps, H4_LABEL captions, pill buttons).

import { List, Map as MapIcon } from 'lucide-react';
import { T } from '@/lib/theme/tokens';
import { H4_LABEL, getCardAccent } from '@/components/shared/card-style';
import { BTN_PRIMARY, BTN_SECONDARY, BTN_SECONDARY_STYLE } from './HomeParts';

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

const SOURCES: Array<[string, string]> = [
  ['IG stories', '#ec4899'],
  ['IG posts', '#eab308'],
  ['Ticketing', '#10b981'],
  ['Venue sites', '#f97316'],
];

export default function HomeHero({ cityName, dateLabel, tonightCount, liveCount, loading, topCategories, onMap, onList }: {
  cityName: string;
  /** e.g. "Saturday 26 Sept" — in the city's calendar. */
  dateLabel: string;
  tonightCount: number;
  liveCount: number;
  loading: boolean;
  topCategories: string[];
  onMap: () => void;
  onList: () => void;
}) {
  const dotColours = topCategories.length > 0
    ? topCategories.map((c) => getCardAccent(c).text)
    : ['#f4c430', '#22d3ee', '#f97316', '#84cc16'];

  return (
    <section className="relative px-[18px] pt-5 overflow-hidden" aria-labelledby="home-hero-title">
      {/* Radar */}
      <div aria-hidden className="absolute top-1.5 -right-[70px] w-[300px] h-[300px] pointer-events-none opacity-90">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="absolute rounded-full" style={{ inset: `${i * 24}px`, border: `1px solid rgba(255,255,255,${0.14 - i * 0.022})` }} />
        ))}
        <div className="absolute top-1/2 left-1/2 w-3 h-3 -mt-1.5 -ml-1.5 rounded-full"
          style={{ background: T.accent, boxShadow: `0 0 16px ${T.accent}80`, animation: 'wmv-pulse 2s infinite' }} />
        {RADAR_DOTS.map((d, i) => {
          const c = dotColours[i % dotColours.length];
          return (
            <div key={i} className="absolute w-[7px] h-[7px] rounded-full"
              style={{ top: d.t, left: d.l, background: c, boxShadow: `0 0 10px ${c}`, animation: `wmv-pulse 2s infinite ${i * 0.25}s` }} />
          );
        })}
        <div className="absolute inset-0 rounded-full"
          style={{ background: `conic-gradient(from 0deg, transparent 82%, ${T.accent}33 95%, ${T.accent}66 100%)`, animation: 'wmv-spin 4s linear infinite' }} />
        <div className="absolute top-1/2 inset-x-0 h-px" style={{ background: T.crosshair }} />
        <div className="absolute left-1/2 inset-y-0 w-px" style={{ background: T.crosshair }} />
      </div>
      <div aria-hidden className="absolute -left-[60px] -top-5 w-[320px] h-[300px] pointer-events-none"
        style={{ background: `radial-gradient(ellipse 60% 50% at 35% 40%, ${T.accent}14, transparent 70%)` }} />

      <div className="relative z-[1]">
        <div className={`${H4_LABEL} inline-flex items-center gap-1.5`} style={{ color: T.live }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: T.live, animation: 'wmv-pulse 1.5s infinite' }} />
          Live · {dateLabel}
        </div>

        <h1 id="home-hero-title" className="font-tight font-semibold uppercase text-[46px] leading-[0.92] tracking-[-0.045em] text-pale mt-3.5">
          Tonight in<br />
          <span style={{ color: T.accent, textShadow: `0 0 40px ${T.accent}40` }}>{cityName}</span>
        </h1>

        <p className="font-tight font-semibold uppercase text-[18px] leading-tight tracking-[-0.03em] text-silver mt-3">
          Less scroll. More tonight.
        </p>

        <p className={`${H4_LABEL} text-silver-dim mt-3 max-w-[240px] leading-relaxed`}>
          {loading
            ? 'Scanning every venue’s stories…'
            : `${tonightCount} events tonight · ${liveCount} live now`}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-3 max-w-[260px]">
          {SOURCES.map(([label, color]) => (
            <span key={label} className={`${H4_LABEL} inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-silver`}
              style={{ border: `1px solid ${color}66`, background: `${color}12`, fontSize: 9 }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              {label}
            </span>
          ))}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onMap} className={BTN_PRIMARY}>
            <MapIcon className="w-4 h-4" />
            Explore on map
          </button>
          <button onClick={onList} className={BTN_SECONDARY} style={BTN_SECONDARY_STYLE}>
            <List className="w-4 h-4" />
            Today&rsquo;s vibe
          </button>
        </div>
      </div>
    </section>
  );
}
