// One searchable string per event row, built from the event's own details:
// name, date, time, artist, genre, vibe, categories, offers and deals, price
// and notes. Of the venue, only its name and area count, since they say where
// the event is; its address, type, highlights, atmosphere and rating do not.

/** The event's details, plus the venue's name and area. */
const SEARCHED_FIELDS = [
  'event_name', 'name', 'venue_name', 'area', 'venue_area', 'event_time', 'artist', 'music_genre',
  'music_genre_processed', 'event_vibe', 'event_vibe_processed', 'event_categories', 'special_offers', 'deals',
  'ticket_price', 'analysis_notes',
] as const;

const cache = new WeakMap<object, string>();

/** Flatten any value to words. Object keys count too: highlights are stored as [{"Live music": true}]. */
function collect(value: unknown, out: string[], depth = 0): void {
  if (value == null || value === false || depth > 4) return;
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return;
    // Some columns hold JSON as text, e.g. category = '["Bar","Lounge"]'.
    if ((text.startsWith('[') || text.startsWith('{')) && text.length < 4000) {
      try {
        collect(JSON.parse(text), out, depth + 1);
        return;
      } catch {
        // Not JSON after all; fall through and keep it as plain text.
      }
    }
    out.push(text);
    return;
  }
  if (typeof value === 'number') {
    out.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collect(item, out, depth + 1));
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, inner]) => {
      if (inner === true) out.push(key);
      else collect(inner, out, depth + 1);
    });
  }
}

/** "2026-12-25" → "friday 25 december dec", so a day or month name finds the event. */
function dateWords(eventDate: unknown): string {
  if (typeof eventDate !== 'string' || !eventDate) return '';
  const date = new Date(eventDate);
  if (isNaN(date.getTime())) return '';
  const opts = { timeZone: 'UTC' } as const;
  return [
    date.toLocaleDateString('en-GB', { ...opts, weekday: 'long' }),
    date.getUTCDate(),
    date.toLocaleDateString('en-GB', { ...opts, month: 'long' }),
    date.toLocaleDateString('en-GB', { ...opts, month: 'short' }),
  ].join(' ');
}

/** Lower-case, accents removed, punctuation turned into spaces. */
export function normaliseSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9@]+/g, ' ')
    .trim();
}

export function getSearchText(row: object): string {
  const cached = cache.get(row);
  if (cached !== undefined) return cached;
  const parts: string[] = [];
  const record = row as Record<string, unknown>;
  SEARCHED_FIELDS.forEach((field) => collect(record[field], parts));
  parts.push(dateWords(record.event_date));
  const price = Number(record.ticket_price);
  if (record.ticket_price != null && record.ticket_price !== '' && price === 0) parts.push('free');
  const text = normaliseSearch(parts.join(' '));
  cache.set(row, text);
  return text;
}

/** True when every word of the query appears somewhere in the row, in any order. */
export function matchesSearch(row: object, query: string): boolean {
  const words = normaliseSearch(query).split(' ').filter(Boolean);
  if (words.length === 0) return true;
  const text = getSearchText(row);
  return words.every((word) => text.includes(word));
}
