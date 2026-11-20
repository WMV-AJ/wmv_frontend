'use client';

// The top of the city home, in two columns. Left: the live line, the one-liner
// and the five sources circling. Right: the two ways in, the map with its venue
// count and the list with its event count.

import { ArrowUpRight, Bike, CircleDashed, Image as ImageIcon, Ticket, Users, type LucideIcon } from 'lucide-react';
import { T } from '@/lib/theme/tokens';
import { COLOR_HEX_MAP } from '@/lib/category-mappings';
import { H4_LABEL } from '@/components/shared/card-style';
import { HF } from './home-fonts';
import styles from './home.module.css';

/** What we read, in the colours the login intro gives them. */
const SOURCES: ReadonlyArray<{ Icon: LucideIcon; label: string; color: string }> = [
  { Icon: CircleDashed, label: 'Instagram stories', color: COLOR_HEX_MAP.purple },
  { Icon: ImageIcon, label: 'Instagram posts', color: COLOR_HEX_MAP.orange },
  { Icon: Ticket, label: 'Ticketing platforms', color: COLOR_HEX_MAP.green },
  { Icon: Users, label: 'Community events', color: COLOR_HEX_MAP.red },
  { Icon: Bike, label: 'Activities', color: COLOR_HEX_MAP.pink },
];

const formatCount = (value: number, loading: boolean): string => (loading ? '—' : value.toLocaleString('en-GB'));

export default function HomeMapOrList({ cityName, dateLabel, venueCount, eventCount, loading, onMap, onList }: {
  cityName: string;
  /** e.g. "Friday 20 Nov" — in the city's calendar. */
  dateLabel: string;
  /** Venues with something coming up — shown in the map button. */
  venueCount: number;
  /** Upcoming events — shown in the list button. */
  eventCount: number;
  loading: boolean;
  onMap: () => void;
  onList: () => void;
}) {
  const button = 'flex flex-col justify-between text-left p-3.5 min-h-[114px] transition-transform active:scale-[0.98]';
  const number = 'block font-tight font-semibold text-[32px] leading-none tabular-nums';
  return (
    <section className="px-[18px] pt-5 grid gap-3.5 items-stretch" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 0.82fr)' }} aria-labelledby="home-top-title">
      <div className="flex flex-col min-w-0">
        <div className={`${H4_LABEL} inline-flex items-center gap-1.5`} style={{ color: T.live }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ background: T.live, animation: 'wmv-pulse 1.5s infinite' }} />
          {cityName} · Updated daily
        </div>
        <div className={`${H4_LABEL} text-silver-dim mt-1`}>{dateLabel}</div>

        <h1 id="home-top-title" className={`${HF.hero} text-pale mt-3`}>Every event.<br />One map.</h1>
        <p className="text-[13px] leading-snug text-silver mt-2">
          No more &ldquo;so what&rsquo;s the plan?&rdquo; texts.
        </p>

        <div className={`${styles.srcOrbitWrap} mt-auto pt-3`} role="img" aria-label={`We read ${SOURCES.map((s) => s.label).join(', ')}`}>
          <div className={styles.srcOrbit}>
            {SOURCES.map(({ Icon, label, color }, i) => (
              <span key={label} className={styles.srcOrbitItem} style={{ '--a': `${(i / SOURCES.length) * 360}deg` } as React.CSSProperties}>
                <span className={styles.srcOrbitIcon} style={{ color, borderColor: color }}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                </span>
              </span>
            ))}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wmv-logo.gif" alt="" className={styles.srcOrbitCore} width={30} height={30} />
        </div>
      </div>

      <div className="grid gap-3 min-w-0">
        <button type="button" onClick={onMap} data-cta="maplist-map" className={`${button} wmv-invert`}>
          <span className="flex items-center justify-between">
            <span className={`${H4_LABEL} wmv-invert-muted`}>Map</span>
            <ArrowUpRight className="w-4 h-4" />
          </span>
          <span>
            <span className={number}>{formatCount(venueCount, loading)}</span>
            <span className="block text-[13px] font-semibold mt-1">venues near you</span>
          </span>
        </button>

        <button type="button" onClick={onList} data-cta="maplist-list" className={`${button} text-pale`} style={{ border: '1px solid var(--wmv-line-strong)' }}>
          <span className="flex items-center justify-between">
            <span className={`${H4_LABEL} text-silver`}>List</span>
            <ArrowUpRight className="w-4 h-4" />
          </span>
          <span>
            <span className={number}>{formatCount(eventCount, loading)}</span>
            <span className="block text-[13px] font-semibold mt-1">events by date</span>
          </span>
        </button>
      </div>
    </section>
  );
}
