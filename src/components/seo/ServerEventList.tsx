// Server-rendered event lists and intros for the search-facing pages.
// Crawlers that do not run JavaScript read these; visitors see them until the
// interactive cards load.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatDay, type SeoEvent } from '@/lib/seo-events';

const MAX_LISTED = 60;

const ink = 'var(--wmv-ink)';
const muted = 'var(--wmv-ink-muted)';

interface IntroProps {
  heading: string;
  /** The answer in one sentence: what, how many, where, how fresh. */
  answer: string;
  children?: ReactNode;
}

/** Page heading plus the one-sentence answer a search engine or assistant can quote. */
export function SeoIntro({ heading, answer, children }: IntroProps) {
  return (
    <header style={{ padding: '14px 16px 4px' }}>
      <h1 style={{ fontSize: 18, lineHeight: 1.25, fontWeight: 600, color: ink, margin: 0 }}>{heading}</h1>
      <p style={{ fontSize: 13, lineHeight: 1.5, color: muted, margin: '6px 0 0' }}>{answer}</p>
      {children}
    </header>
  );
}

function detailLine(event: SeoEvent): string {
  return [
    [event.venue, event.area].filter(Boolean).join(', '),
    formatDay(event.date),
    event.time,
    event.price,
  ].filter(Boolean).join(' · ');
}

interface ListProps {
  events: SeoEvent[];
  city: string;
}

/** Plain list of events, each linking to its own page. */
export default function ServerEventList({ events, city }: ListProps) {
  if (events.length === 0) return null;
  const shown = events.slice(0, MAX_LISTED);
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: '8px 16px 24px' }}>
      {shown.map((event) => (
        <li key={event.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--wmv-line, rgba(128,128,128,0.2))' }}>
          <Link href={`/${city}/event/${event.id}`} style={{ color: ink, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            {event.name}
          </Link>
          <div style={{ color: muted, fontSize: 12, marginTop: 2 }}>{detailLine(event)}</div>
        </li>
      ))}
      {events.length > shown.length && (
        <li style={{ padding: '10px 0', color: muted, fontSize: 12 }}>
          and {events.length - shown.length} more on the map
        </li>
      )}
    </ul>
  );
}
