'use client';

// "From their stories. To your plans." — Home 4's Find / Sort / Go path,
// ported without Three.js and recoloured dark, with a live stats strip
// (venues, events, areas and the last refresh) from the data already loaded.

import { H4_LABEL, TILE_RULE, type CardAccent } from '@/components/shared/card-style';
import { SectionKicker } from './VibeFan';
import { HF } from './home-fonts';
import { useRevealOnce } from './useRevealOnce';
import styles from './home.module.css';

export interface HowStats {
  venues: number;
  events: number;
  areas: number;
  /** e.g. "26 Sep" — latest scrape in the city's timezone; null if unknown. */
  refreshed: string | null;
}

const MOBILE_PATH = 'M60 80 C270 130 290 240 180 360 S120 570 280 700 S240 860 310 900';

export default function HowItWorks({ cityName, stats, loading, accent, kicker, scrollRoot }: {
  cityName: string;
  stats: HowStats;
  loading: boolean;
  accent: CardAccent;
  kicker: { index: number; total: number };
  scrollRoot: React.RefObject<HTMLElement | null>;
}) {
  const sceneRef = useRevealOnce<HTMLDivElement>(scrollRoot, 0.15);
  const cssVars = {
    '--accent-text': accent.text,
    '--accent-border': accent.border,
    '--accent-glow': accent.glow,
  } as React.CSSProperties;

  const statCells: Array<[string, string]> = [
    ['Venues', loading ? '—' : String(stats.venues)],
    ['Events', loading ? '—' : String(stats.events)],
    ['Areas', loading ? '—' : String(stats.areas)],
    ['Updated', loading ? '—' : stats.refreshed ?? '—'],
  ];

  return (
    <section className="px-[18px] pt-12" aria-labelledby="home-how-title" style={cssVars}>
      <SectionKicker index={kicker.index} total={kicker.total} title="How it works" />
      <h2 id="home-how-title" className={`${HF.how} text-pale mt-4`}>
        From their stories.<br /><em className="italic text-silver">To your plans.</em>
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

      <div ref={sceneRef} className={styles.howScene}>
        <svg className={styles.howPath} viewBox="0 0 400 950" preserveAspectRatio="none" aria-hidden="true">
          <path className={styles.pathBase} d={MOBILE_PATH} />
          <path className={styles.pathActive} d={MOBILE_PATH} pathLength={1} />
        </svg>

        <div className={`${styles.howStop} ${styles.howFind}`}>
          <div className={styles.howSources} aria-hidden="true">
            <span className={`${H4_LABEL} text-silver`}>Venue posts</span>
            <span className={`${H4_LABEL} text-silver`}>Stories</span>
            <span className={`${H4_LABEL} text-silver`}>Ticketing feeds</span>
          </div>
          <StepCopy step="01 / Read" title="We read." accent={accent}>
            Every venue&rsquo;s Instagram stories, posts and ticket pages, every day.
          </StepCopy>
        </div>

        <div className={`${styles.howStop} ${styles.howSort}`}>
          <div className={styles.prism} aria-hidden="true"><span /><span /><span /></div>
          <StepCopy step="02 / Sort" title="We sort." accent={accent}>
            Each event gets a vibe: happy hour, club night, live music, comedy, food deals&hellip;
          </StepCopy>
        </div>

        <div className={`${styles.howStop} ${styles.howGo}`}>
          <div className={styles.howMarker} aria-hidden="true"><span /></div>
          <StepCopy step="03 / Go" title="You go." accent={accent}>
            One map, one list, just what&rsquo;s on. Pick, tap, out the door.
          </StepCopy>
        </div>
      </div>

      <div className={`${H4_LABEL} flex items-center gap-2.5 text-silver-dim pt-4`} style={{ borderTop: `1px solid ${TILE_RULE}` }}>
        <span>From scattered signals</span>
        <span aria-hidden className="flex-1 h-px" style={{ background: TILE_RULE }} />
        <span>To one place to start</span>
      </div>
    </section>
  );
}

function StepCopy({ step, title, accent, children }: { step: string; title: string; accent: CardAccent; children: React.ReactNode }) {
  return (
    <div className={styles.howStepCopy}>
      <span className={H4_LABEL} style={{ color: accent.text }}>{step}</span>
      <h3 className={`${HF.step} italic text-pale mt-2`}>{title}</h3>
      <p className="text-[13px] leading-relaxed text-silver mt-2">{children}</p>
    </div>
  );
}
