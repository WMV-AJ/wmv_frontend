'use client';

// The top of the city home, in two columns. Left: the live line, the one-liner
// and a strip of the sources being scanned. Right: the two ways in, the map
// with its venue count and the list with its event count.

import { ArrowUpRight, ChevronDown, CircleDashed, Image as ImageIcon, List as ListIcon, Map as MapIcon } from 'lucide-react';
import { T } from '@/lib/theme/tokens';
import { H4_LABEL } from '@/components/shared/card-style';
import { HF } from './home-fonts';
import { KickerDot } from './HomeParts';
import styles from './home.module.css';

type ScanItem = { kind: 'logo'; file: string } | { kind: 'story' } | { kind: 'post' };
const logo = (file: string): ScanItem => ({ kind: 'logo', file });

/** What scrolls through the scanner: Instagram stories and posts, and the ticketing platforms. */
const SCAN_ITEMS: readonly ScanItem[] = [
  logo('instagram'), { kind: 'story' }, logo('bookmyshow'), logo('platinumlist'), { kind: 'post' }, logo('district'),
  logo('allevents'), logo('highape'), logo('instagram'), logo('fever'), { kind: 'story' }, logo('sortmyscene'),
  logo('ra'), logo('dubainight'), { kind: 'post' }, logo('bandsintown'), logo('songkick'), logo('cocacolaarena'),
];

function ScanTile({ item }: { item: ScanItem }) {
  if (item.kind === 'logo') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/home/sources/${item.file}.png`} alt="" className={styles.scanTile} width={46} height={46} loading="eager" decoding="async" />;
  }
  const Icon = item.kind === 'story' ? CircleDashed : ImageIcon;
  return <span className={`${styles.scanTile} ${styles.scanGlyph}`}><Icon className="w-6 h-6" strokeWidth={1.8} /></span>;
}

/** The same strip twice over, so the scroll loops without a seam. */
function ScanTrack() {
  return (
    <div className={styles.scanTrack}>
      {[0, 1].map((copy) => SCAN_ITEMS.map((item, i) => <ScanTile key={`${copy}-${i}`} item={item} />))}
    </div>
  );
}

const formatCount = (value: number, loading: boolean): string => (loading ? '—' : value.toLocaleString('en-GB'));

export interface DayCount {
  label: string;
  count: number;
  onClick: () => void;
}

export default function HomeMapOrList({ cityName, dateLabel, venueCount, eventCount, loading, onMap, onList, dayCounts, onScrollCue }: {
  /** Today, tomorrow and this weekend, each opening the list for that day. */
  dayCounts: DayCount[];
  /** Scrolls down to the category section. */
  onScrollCue: () => void;
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
  const button = 'flex flex-col justify-between text-left p-4 min-h-[150px] h-full transition-transform active:scale-[0.98]';
  const number = 'block font-tight font-semibold text-[32px] leading-none tabular-nums';
  return (
    // Fills the phone screen under the masthead; the bottom padding clears the floating nav.
    <section
      className="px-[18px] pt-5 pb-[88px] grid gap-x-3.5 gap-y-4 items-stretch box-border"
      style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 0.82fr)', gridTemplateRows: 'minmax(0, 1fr) auto', minHeight: 'calc(100dvh - 62px)' }}
      aria-labelledby="home-top-title"
    >
      <div className="flex flex-col min-w-0">
        <div className={`${H4_LABEL} inline-flex items-center gap-1.5`} style={{ color: T.live }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ background: T.live, animation: 'wmv-pulse 1.5s infinite' }} />
          {cityName} · Updated daily
        </div>
        <div className={`${H4_LABEL} text-silver-dim mt-1`}>{dateLabel}</div>

        <h1 id="home-top-title" className={`${HF.hero} text-pale mt-3`}>Every event.<br />One map.</h1>

        {!loading && (
          <div className="mt-5 flex flex-col" style={{ borderTop: '1px solid var(--wmv-line)' }}>
            {dayCounts.filter((d) => d.count > 0).map((d) => (
              <button key={d.label} type="button" onClick={d.onClick} data-cta="home-day-count"
                className="flex items-baseline gap-2.5 py-2.5 text-left transition-opacity active:opacity-70"
                style={{ borderBottom: '1px solid var(--wmv-line)' }}>
                <span className={`${HF.tileName} text-pale tabular-nums min-w-[42px]`}>{d.count.toLocaleString('en-GB')}</span>
                <span className={`${H4_LABEL} text-silver flex-1 min-w-0 truncate`}>{d.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-silver-dim flex-shrink-0 self-center" />
              </button>
            ))}
          </div>
        )}

        {/* Dim strip underneath; the bright copy shows only through the scanner window. */}
        <div className="mt-auto pt-4" role="img" aria-label="Scanning Instagram stories, Instagram posts and ticketing platforms">
          <div className={styles.scan}>
            <div className={styles.scanDim}><ScanTrack /></div>
            <div className={styles.scanWindow}><ScanTrack /><span className={styles.scanBeam} /></div>
          </div>
          <div className={`${H4_LABEL} text-silver-dim mt-2 text-center`}>Scanning sources</div>
        </div>
      </div>

      <div className="grid gap-3 min-w-0" style={{ gridTemplateRows: '1fr 1fr' }}>
        <button type="button" onClick={onMap} data-cta="maplist-map" className={`${button} wmv-invert`}>
          <span className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <MapIcon className="w-6 h-6" strokeWidth={1.8} />
              <span className={`${H4_LABEL} wmv-invert-muted`}>Map</span>
            </span>
            <span className="wmv-arrow-ring"><ArrowUpRight className="w-4 h-4 relative" /></span>
          </span>
          <span>
            <span className={number}>{formatCount(venueCount, loading)}</span>
            <span className="block text-[13px] font-semibold mt-1">venues near you</span>
          </span>
        </button>

        <button type="button" onClick={onList} data-cta="maplist-list" className={`${button} text-pale`} style={{ border: '1px solid var(--wmv-line-strong)' }}>
          <span className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <ListIcon className="w-6 h-6" strokeWidth={1.8} />
              <span className={`${H4_LABEL} text-silver`}>List</span>
            </span>
            <span className="wmv-arrow-ring"><ArrowUpRight className="w-4 h-4 relative" /></span>
          </span>
          <span>
            <span className={number}>{formatCount(eventCount, loading)}</span>
            <span className="block text-[13px] font-semibold mt-1">events by date</span>
          </span>
        </button>
      </div>

      <button type="button" onClick={onScrollCue} data-cta="home-scroll-cue"
        className={`${H4_LABEL} col-span-2 inline-flex items-center justify-center gap-2 py-2 text-silver transition-opacity active:opacity-70`}>
        <KickerDot />
        Pick a category
        <ChevronDown className="w-4 h-4" style={{ animation: 'wmv-pulse 1.5s infinite' }} />
      </button>
    </section>
  );
}
