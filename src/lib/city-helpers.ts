/**
 * Small utilities for working with the URL `city` param across the app.
 *
 * History: the legacy codebase hardcoded the magic string `'All Dubai'` as
 * the "no area filter" sentinel. With multi-city support, the sentinel is
 * `'All <CityDisplayName>'` (e.g. `'All Bangalore'`). Components that
 * compare against the sentinel should call `isAllCitySentinel` so they
 * accept ANY "All <City>" form.
 */
import { getCityConfig, type CitySlug } from '@/config/cities.config';

/**
 * Recognise the "All <City>" sentinel that means "no area filter applied".
 *
 * Matches anything starting with "All " (case-insensitive). That covers
 * "All Dubai", "All Bangalore", and any future city's default label.
 */
export function isAllCitySentinel(value: unknown): value is string {
  return typeof value === 'string' && /^All\s+/i.test(value);
}

/** Convenience: true iff the selectedAreas array contains the "All <City>" sentinel (so area filter is bypassed). */
export function hasAllCitySentinel(selectedAreas: readonly string[] | undefined | null): boolean {
  if (!selectedAreas) return false;
  return selectedAreas.some(isAllCitySentinel);
}

/**
 * Default area label for a given city slug. e.g. `'All Dubai'` for `'dubai'`,
 * `'All Bangalore'` for `'bangalore'`.
 */
export function defaultAreaLabelFor(city: CitySlug | string | undefined): string {
  return getCityConfig(city).defaultAreaLabel;
}
