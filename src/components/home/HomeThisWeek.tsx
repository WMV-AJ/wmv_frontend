'use client';

// "On this week in {City}" (content plan §3.3): the count of things on over
// the next 7 city days — counting up when it scrolls in — and a rail of six
// picks spread across the days, ending on a "See the whole map" tile.

import { useEffect, useState } from 'react';
import { ArrowUpRight, Map as MapIcon } from 'lucide-react';
import { H4_LABEL, TILE_RULE } from '@/components/shared/card-style';
import { EventTile, HScrollRail } from './HomeParts';
import { HF } from './home-fonts';
import { useInViewOnce, prefersReducedMotion } from './useRevealOnce';

export interface WeekPick {
  /** City date, YYYY-MM-DD. */
  ds: string;
  /** e.g. "Today", "Tue 30". */
  dayLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any;
}

function useCountUp(target: number, run: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (prefersReducedMotion()) { setValue(target); return; }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 1200);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return value;
}

export default function HomeThisWeek({ cityName, count, picks, loading, scrollRoot, onOpen, onMap }: {
  cityName: string;
  count: number;
  picks: WeekPick[];
  loading: boolean;
  scrollRoot: React.RefObject<HTMLElement | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOpen: (event: any) => void;
  onMap: () => void;
}) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>(scrollRoot, 0.4);
  const shown = useCountUp(count, inView && !loading);
  if (!loading && picks.length === 0) return null;

  return (
    <section className="px-[18px] pt-16 mt-14" aria-labelledby="home-week-title" style={{ borderTop: `1px solid ${TILE_RULE}` }}>
      <div className={`${H4_LABEL} flex items-center gap-2.5 text-silver-dim`}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ef4444', animation: 'wmv-pulse 1.5s infinite' }} />
        <span>Live from the API</span>
        <span aria-hidden className="flex-1 h-px" style={{ background: TILE_RULE }} />
      </div>
      <h2 id="home-week-title" className={`${HF.week} text-pale mt-5`}>On this week in {cityName}</h2>

      <div ref={ref} className="flex items-baseline gap-3 mt-4">
        <span className={`${HF.weekNum} text-pale tabular-nums`}>{loading ? '—' : shown}</span>
        <span className="text-[15px] text-silver">things on &mdash; pulled today.</span>
      </div>

      <div className="mt-7">
        <HScrollRail>
          {picks.map(({ ds, dayLabel, event }) => (
            <div key={`${ds}-${event.event_id ?? event.venue_id}`} className="flex-shrink-0" style={{ width: 172 }}>
              <div className={`${H4_LABEL} text-silver mb-2`}>{dayLabel}</div>
              <EventTile event={event} width="100%" sizes="180px" onOpen={() => onOpen(event)} />
            </div>
          ))}
          {!loading && (
            <button
              type="button"
              onClick={onMap}
              className="flex-shrink-0 flex flex-col justify-between p-4 text-left bg-white text-[#0b0b0b]"
              style={{ width: 172, marginTop: 26, aspectRatio: '3/4' }}
            >
              <MapIcon className="w-6 h-6" />
              <span>
                <span className={`${HF.weekTile} block`}>See the whole map</span>
                <ArrowUpRight className="w-5 h-5 mt-3" />
              </span>
            </button>
          )}
        </HScrollRail>
      </div>
    </section>
  );
}
