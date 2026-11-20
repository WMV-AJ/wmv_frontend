'use client';

// The two ways in, at the top of the city home: the map (primary) with pulsing
// pins and its venue count, the list with rows that stack in and its event count.

import { ArrowUpRight } from 'lucide-react';
import { H4_LABEL, getCardAccent } from '@/components/shared/card-style';
import { useRevealOnce } from './useRevealOnce';
import styles from './home.module.css';

const PINS = [
  { x: 28, y: 34 },
  { x: 62, y: 22 },
  { x: 74, y: 60 },
  { x: 40, y: 68 },
];

export default function HomeMapOrList({ pinCategories, venueCount, eventCount, loading, scrollRoot, onMap, onList }: {
  /** Today's categories — the pins take their colours. */
  pinCategories: string[];
  /** Venues with something coming up — shown in the map button. */
  venueCount: number;
  /** Upcoming events — shown in the list button. */
  eventCount: number;
  loading: boolean;
  scrollRoot: React.RefObject<HTMLElement | null>;
  onMap: () => void;
  onList: () => void;
}) {
  const ref = useRevealOnce<HTMLDivElement>(scrollRoot, 0.25);
  const colours = pinCategories.length ? pinCategories.map((c) => getCardAccent(c).text) : ['#f4c430'];

  return (
    <section className="px-[18px] pt-5" aria-label="Map or list">
      <div ref={ref} className={`${styles.mapListCards} grid gap-3`}>
        <button type="button" onClick={onMap} data-cta="maplist-map"
          className="relative flex items-stretch text-left wmv-invert min-h-[150px] overflow-hidden">
          <div className="flex-1 p-4 flex flex-col justify-between">
            <span className={`${H4_LABEL} wmv-invert-muted`}>Map</span>
            <span>
              <span className="block font-tight font-semibold text-[34px] leading-none tabular-nums">{loading ? '—' : venueCount.toLocaleString('en-GB')} <span className="text-[17px]">venues</span></span>
              <span className="block text-[14px] leading-snug wmv-invert-muted mt-2">See what&rsquo;s near you right now</span>
            </span>
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className={styles.mlMap} aria-hidden="true">
            {PINS.map((p, i) => (
              <span key={i} className={styles.mlPin}
                style={{ left: `${p.x}%`, top: `${p.y}%`, background: colours[i % colours.length], animationDelay: `${i * 0.4}s` }} />
            ))}
          </div>
        </button>

        <button type="button" onClick={onList} data-cta="maplist-list"
          className="relative flex items-stretch text-left text-pale min-h-[150px] overflow-hidden"
          style={{ border: '1px solid var(--wmv-line-strong)' }}>
          <div className="flex-1 p-4 flex flex-col justify-between">
            <span className={`${H4_LABEL} text-silver`}>List</span>
            <span>
              <span className="block font-tight font-semibold text-[34px] leading-none tabular-nums">{loading ? '—' : eventCount.toLocaleString('en-GB')} <span className="text-[17px]">events</span></span>
              <span className="block text-[14px] leading-snug text-silver mt-2">Scroll every event by date and vibe</span>
            </span>
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className={styles.mlList} aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className={styles.mlRow} style={{ '--i': i, borderLeftColor: colours[(i + 1) % colours.length] } as React.CSSProperties}>
                <span /><span />
              </span>
            ))}
          </div>
        </button>
      </div>
    </section>
  );
}
