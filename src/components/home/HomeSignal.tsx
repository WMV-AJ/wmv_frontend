'use client';

// The idea, stacked: heading, a centred live radar + count, one line of
// copy, and WMV drawn as the layer above where the listings come from: we watch every venue's
// stories, you pick the vibe. The radar's dots are today's categories, and
// the source chips say where the listings come from.

import { H4_LABEL, TILE_RULE, getCardAccent } from '@/components/shared/card-style';
import { T } from '@/lib/theme/tokens';
import { HF } from './home-fonts';
import { useEffect, useState } from 'react';
import SourceOrbit from './SourceOrbit';
import SourceSphere from './SourceSphere';
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


export default function HomeSignal({ liveCount, loading, dotCategories, countryCode }: {
  /** City's ISO country (city config region) — picks the ticketing sites shown. */
  countryCode?: string;
  liveCount: number;
  loading: boolean;
  /** Today's categories — each dot takes one's colour. */
  dotCategories: string[];
}) {
  const [variant, setVariant] = useState<'a' | 'b'>('a');
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('sources') === 'b') setVariant('b');
  }, []);
  const colours = dotCategories.length ? dotCategories.map((c) => getCardAccent(c).text) : ['#f5f5f5'];
  return (
    <section className="px-[18px] pt-16 mt-14" aria-labelledby="home-signal-title" style={{ borderTop: `1px solid ${TILE_RULE}` }}>
      <div className={`${H4_LABEL} flex items-center gap-2.5 text-silver-dim`}>
        <span>The idea</span>
        <span aria-hidden className="flex-1 h-px" style={{ background: TILE_RULE }} />
      </div>
      <h2 id="home-signal-title" className={`${HF.idea} text-pale mt-5`}>
        We watch every venue&rsquo;s stories.<br /><span className="italic text-silver">You pick the vibe.</span>
      </h2>

      {/* Radar, centred, with the live count underneath */}
      <div className="flex flex-col items-center mt-10">
        <div aria-hidden className={styles.radar}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="absolute rounded-full" style={{ inset: `${i * 12.5}%`, border: `1px solid rgba(255,255,255,${0.18 - i * 0.03})` }} />
          ))}
          <div className="absolute top-1/2 inset-x-0 h-px" style={{ background: T.crosshair }} />
          <div className="absolute left-1/2 inset-y-0 w-px" style={{ background: T.crosshair }} />
          <div className={`absolute inset-0 rounded-full ${styles.radarSweep}`}
            style={{ background: 'conic-gradient(from 0deg, transparent 80%, rgba(255,255,255,0.14) 94%, rgba(255,255,255,0.32) 100%)' }} />
          {RADAR_DOTS.map((d, i) => {
            const c = colours[i % colours.length];
            return (
              <span key={i} className={`absolute w-2 h-2 rounded-full ${styles.radarDot}`}
                style={{ top: d.t, left: d.l, background: c, boxShadow: `0 0 10px ${c}`, animationDelay: `${i * 0.25}s` }} />
            );
          })}
          <span className={`absolute top-1/2 left-1/2 w-3 h-3 -mt-1.5 -ml-1.5 rounded-full ${styles.radarDot}`}
            style={{ background: '#f5f5f5', boxShadow: '0 0 14px rgba(255,255,255,0.6)' }} />
        </div>
        <div className="mt-6 text-center">
          <div className={`${HF.idea} text-pale tabular-nums`}>{loading ? '—' : liveCount}</div>
          <div className={`${H4_LABEL} text-silver-dim mt-1`}>live right now</div>
        </div>
      </div>

      <p className="text-[15px] leading-relaxed text-silver mt-10">
        We read every venue&rsquo;s stories so you don&rsquo;t have to &mdash; plus their posts,
        ticket pages and sites &mdash; every day, and put what&rsquo;s on tonight and this
        week in one place.
      </p>

      {/* Where it comes from — WMV at the centre of its sources.
          PREVIEW: ?sources=b shows option B (sphere); default A (orbit). */}
      {variant === 'b' ? <SourceSphere countryCode={countryCode} /> : <SourceOrbit countryCode={countryCode} />}
    </section>
  );
}
