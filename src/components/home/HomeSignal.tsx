'use client';

// The idea, in two lines, beside a live radar: we watch every venue's
// stories, you pick the vibe. The radar's dots are today's categories, and
// the source chips say where the listings come from.

import { H4_LABEL, getCardAccent } from '@/components/shared/card-style';
import { T } from '@/lib/theme/tokens';
import styles from './home.module.css';

const RADAR_DOTS = [
  { t: '22%', l: '32%' },
  { t: '58%', l: '70%' },
  { t: '36%', l: '78%' },
  { t: '72%', l: '38%' },
  { t: '48%', l: '20%' },
  { t: '26%', l: '58%' },
  { t: '70%', l: '80%' },
];

export const SOURCES: Array<[string, string]> = [
  ['IG stories', '#ec4899'],
  ['IG posts', '#eab308'],
  ['Ticketing', '#10b981'],
  ['Venue sites', '#f97316'],
];

export default function HomeSignal({ liveCount, loading, dotCategories }: {
  liveCount: number;
  loading: boolean;
  /** Today's categories — each dot takes one's colour. */
  dotCategories: string[];
}) {
  const colours = dotCategories.length ? dotCategories.map((c) => getCardAccent(c).text) : ['#f5f5f5'];
  return (
    <section className="px-[18px] pt-8" aria-labelledby="home-signal-title">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <span className={`${H4_LABEL} text-silver-dim`}>The idea</span>
          <h2 id="home-signal-title" className="font-tight font-semibold uppercase text-[22px] leading-[0.95] tracking-[-0.035em] text-pale mt-2">
            We watch every venue&rsquo;s stories.<br /><span className="text-silver">You pick the vibe.</span>
          </h2>
          <p className="text-[13px] leading-relaxed text-silver mt-2">
            Posts, stories, ticketing and venue sites, scanned every day
            {loading ? '.' : <> — <span className="text-pale tabular-nums">{liveCount}</span> live right now.</>}
          </p>
        </div>

        <div aria-hidden className={styles.radar}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="absolute rounded-full" style={{ inset: `${i * 14}px`, border: `1px solid rgba(255,255,255,${0.16 - i * 0.03})` }} />
          ))}
          <div className="absolute top-1/2 inset-x-0 h-px" style={{ background: T.crosshair }} />
          <div className="absolute left-1/2 inset-y-0 w-px" style={{ background: T.crosshair }} />
          <div className={`absolute inset-0 rounded-full ${styles.radarSweep}`}
            style={{ background: 'conic-gradient(from 0deg, transparent 80%, rgba(255,255,255,0.14) 94%, rgba(255,255,255,0.32) 100%)' }} />
          {RADAR_DOTS.map((d, i) => {
            const c = colours[i % colours.length];
            return (
              <span key={i} className={`absolute w-1.5 h-1.5 rounded-full ${styles.radarDot}`}
                style={{ top: d.t, left: d.l, background: c, boxShadow: `0 0 8px ${c}`, animationDelay: `${i * 0.25}s` }} />
            );
          })}
          <span className={`absolute top-1/2 left-1/2 w-2.5 h-2.5 -mt-[5px] -ml-[5px] rounded-full ${styles.radarDot}`}
            style={{ background: '#f5f5f5', boxShadow: '0 0 12px rgba(255,255,255,0.6)' }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-4">
        {SOURCES.map(([label, color]) => (
          <span key={label} className={`${H4_LABEL} inline-flex items-center gap-1.5 px-2 py-1 text-silver`}
            style={{ border: `1px solid ${color}66`, background: `${color}12`, fontSize: 9 }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
