/**
 * City-aware "what's today" helper.
 *
 * Replaces the old hardcoded `getDubaiDateString()` that assumed UTC+4. Now
 * uses the per-city `utcOffsetHours` from `cities.config.ts` so a Bangalore
 * visitor sees Bangalore's "today" (IST +5:30) and a Dubai visitor sees
 * Dubai's (+4).
 *
 * Returns YYYY-MM-DD for the given city's current local date.
 */
import { getCityConfig, type CitySlug } from '@/config/cities.config';

export function getCityDateString(city: CitySlug | string | undefined = 'dubai', now: Date = new Date()): string {
  const cfg = getCityConfig(city);
  // Build "now" in the city's timezone by adding the offset to UTC.
  const cityNowMs = now.getTime() + cfg.utcOffsetHours * 60 * 60 * 1000;
  return new Date(cityNowMs).toISOString().slice(0, 10);
}

/**
 * "Tonight" boundary — useful for "events happening tonight" filters.
 * Returns the city's current date if it's currently after sunset (≥18:00 local),
 * otherwise returns yesterday's date (still tonight from the user's POV).
 */
export function getCityTonightDate(city: CitySlug | string | undefined = 'dubai', now: Date = new Date()): string {
  const cfg = getCityConfig(city);
  const cityNowMs = now.getTime() + cfg.utcOffsetHours * 60 * 60 * 1000;
  const cityNow = new Date(cityNowMs);
  // Before 6 AM local, "tonight" still refers to yesterday's evening.
  if (cityNow.getUTCHours() < 6) cityNow.setUTCDate(cityNow.getUTCDate() - 1);
  return cityNow.toISOString().slice(0, 10);
}
