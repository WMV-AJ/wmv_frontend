// ── schema.org JSON-LD builders ──────────────────────────────────────
// Server-side only. Consumed by the server page wrappers via <JsonLd/>.
import { getCityConfig } from '@/config/cities.config';

const BASE = 'https://wheresmyvibe.com';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** "+04:00" style offset string from a fractional UTC offset (5.5 → "+05:30"). */
function offsetString(utcOffsetHours: number): string {
  const sign = utcOffsetHours < 0 ? '-' : '+';
  const abs = Math.abs(utcOffsetHours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Parse "6:00 PM" out of strings like "6:00 PM - 9:00 PM"; null if unparseable. */
function parseStartTime(eventTime: unknown): string | null {
  if (typeof eventTime !== 'string') return null;
  const m = eventTime.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${m[2] ?? '00'}`;
}

/** schema.org Event from a backend record. Returns null without required fields. */
export function buildEventSchema(event: any, city: string, cityDisplayName: string): Record<string, unknown> | null {
  const name = event?.event_name || event?.venue_name;
  const date = event?.event_date;
  if (!name || !date) return null;

  const offset = offsetString(getCityConfig(city).utcOffsetHours);
  const startTime = parseStartTime(event.event_time);
  // Date-only startDate is valid schema.org when the time is unparseable.
  const startDate = startTime ? `${date}T${startTime}:00${offset}` : date;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    startDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: `${BASE}/${city}/event/${event.event_id ?? event.id}`,
  };

  if (event.venue_name || event.venue_lat) {
    schema.location = {
      '@type': 'Place',
      name: event.venue_name || name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.venue_address || undefined,
        addressLocality: cityDisplayName,
        addressCountry: getCityConfig(city).country,
      },
      ...(event.venue_lat && event.venue_lng
        ? { geo: { '@type': 'GeoCoordinates', latitude: event.venue_lat, longitude: event.venue_lng } }
        : {}),
    };
  }

  const media = Array.isArray(event.media_urls) ? event.media_urls[0] : event.media_url_1;
  if (typeof media === 'string' && /\.(jpe?g|png|webp)$/i.test(media)) {
    schema.image = [media];
  }

  if (event.ticket_price != null && event.ticket_price !== '') {
    const price = Number(event.ticket_price);
    if (!Number.isNaN(price)) {
      schema.offers = {
        '@type': 'Offer',
        price,
        priceCurrency: getCityConfig(city).currency,
        availability: 'https://schema.org/InStock',
      };
    }
  }

  if (event.artist && typeof event.artist === 'string') {
    schema.performer = event.artist.split(',').map((a: string) => ({
      '@type': 'PerformingGroup',
      name: a.trim(),
    }));
  }

  return schema;
}

/** schema.org ItemList of event page links (for vibe/area listing pages). */
export function buildItemListSchema(
  events: any[],
  city: string,
  listName: string,
): Record<string, unknown> | null {
  const items = events
    .filter((e) => (e?.event_id ?? e?.id) != null && (e?.event_name || e?.venue_name))
    .slice(0, 10);
  if (items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: e.event_name || e.venue_name,
      url: `${BASE}/${city}/event/${e.event_id ?? e.id}`,
    })),
  };
}

/** Organization + WebSite for the landing page. */
export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE}/#org`,
        name: "Where's My Vibe",
        url: BASE,
        logo: `${BASE}/logo.png`,
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE}/#website`,
        name: "Where's My Vibe",
        url: BASE,
        publisher: { '@id': `${BASE}/#org` },
      },
    ],
  };
}
