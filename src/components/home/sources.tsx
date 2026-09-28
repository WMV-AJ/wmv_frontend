// Where the listings come from — shared by the source visuals in "The idea".
// Two honest tiers: what the daily pipeline reads today (Instagram stories +
// posts, Google Maps for venues), and ticketing sites whose scrapers are built
// but not yet in the daily run ("Next"). Keep in step with
// backend/src/jobs/daily-orchestrator.job.ts and backend/website_scraper/.
// Logos are the sources' own icons, self-hosted in public/home/sources.

import Image from 'next/image';

export interface Source {
  name: string;
  /** public/home/sources/<logo>.png; null → lettered tile. */
  logo: string | null;
  /** ISO country codes it covers; empty = everywhere. */
  countries?: string[];
}

export const LIVE: Array<Source & { what: string }> = [
  { name: 'Instagram Stories', logo: 'instagram', what: 'Tonight’s lineups' },
  { name: 'Instagram Posts', logo: 'instagram', what: 'Posts + reels' },
  { name: 'Google Maps', logo: 'googlemaps', what: 'Every venue' },
];

export const NEXT: Source[] = [
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

/** Ticketing sites for a city's country (ISO alpha-2); unknown → all. */
export function nextSourcesFor(countryCode?: string): Source[] {
  const cc = (countryCode ?? '').toLowerCase();
  return NEXT.filter((s) => !s.countries?.length || !cc || s.countries.includes(cc));
}

export function Logo({ src, name, size }: { src: string | null; name: string; size: number }) {
  if (!src) {
    const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    return (
      <span className="flex items-center justify-center flex-shrink-0 text-[9px] font-bold wmv-invert"
        style={{ width: size, height: size, borderRadius: size * 0.22 }}>{initials}</span>
    );
  }
  return (
    <Image src={`/home/sources/${src}.png`} alt="" width={size} height={size} className="flex-shrink-0 object-cover"
      style={{ width: size, height: size, borderRadius: size * 0.22 }} />
  );
}


/** Names under a source visual: what's live, what's next. */
export function SourceLegend({ next }: { next: Source[] }) {
  return (
    <div className="mt-6 grid gap-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
        <p className="text-[13px] leading-relaxed text-silver">
          <span className="text-pale font-semibold">Live, read every day: </span>
          {LIVE.map((s) => s.name).join(', ')}.
        </p>
      </div>
      <div className="flex items-start gap-2.5">
        <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ border: '1px solid #f4c430' }} />
        <p className="text-[13px] leading-relaxed text-silver">
          <span className="text-pale font-semibold">Next, {next.length} ticketing &amp; event sites: </span>
          {next.map((s) => s.name).join(', ')}.
        </p>
      </div>
    </div>
  );
}
