import { addDays, startOfWeek, endOfWeek, isToday, isTomorrow, isThisWeek } from 'date-fns';

export type DatePreset = 'today' | 'tomorrow' | 'this-week' | 'custom';

/**
 * Convert date preset to date strings in JS toDateString() format
 * ("Fri May 15 2026") — matches what useClientSideVenues uses for comparison.
 */
export function getDatesByPreset(preset: DatePreset, customDates?: string[]): string[] {
  const now = new Date();

  switch (preset) {
    case 'today':
      return [now.toDateString()];

    case 'tomorrow':
      return [addDays(now, 1).toDateString()];

    case 'this-week': {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const dates: string[] = [];
      for (let d = new Date(weekStart); d <= weekEnd; d = addDays(d, 1)) {
        dates.push(d.toDateString());
      }
      return dates;
    }

    case 'custom':
      return customDates || [];

    default:
      return [];
  }
}

/**
 * Determine which preset matches the given dates
 */
export function getPresetFromDates(dates: string[]): DatePreset | null {
  if (dates.length === 0) return null;

  const now = new Date();

  if (dates.length === 1) {
    if (dates[0] === now.toDateString()) return 'today';
    if (dates[0] === addDays(now, 1).toDateString()) return 'tomorrow';
  }

  const thisWeekDates = getDatesByPreset('this-week');
  if (dates.length === thisWeekDates.length &&
      dates.every(d => thisWeekDates.includes(d))) {
    return 'this-week';
  }

  return 'custom';
}

/**
 * Get display label for date preset
 */
export function getPresetLabel(preset: DatePreset): string {
  switch (preset) {
    case 'today': return 'Today';
    case 'tomorrow': return 'Tomorrow';
    case 'this-week': return 'This Week';
    case 'custom': return 'Custom Date';
    default: return '';
  }
}

/**
 * Check if a date string matches today
 */
export function isDateToday(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return isToday(date);
  } catch {
    return false;
  }
}

/**
 * Check if a date string matches tomorrow
 */
export function isDateTomorrow(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return isTomorrow(date);
  } catch {
    return false;
  }
}

/**
 * Check if a date string is within this week
 */
export function isDateThisWeek(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return isThisWeek(date, { weekStartsOn: 1 });
  } catch {
    return false;
  }
}

/**
 * Parse date from "17 Sept 25" format (used by /api/filter-options)
 * Handles the specific format returned by the API endpoint
 */
export function parseDateFromFormat(dateStr: string): Date {
  // Handle "17 Sept 25" format
  const parts = dateStr.split(' ');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.findIndex(m => m === month);

    if (monthIndex !== -1) {
      // Convert 2-digit year to 4-digit year
      // Years 00-49 → 2000-2049
      // Years 50-99 → 1950-1999
      const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
      return new Date(fullYear, monthIndex, parseInt(day));
    }
  }

  // Fallback to ISO format or standard Date parsing
  return new Date(dateStr);
}
