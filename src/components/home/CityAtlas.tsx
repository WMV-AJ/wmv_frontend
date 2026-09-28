'use client';

// "Your next good night starts here." — Home 4's city picker + illustrative
// atlas, dark and live: the city list is the runtime city config (no
// hard-coded slugs), picking a city goes straight to that city's home, and
// the atlas pins take the city's top live categories' colours.

import { ArrowUpRight, ChevronDown, List, Map as MapIcon } from 'lucide-react';
import { H4_LABEL, TILE_RULE, getCardAccent, type CardAccent } from '@/components/shared/card-style';
import { SectionKicker } from './VibeFan';
import { BTN_PRIMARY, BTN_SECONDARY, BTN_SECONDARY_STYLE } from './HomeParts';
import { useRevealOnce } from './useRevealOnce';
import styles from './home.module.css';

const ROUTE = 'M80 430 C165 370 230 455 285 310 S365 165 460 235 S520 110 580 100';
const PINS: Array<[number, number, number]> = [[80, 430, 13], [285, 310, 10], [460, 235, 11], [580, 100, 16]];

export default function CityAtlas({ city, cities, accent, pinCategories, kicker, scrollRoot, onChangeCity, onMap, onList }: {
  city: string;
  /** [slug, display name] for every live city. */
  cities: Array<[string, string]>;
  accent: CardAccent;
  pinCategories: string[];
  kicker: { index: number; total: number };
  scrollRoot: React.RefObject<HTMLElement | null>;
  onChangeCity: (slug: string) => void;
  onMap: () => void;
  onList: () => void;
}) {
  const atlasRef = useRevealOnce<HTMLDivElement>(scrollRoot, 0.25);
  const cityName = cities.find(([slug]) => slug === city)?.[1] ?? city;
  const pinColours = pinCategories.length > 0
    ? pinCategories.map((c) => getCardAccent(c).text)
    : [accent.text];

  return (
    <section
      className="px-[18px] pt-12"
      aria-labelledby="home-city-title"
      style={{ '--accent-text': accent.text } as React.CSSProperties}
    >
      <SectionKicker index={kicker.index} total={kicker.total} title="Your city" />
      <h2 id="home-city-title" className="font-tight font-semibold uppercase text-[34px] leading-[0.92] tracking-[-0.045em] text-pale mt-4">
        Your next<br />good night<br /><span className="text-silver">starts here.</span>
      </h2>
      <p className="text-[13px] leading-relaxed text-silver mt-3">Pick your city. We&rsquo;ll show you what&rsquo;s on.</p>

      <label htmlFor="home-city-select" className={`${H4_LABEL} block mt-6`} style={{ color: accent.text }}>Your city</label>
      <div className="relative mt-2">
        <select
          id="home-city-select"
          value={city}
          onChange={(e) => onChangeCity(e.target.value)}
          className="appearance-none w-full h-12 rounded-none pl-3.5 pr-10 font-inter font-[550] text-[14px] text-pale cursor-pointer"
          style={{ background: 'var(--home-surface, rgba(20,20,31,0.92))', border: `1px solid ${TILE_RULE}` }}
        >
          {cities.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
        </select>
        <ChevronDown aria-hidden className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: accent.text }} />
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={onMap} className={`${BTN_PRIMARY} flex-1`}><MapIcon className="w-4 h-4" />See the map</button>
        <button onClick={onList} className={`${BTN_SECONDARY} flex-1`} style={BTN_SECONDARY_STYLE}><List className="w-4 h-4" />Browse the list</button>
      </div>
      <p className={`${H4_LABEL} text-silver-dim mt-4`}>Free to explore / no account required</p>

      <div ref={atlasRef} className={styles.atlas} aria-label={`Illustrative route for ${cityName}; use the buttons above to open the real map or list`}>
        <div className={styles.atlasPlate}>
          <div className={styles.atlasGrid} />
          <svg viewBox="0 0 650 560" aria-hidden="true">
            <path className={styles.atlasRouteShadow} d={ROUTE} />
            {/* keyed on the city so the route redraws after a switch */}
            <path key={city} className={styles.atlasRoute} d={ROUTE} />
            {PINS.map(([cx, cy, r], i) => (
              <circle key={i} cx={cx} cy={cy} r={r} style={{ fill: pinColours[i % pinColours.length] }} />
            ))}
          </svg>
          <span className={styles.atlasLabel}>
            <span className={`${H4_LABEL} text-silver-dim`}>A city to explore</span>
            <strong className="font-tight font-semibold uppercase text-[24px] leading-none tracking-[-0.04em] text-pale">{cityName}</strong>
          </span>
        </div>
        <span className={`${H4_LABEL} absolute right-0 bottom-0 inline-flex items-center gap-2 text-silver-dim`}>
          Illustrative city atlas <ArrowUpRight className="w-3.5 h-3.5" style={{ color: accent.text }} />
        </span>
      </div>
    </section>
  );
}
