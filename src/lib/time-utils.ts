/**
 * Time utilities for event time parsing, section grouping, and live detection.
 * Used by StackedEventCards, MobileEventCard, and the event detail page.
 */

// ===== Time Sections (Dubai-appropriate) =====

export interface TimeSection {
  key: string;
  name: string;
  emoji: string;
  order: number;
}

const TIME_SECTIONS: TimeSection[] = [
  { key: 'happening_now', name: 'Happening Now', emoji: '🔴', order: 0 },
  { key: 'morning',       name: 'Morning Events', emoji: '☀️', order: 1 },
  { key: 'afternoon',     name: 'Afternoon Vibes', emoji: '🌤️', order: 2 },
  { key: 'sunset',        name: 'Sunset & Golden Hour', emoji: '🌅', order: 3 },
  { key: 'evening',       name: 'Evening Energy', emoji: '✨', order: 4 },
  { key: 'nightlife',     name: 'Nightlife', emoji: '🌙', order: 5 },
];

export { TIME_SECTIONS };

// ===== Parse time string to minutes since midnight =====

/**
 * Parse time string like "08:00 PM", "8:00 PM", "20:00" → minutes since midnight (0–1439)
 * Returns -1 if unparseable.
 */
export function parseTimeString(timeStr: string): number {
  if (!timeStr) return -1;
  const cleaned = timeStr.trim().toUpperCase();

  // Try 12-hour format: "08:00 PM", "8:00 PM", "8 PM"
  const match12 = cleaned.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const period = match12[3];
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Try 24-hour format: "20:00", "08:00"
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return -1;
}

// ===== Get time section for an event =====

/**
 * Given a start time string, return which time-of-day section it belongs to.
 */
export function getTimeSection(timeStr: string): TimeSection {
  const minutes = parseTimeString(timeStr);
  if (minutes < 0) return TIME_SECTIONS[5]; // default to nightlife if unparseable

  const hours = minutes / 60;

  if (hours < 12) return TIME_SECTIONS[1];       // Morning: before 12 PM
  if (hours < 16) return TIME_SECTIONS[2];       // Afternoon: 12 PM – 4 PM
  if (hours < 19) return TIME_SECTIONS[3];       // Sunset: 4 PM – 7 PM
  if (hours < 22) return TIME_SECTIONS[4];       // Evening: 7 PM – 10 PM
  return TIME_SECTIONS[5];                        // Nightlife: 10 PM – 6 AM (wraps)
}

// ===== Date checks =====

export function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    const eventDate = new Date(dateStr).toDateString();
    return eventDate === new Date().toDateString();
  } catch {
    return false;
  }
}

export function isTomorrow(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const eventDate = new Date(dateStr).toDateString();
    return eventDate === tomorrow.toDateString();
  } catch {
    return false;
  }
}

export function getTodayDateString(): string {
  return new Date().toDateString();
}

export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toDateString();
}

// ===== Check if event is happening right now =====

/**
 * Check if an event is currently live.
 * Handles overnight events (e.g., 10 PM – 3 AM).
 */
export function isEventHappeningNow(
  timeStart: string,
  timeEnd: string,
  eventDate: string
): boolean {
  if (!timeStart || !eventDate) return false;
  if (!isToday(eventDate)) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTimeString(timeStart);
  const endMinutes = timeEnd ? parseTimeString(timeEnd) : -1;

  if (startMinutes < 0) return false;

  // No end time — consider live if start was within last 3 hours
  if (endMinutes < 0) {
    return currentMinutes >= startMinutes && currentMinutes <= startMinutes + 180;
  }

  // Normal event (start < end, e.g., 2 PM – 6 PM)
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  // Overnight event (start > end, e.g., 10 PM – 3 AM)
  // Live if current time is after start OR before end
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

// ===== Format time for display =====

/**
 * Format time for clean display: "8:00 PM" (strip leading zero)
 */
export function formatTimeClean(timeStr: string): string {
  if (!timeStr) return '';
  const cleaned = timeStr.trim();
  // Remove leading zero: "08:00 PM" → "8:00 PM"
  return cleaned.replace(/^0/, '');
}

// ===== Format date for display =====

/**
 * Format date for display: "Today", "Tomorrow", or "Fri, Feb 27"
 */
export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  if (isToday(dateStr)) return 'Today';
  if (isTomorrow(dateStr)) return 'Tomorrow';
  try {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  } catch {
    return dateStr;
  }
}

