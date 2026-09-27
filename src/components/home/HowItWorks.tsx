'use client';

// "From their stories. To your plans." — Find / Sort / Go, now as three
// ruled rows beside a compact path that draws itself on reveal (the Home 4
// scene, condensed), plus the live stats strip (venues, events, areas, last
// refresh) derived from the rows already loaded.

import { H4_LABEL, TILE_RULE, type CardAccent } from '@/components/shared/card-style';
import { SectionKicker } from './VibeFan';
import { SOURCES } from './HomeHero';
import { useRevealOnce } from './useRevealOnce';
import styles from './home.module.css';

export interface HowStats {
  venues: number;
  events: number;
  areas: number;
  /** e.g. "26 Sep" — latest scrape in the city's timezone; null if unknown. */
  refreshed: string | null;
}

const STEPS: Array<{ n: string; title: string; copy: string }> = [
  { n: '01', title: 'We find it.', copy: 'Public venue stories, posts, feeds and sites are scanned every day.' },
  { n: '02', title: 'We sort it.', copy: 'Events become clear choices by vibe, from brunch to live music.' },
  { n: '03', title: 'You go.', copy: 'Open the map or list. Find tonight’s plan and get out the door.' },
];

export default function HowItWorks({ cityName, stats, loading, accent, kicker, scrollRoot }: {
  cityName: string;
  stats: HowStats;
  loading: boolean;
  accent: CardAccent;
  kicker: { index: number; total: number };
  scrollRoot: React.RefObject<HTMLElement | null>;
}) {
  const stepsRef = useRevealOnce<HTMLDivElement>(scrollRoot, 0.2);
  const statCells: Array<[string, string]> = [
    ['Venues', loading ? '—' : String(stats.venues)],
    ['Events', loading ? '—' : String(stats.events)],
    ['Areas', loading ? '—' : String(stats.areas)],
    ['Updated', loading ? '—' : stats.refreshed ?? '—'],
  ];

  return (
    <section className="px-[18px] pt-10" aria-labelledby="home-how-title" style={{ '--accent-text': accent.text } as React.CSSProperties}>
      <SectionKicker index={kicker.index} total={kicker.total} title="How it works" />
      <h2 id="home-how-title" className="font-tight font-semibold uppercase text-[34px] leading-[0.92] tracking-[-0.045em] text-pale mt-4">
        From their stories.<br /><span className="text-silver">To your plans.</span>
      </h2>
      <p className="text-[13px] leading-relaxed text-silver mt-3">
        Three moves between seeing what&rsquo;s out there in {cityName} and actually going.
      </p>

      {/* Live stats — ruled cells, like the expanded card's detail grid */}
      <div className="grid grid-cols-4 mt-5" style={{ borderTop: `1px solid ${TILE_RULE}`, borderBottom: `1px solid ${TILE_RULE}` }}>
        {statCells.map(([label, value], i) => (
          <div key={label} className="py-3 min-w-0" style={{ paddingLeft: i ? 10 : 0, borderLeft: i ? `1px solid ${TILE_RULE}` : undefined }}>
            <div className={`${H4_LABEL} text-silver-dim truncate`}>{label}</div>
            <div className="font-inter font-[550] text-[16px] text-pale tabular-nums mt-1 truncate">{value}</div>
          </div>
        ))}
      </div>

      {/* Steps beside a path that draws down on reveal */}
      <div ref={stepsRef} className="relative mt-5 pl-9">
        <svg className="absolute left-0 top-2 bottom-2 w-6 h-[calc(100%-16px)] overflow-visible" viewBox="0 0 24 300" preserveAspectRatio="none" aria-hidden="true">
          <path className={styles.pathBase} d="M12 4 C2 60 22 90 12 150 S2 240 12 296" />
          <path className={styles.pathActive} d="M12 4 C2 60 22 90 12 150 S2 240 12 296" pathLength={1} />
        </svg>
        {STEPS.map((s, i) => (
          <div key={s.n} className={`${styles.revealItem} relative py-3.5`} style={{ '--i': i, borderTop: i ? `1px solid ${TILE_RULE}` : undefined } as React.CSSProperties}>
            <span aria-hidden className="absolute -left-[29px] top-[18px] w-3 h-3 rounded-full"
              style={{ background: '#0a0a14', border: `2px solid ${accent.text}`, boxShadow: `0 0 10px ${accent.glow}` }} />
            <span className={H4_LABEL} style={{ color: accent.text }}>{s.n}</span>
            <h3 className="font-tight font-semibold uppercase text-[22px] leading-[0.95] tracking-[-0.04em] text-pale mt-1.5">{s.title}</h3>
            <p className="text-[13px] leading-relaxed text-silver mt-1.5">{s.copy}</p>
            {i === 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {SOURCES.map(([label, color]) => (
                  <span key={label} className={`${H4_LABEL} inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-silver`}
                    style={{ border: `1px solid ${color}66`, background: `${color}12`, fontSize: 9 }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={`${H4_LABEL} flex items-center gap-2.5 text-silver-dim pt-4 mt-1`} style={{ borderTop: `1px solid ${TILE_RULE}` }}>
        <span>From scattered signals</span>
        <span aria-hidden className="flex-1 h-px" style={{ background: TILE_RULE }} />
        <span>To one place to start</span>
      </div>
    </section>
  );
}
