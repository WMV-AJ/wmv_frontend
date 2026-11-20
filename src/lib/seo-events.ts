// Server-side helpers that turn raw backend event records into the lists the
// search-facing pages render as HTML (vibe, area, tonight, weekend, free).
// One place decides which records are good enough to show a crawler.
import type { CityServerConfig } from '@/lib/server-data';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Records below this confidence are too often wrong dates or non-events. */
const MIN_CONFIDENCE = 90;
/** A list page with fewer events than this is not worth indexing. */
export const THIN_PAGE_MIN_EVENTS = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface SeoEvent {
  id: string;
  name: string;
  venue: string | null;
  area: string | null;
  date: string;
  time: string | null;
  price: string | null;
  free: boolean;
  raw: any;
}

/** YYYY-MM-DD for "now" in the city. */
export function cityToday(cfg: CityServerConfig, now: Date = new Date()): string {
  return new Date(now.getTime() + cfg.utcOffsetHours * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** The dates that make up "this weekend" as seen from `today`: Fri to Sun, or what is left of it. */
export function weekendDates(today: string): string[] {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 Sun … 6 Sat
  if (weekday === 0) return [today];
  if (weekday === 6) return [today, addDays(today, 1)];
  const friday = addDays(today, 5 - weekday);
  return [friday, addDays(friday, 1), addDays(friday, 2)];
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text && text.toLowerCase() !== 'none' && text.toLowerCase() !== 'null' ? text : null;
}

/** A real clock time or range; drops values that are dates or labels like "All Day". */
function cleanTime(value: unknown): string | null {
  const text = cleanText(value);
  return text && /\d{1,2}(:\d{2})?\s*(am|pm)/i.test(text) ? text : null;
}

const FREE_PATTERN = /\bfree entry\b|\bentry free\b|^free$/i;

function describePrice(raw: any, currency: string): { price: string | null; free: boolean } {
  const ticket = cleanText(typeof raw.ticket_price === 'number' ? String(raw.ticket_price) : raw.ticket_price);
  const offers = cleanText(raw.special_offers);
  if ((ticket && FREE_PATTERN.test(ticket)) || (offers && FREE_PATTERN.test(offers))) {
    return { price: 'Free entry', free: true };
  }
  if (!ticket) return { price: null, free: false };
  const amount = Number(ticket);
  // A bare 0 is usually a missing price, not a confirmed free night.
  if (Number.isFinite(amount)) return { price: amount > 0 ? `${currency} ${amount}` : null, free: false };
  return { price: /[a-z₹]/i.test(ticket) ? ticket : `${currency} ${ticket}`, free: false };
}

/**
 * Records fit to show: named, dated, confident, and listed once.
 * A venue often posts the same night as several stories, so duplicates are
 * collapsed on venue + name + date.
 */
export function toSeoEvents(events: any[], cfg: CityServerConfig): SeoEvent[] {
  const seen = new Set<string>();
  const result: SeoEvent[] = [];
  for (const raw of events) {
    const id = raw?.event_id ?? raw?.id;
    const name = cleanText(raw?.event_name);
    const date = cleanText(raw?.event_date)?.slice(0, 10);
    if (id == null || !name || !date) continue;
    if (Number(raw.confidence_score) < MIN_CONFIDENCE) continue;
    const venue = cleanText(raw.venue_name);
    const key = `${venue ?? ''}|${name}|${date}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      id: String(id),
      name,
      venue,
      area: cleanText(raw.venue_area),
      date,
      time: cleanTime(raw.event_time),
      ...describePrice(raw, cfg.currency),
      raw,
    });
  }
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export function upcoming(events: SeoEvent[], today: string): SeoEvent[] {
  return events.filter((e) => e.date >= today);
}

export function onDates(events: SeoEvent[], dates: readonly string[]): SeoEvent[] {
  return events.filter((e) => dates.includes(e.date));
}

/** "Sat 21 Nov" from "2026-11-21". */
export function formatDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  });
}

/** "21 November 2026" from "2026-11-21". */
export function formatLongDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}