// ===== Group events by time section =====

export interface GroupedSection<T> {
  section: TimeSection;
  events: T[];
}

/**
 * Group an array of events by time-of-day section.
 * Items are sorted by start time within each section.
 * getTimeStart: function to extract start time string from an event item.
 * getDate: function to extract date string (for live detection).
 */
export function groupByTimeOfDay<T>(
  items: T[],
  getTimeStart: (item: T) => string,
  getTimeEnd: (item: T) => string,
  getDate: (item: T) => string
): GroupedSection<T>[] {
  const groups = new Map<string, T[]>();

  // Initialize groups (only sections that have items will be returned)
  for (const item of items) {
    const timeStart = getTimeStart(item);
    const timeEnd = getTimeEnd(item);
    const date = getDate(item);

    // Check if happening now
    const isLive = isEventHappeningNow(timeStart, timeEnd, date);
    const sectionKey = isLive ? 'happening_now' : getTimeSection(timeStart).key;

    if (!groups.has(sectionKey)) {
      groups.set(sectionKey, []);
    }
    groups.get(sectionKey)!.push(item);
  }

  // Sort items within each group by start time
  for (const [, groupItems] of groups) {
    groupItems.sort((a, b) => {
      const aTime = parseTimeString(getTimeStart(a));
      const bTime = parseTimeString(getTimeStart(b));
      return aTime - bTime;
    });
  }

  // Build result sorted by section order
  const result: GroupedSection<T>[] = [];
  for (const section of TIME_SECTIONS) {
    const groupItems = groups.get(section.key);
    if (groupItems && groupItems.length > 0) {
      result.push({ section, events: groupItems });
    }
  }

  return result;
}

/**
 * Tolerant, DISPLAY-ONLY time label for the map's bottom card.
 *
 * `parseEventTime` in stacked-card-adapter is deliberately strict — its output
 * feeds the card deduplication key, so loosening it would split rows that
 * currently merge and change card counts across the app. This function is
 * display-only and never touches that key.
 *
 * Real values in the feed look like: "8:00 PM Onwards", "5 PM Onwards",
 * "All Day", "6:00 PM - 11:00 PM", "8:00 PM - Late", and — confusingly —
 * date ranges such as "Until 31st October" or "16th Sep - 16th Oct", which
 * must NOT be rendered as a time.
 *
 * Returns '' when the string holds no clock time, so the caller can fall back.
 */
export function formatEventTimeLabel(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.trim();
  if (!s) return '';

  // Date ranges masquerading as times — reject before looking for clocks.
  const MONTHS = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i;
  if (MONTHS.test(s) || /\b\d{1,2}(st|nd|rd|th)\b/i.test(s) || /^until\b/i.test(s)) {
    return '';
  }

  if (/^all\s*day$/i.test(s)) return 'All day';

  // 12-hour ("8 PM", "8:00 PM") and 24-hour ("20:00") clock tokens.
  const tokens: string[] = [];
  const twelve = /\b(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?\b/gi;
  let m: RegExpExecArray | null;
  while ((m = twelve.exec(s)) !== null) {
    const hh = parseInt(m[1], 10);
    const mm = m[2] ?? '00';
    tokens.push(`${hh}:${mm} ${m[3].toUpperCase()}M`);
  }
  if (tokens.length === 0) {
    const twentyFour = /\b([01]?\d|2[0-3]):([0-5]\d)\b/g;
    while ((m = twentyFour.exec(s)) !== null) {
      const hh = parseInt(m[1], 10);
      const suffix = hh >= 12 ? 'PM' : 'AM';
      const h12 = hh % 12 === 0 ? 12 : hh % 12;
      tokens.push(`${h12}:${m[2]} ${suffix}`);
    }
  }
  if (tokens.length === 0) return '';

  if (tokens.length >= 2) return `${tokens[0]} – ${tokens[1]}`;
  if (/\bonwards?\b/i.test(s)) return `${tokens[0]} onwards`;
  if (/\blate\b/i.test(s)) return `${tokens[0]} – late`;
  return tokens[0];
}
