// Server-rendered summary for a city's home page: today's count, the lists
// people search for, and today's events as plain links. The interactive home
// above it loads its data in the browser, so without this block the page's
// HTML names no events at all.
import Link from 'next/link';
import ServerEventList from '@/components/seo/ServerEventList';
import { VIBES_DATA, matchesVibe } from '@/config/vibes-data';
import type { CityServerConfig } from '@/lib/server-data';
import { formatLongDate, onDates, weekendDates, type SeoEvent } from '@/lib/seo-events';

const TODAY_LIST_LIMIT = 20;

const ink = 'var(--wmv-ink)';
const muted = 'var(--wmv-ink-muted)';
const linkStyle = { color: ink, fontSize: 13, textDecoration: 'underline' } as const;

interface Props {
  cfg: CityServerConfig;
  today: string;
  /** Every upcoming event in the city. */
  events: SeoEvent[];
}

export default function CitySummary({ cfg, today, events }: Props) {
  const city = cfg.slug;
  const tonight = onDates(events, [today]);
  const weekend = onDates(events, weekendDates(today));
  const free = events.filter((e) => e.free);
  const vibeLinks = VIBES_DATA
    .map((vibe) => ({ vibe, count: events.filter((e) => matchesVibe(e.raw, vibe)).length }))
    .filter((entry) => entry.count > 0);

  return (
    <section style={{ padding: '28px 16px 8px' }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: ink, margin: 0 }}>
        What&rsquo;s on in {cfg.displayName} today
      </h2>
      <p style={{ fontSize: 13, lineHeight: 1.5, color: muted, margin: '6px 0 12px' }}>
        Where&rsquo;s My Vibe lists {tonight.length} things on in {cfg.displayName} today and {events.length} from
        today onward, read from venues&rsquo; own Instagram posts and updated on {formatLongDate(today)}.
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
        <li><Link href={`/${city}/tonight`} style={linkStyle}>Tonight ({tonight.length})</Link></li>
        <li><Link href={`/${city}/this-weekend`} style={linkStyle}>This weekend ({weekend.length})</Link></li>
        {free.length > 0 && (
          <li><Link href={`/${city}/free-events`} style={linkStyle}>Free entry ({free.length})</Link></li>
        )}
        {vibeLinks.map(({ vibe, count }) => (
          <li key={vibe.id}>
            <Link href={`/${city}/vibe/${vibe.id}`} style={linkStyle}>{vibe.seoNoun} ({count})</Link>
          </li>
        ))}
      </ul>
      <div style={{ margin: '4px -16px 0' }}>
        <ServerEventList events={tonight.slice(0, TODAY_LIST_LIMIT)} city={city} />
      </div>
    </section>
  );
}
