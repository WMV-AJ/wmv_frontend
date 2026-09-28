'use client';

// "A layer above": WMV sits on top of where the listings come from. Two
// honest tiers — what the daily pipeline reads today (Instagram stories +
// posts, Google Maps for venues), and the ticketing sites whose scrapers are
// built but not yet in the daily run ("Next"). Keep these lists in step with
// backend/src/jobs/daily-orchestrator.job.ts and backend/website_scraper/.
// Logos are the sources' own icons, self-hosted in public/home/sources.

import Image from 'next/image';
import { H4_LABEL, TILE_RULE } from '@/components/shared/card-style';
import { T } from '@/lib/theme/tokens';
import { useRevealOnce } from './useRevealOnce';
import styles from './home.module.css';

interface Source {
  name: string;
  /** public/home/sources/<logo>.png; null → lettered tile. */
  logo: string | null;
  /** ISO country codes it covers; empty = everywhere. */
  countries?: string[];
}

const LIVE: Array<Source & { what: string }> = [
  { name: 'Instagram Stories', logo: 'instagram', what: 'Tonight’s lineups' },
  { name: 'Instagram Posts', logo: 'instagram', what: 'Posts + reels' },
  { name: 'Google Maps', logo: 'googlemaps', what: 'Every venue' },
];

const NEXT: Source[] = [
  { name: 'Platinumlist', logo: 'platinumlist', countries: ['ae'] },
  { name: 'DubaiNight', logo: 'dubainight', countries: ['ae'] },
  { name: 'The Party Finder', logo: 'partyfinder', countries: ['ae'] },
  { name: 'Ticketmaster', logo: 'ticketmaster', countries: ['ae'] },
  { name: 'Virgin Megastore', logo: 'virginmegastore', countries: ['ae'] },
  { name: 'Coca-Cola Arena', logo: 'cocacolaarena', countries: ['ae'] },
  { name: 'Songkick', logo: 'songkick', countries: ['ae'] },
  { name: 'BookMyShow', logo: 'bookmyshow', countries: ['in'] },
  { name: 'District', logo: 'district', countries: ['in'] },
  { name: 'HighApe', logo: 'highape', countries: ['in'] },
  { name: 'Ticket Fairy', logo: null, countries: ['in'] },
  { name: 'Eventz', logo: 'eventz', countries: ['in'] },
  { name: 'AllEvents', logo: 'allevents' },
  { name: 'Resident Advisor', logo: 'ra' },
  { name: 'Bandsintown', logo: 'bandsintown' },
  { name: 'Fever', logo: 'fever' },
  { name: 'SortMyScene', logo: 'sortmyscene' },
];

function Logo({ src, name, size }: { src: string | null; name: string; size: number }) {
  if (!src) {
    const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    return (
      <span className="flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-[#0b0b0b] bg-[#f5f5f5]"
        style={{ width: size, height: size, borderRadius: size * 0.22 }}>{initials}</span>
    );
  }
  return (
    <Image src={`/home/sources/${src}.png`} alt="" width={size} height={size} className="flex-shrink-0 object-cover"
      style={{ width: size, height: size, borderRadius: size * 0.22 }} />
  );
}

export default function HomeSourceLayers({ countryCode, scrollRoot }: {
  /** The city's country (city config) — picks which ticketing sites to show. */
  countryCode?: string;
  scrollRoot: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRevealOnce<HTMLDivElement>(scrollRoot, 0.2);
  const cc = (countryCode ?? '').toLowerCase();
  const next = NEXT.filter((s) => !s.countries?.length || !cc || s.countries.includes(cc));

  return (
    <div ref={ref} className={styles.layers} aria-label="Where's My Vibe sits on top of Instagram, Google Maps and ticketing sites">
      {/* Top — WMV */}
      <div className={`${styles.layer} ${styles.layerTop}`} style={{ '--d': 2 } as React.CSSProperties}>
        <Image src="/home3/wmv-logo-still.png" alt="" width={40} height={40} className="rounded-full flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-pale leading-tight">Where&rsquo;s My Vibe</div>
          <div className={`${H4_LABEL} text-silver mt-1`}>One map · one list · sorted by vibe</div>
        </div>
      </div>

      <Flow strong />

      {/* Middle — read every day */}
      <div className={styles.layer} style={{ '--d': 1 } as React.CSSProperties}>
        <div className={`${H4_LABEL} flex items-center gap-2 text-pale w-full`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
          Live · read every day
        </div>
        <div className="grid grid-cols-3 gap-2 w-full mt-3">
          {LIVE.map((s) => (
            <div key={s.name} className="flex flex-col items-center text-center gap-1.5 py-3 px-1" style={{ border: `1px solid ${TILE_RULE}`, background: 'rgba(255,255,255,0.03)' }}>
              <Logo src={s.logo} name={s.name} size={30} />
              <span className="text-[11px] font-semibold text-pale leading-tight">{s.name}</span>
              <span className="text-[10px] text-silver-dim leading-tight">{s.what}</span>
            </div>
          ))}
        </div>
      </div>

      <Flow />

      {/* Bottom — built, joining the daily run next */}
      <div className={`${styles.layer} ${styles.layerNext}`} style={{ '--d': 0 } as React.CSSProperties}>
        <div className={`${H4_LABEL} flex items-center gap-2 text-silver w-full`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
          Next · ticketing &amp; event sites
          <span className="ml-auto text-silver-dim tabular-nums">{next.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 w-full mt-3">
          {next.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 text-[11px] text-silver"
              style={{ border: `1px dashed ${TILE_RULE}` }}>
              <Logo src={s.logo} name={s.name} size={18} />
              {s.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Three connector lines with dots travelling up into the layer above. */
function Flow({ strong }: { strong?: boolean }) {
  return (
    <div className={styles.flow} aria-hidden="true" style={{ opacity: strong ? 1 : 0.55 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={styles.flowLine}>
          <span className={styles.flowDot} style={{ animationDelay: `${i * 0.35 + (strong ? 0 : 0.2)}s` }} />
        </span>
      ))}
    </div>
  );
}
