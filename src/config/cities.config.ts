/**
 * Frontend mirror of `backend/src/config/cities.config.ts` plus the UI-only
 * fields (map center / bounds / areas / currency symbol).
 *
 * The URL segment `[city]` is the source of truth — every page extracts it
 * via `useParams()` and resolves config via `getCityConfig(slug)`.
 *
 * Adding a city = one entry here + a new `[city]` route working out of the
 * box, assuming the backend has venues tagged with that city.
 */

// Widened to `string` so dynamic cities loaded from /api/cities at runtime
// don't fail the compile-time literal check. Validation now happens via
// `isValidCity()` against the merged static+dynamic registry.
export type CitySlug = string;

// Mutable — `loadCitiesFromApi()` pushes new city slugs in at runtime
// (called from the root layout on mount). Stays seeded with Dubai +
// Bangalore so SSG and build-time consumers have a sane baseline.
export const ALL_CITIES: CitySlug[] = ['dubai', 'bangalore'];

/** Default city for the root redirect (`/` → `/dubai`). */
export const DEFAULT_CITY: CitySlug = 'dubai';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface CityArea {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
}

export interface CityUiConfig {
  slug: CitySlug;
  displayName: string;          // "Dubai" / "Bangalore"
  country: string;              // "UAE" / "India"
  region: string;               // ISO-3166 alpha-2 — Google Maps `region` hint
  timezone: string;             // IANA — "Asia/Dubai" / "Asia/Kolkata"
  utcOffsetHours: number;       // 4 / 5.5
  currency: string;             // "AED" / "INR"
  currencySymbol: string;       // What to show in prices — "AED" / "₹"
  mapCenter: LatLng;
  mapBounds: MapBounds;
  defaultZoom: number;
  areas: CityArea[];            // for the area filter
  defaultAreaLabel: string;     // "All Dubai" / "All Bangalore"
  // Stage-3 / city_config taxonomy mirrored from backend (migration 046/047).
  // Drives the order + membership of the primary category pills on [city].
  // Empty array → CategoryPills falls back to whatever categories exist in
  // the venues data (organic discovery), useful for cities whose backend
  // taxonomy hasn't been curated yet.
  eventCategories: string[];
}

const DUBAI_AREAS: CityArea[] = [
  { name: 'Downtown Dubai',   lat: 25.1972, lng: 55.2744, zoom: 14 },
  { name: 'Dubai Marina',     lat: 25.0805, lng: 55.1403, zoom: 14 },
  { name: 'JBR',              lat: 25.0752, lng: 55.1337, zoom: 15 },
  { name: 'Business Bay',     lat: 25.1850, lng: 55.2650, zoom: 14 },
  { name: 'DIFC',             lat: 25.2110, lng: 55.2820, zoom: 15 },
  { name: 'City Walk',        lat: 25.2048, lng: 55.2645, zoom: 15 },
  { name: 'La Mer',           lat: 25.2354, lng: 55.2707, zoom: 15 },
  { name: 'Bluewaters',       lat: 25.0764, lng: 55.1201, zoom: 16 },
  { name: 'Old Dubai/Deira',  lat: 25.2654, lng: 55.3007, zoom: 14 },
  { name: 'Al Seef',          lat: 25.2554, lng: 55.2934, zoom: 15 },
  { name: 'Jumeirah',         lat: 25.2048, lng: 55.2708, zoom: 14 },
];

// Bootstrap empty — populated as Bangalore venues come in.
const BANGALORE_AREAS: CityArea[] = [];

export const CITIES: Record<CitySlug, CityUiConfig> = {
  dubai: {
    slug: 'dubai',
    displayName: 'Dubai',
    country: 'UAE',
    region: 'AE',
    timezone: 'Asia/Dubai',
    utcOffsetHours: 4,
    currency: 'AED',
    currencySymbol: 'AED',
    mapCenter: { lat: 25.2048, lng: 55.2708 },
    mapBounds: { north: 25.4, south: 24.8, east: 55.6, west: 54.8 },
    defaultZoom: 12,
    areas: DUBAI_AREAS,
    defaultAreaLabel: 'All Dubai',
    eventCategories: [
      'Club Night', 'Brunch', 'Pool Party', 'Ladies Night',
      'Live Performance', 'Happy Hour', 'Sports Viewing',
      'Day Party & Afterwork', 'Comedy Night', 'Food & Dining',
      'Business Event',
    ],
  },
  bangalore: {
    slug: 'bangalore',
    displayName: 'Bangalore',
    country: 'India',
    region: 'IN',
    timezone: 'Asia/Kolkata',
    utcOffsetHours: 5.5,
    currency: 'INR',
    currencySymbol: '₹',
    mapCenter: { lat: 12.9716, lng: 77.5946 },
    mapBounds: { north: 13.15, south: 12.85, east: 77.75, west: 77.45 },
    defaultZoom: 12,
    areas: BANGALORE_AREAS,
    defaultAreaLabel: 'All Bangalore',
    // Mirrors migration 047 BLR taxonomy (post-Quiz/Open Mic collapse).
    eventCategories: [
      'Food & Dining', 'Live Performance', 'Club Night', 'Cocktail Bar Night',
      'Pub Night', 'Sports Viewing', 'Business Event', 'Comedy Night',
      'Activities', 'Karaoke', 'Tasting Event', 'Happy Hour',
      'Workshop', 'Family & Kids', 'Pop Up', 'Ladies Night',
    ],
  },
};

export function isValidCity(slug: string | undefined | null): slug is CitySlug {
  return !!slug && (slug in CITIES);
}

/**
 * Resolve a slug to its config. Unknown slugs fall back to the default city
 * rather than throwing — the frontend should never crash on a bad URL.
 */
export function getCityConfig(slug: string | undefined | null): CityUiConfig {
  if (isValidCity(slug)) return CITIES[slug];
  return CITIES[DEFAULT_CITY];
}

// ---------------------------------------------------------------------------
// Runtime city loader (migration 043 / Phase 9.4)
// ---------------------------------------------------------------------------
// Fetches the DB-backed city registry from /api/cities and mutates CITIES +
// ALL_CITIES in place so newly-onboarded cities (e.g. Mumbai) appear without
// a code edit + redeploy. Call once at app boot from a top-level provider:
//
//   await loadCitiesFromApi();
//
// Failure is silent (kept the static Dubai+Bangalore fallback) — a
// frontend-only outage when the API is down is worse than serving slightly
// stale config.

interface ApiCity {
  slug: string;
  displayName: string;
  country?: string;
  region?: string;
  timezone?: string;
  utcOffsetHours?: number;
  currency?: string;
  currencySymbol?: string;
  status?: string;
  mapCenter?: { lat: number; lng: number } | null;
  mapBounds?: { north: number; south: number; east: number; west: number } | null;
  defaultZoom?: number;
  defaultAreaLabel?: string | null;
  areas?: CityArea[] | null;
  eventCategories?: string[] | null;
}

function apiCityToUi(c: ApiCity): CityUiConfig | null {
  // We need at least a map center to render the [city] page. If the city is
  // pending and hasn't been auto-derived yet, skip it.
  if (!c.mapCenter || !c.mapBounds) return null;
  return {
    slug: c.slug,
    displayName: c.displayName,
    country: c.country ?? '',
    region: c.region ?? '',
    timezone: c.timezone ?? 'UTC',
    utcOffsetHours: c.utcOffsetHours ?? 0,
    currency: c.currency ?? '',
    currencySymbol: c.currencySymbol ?? c.currency ?? '',
    mapCenter: c.mapCenter,
    mapBounds: c.mapBounds,
    defaultZoom: c.defaultZoom ?? 12,
    areas: c.areas ?? [],
    defaultAreaLabel: c.defaultAreaLabel ?? `All ${c.displayName}`,
    eventCategories: c.eventCategories ?? [],
  };
}

let loadedOnce = false;

export async function loadCitiesFromApi(): Promise<void> {
  try {
    // /api/cities is a Next.js proxy route (see app/api/cities/route.ts)
    // that forwards to the backend's GET /api/cities. Using a relative URL
    // works both client-side (browser → same origin) and server-side
    // (during SSG, Next.js routes the call internally).
    const r = await fetch('/api/cities', { cache: 'no-store' });
    if (!r.ok) return;
    const j = await r.json();
    if (!j.success || !Array.isArray(j.cities)) return;
    for (const api of j.cities as ApiCity[]) {
      if (api.status !== 'active') continue;
      const ui = apiCityToUi(api);
      if (!ui) continue;
      // Mutate in place so every existing consumer (CITIES[slug],
      // ALL_CITIES.includes(), getCityConfig(slug)) sees the new entry.
      (CITIES as Record<string, CityUiConfig>)[ui.slug] = ui;
      if (!ALL_CITIES.includes(ui.slug)) ALL_CITIES.push(ui.slug);
    }
    loadedOnce = true;
  } catch (err) {
    // Static Dubai+Bangalore fallback remains in CITIES — log and move on.
    if (typeof console !== 'undefined') {
      console.warn('[cities.config] loadCitiesFromApi failed, using static fallback', err);
    }
  }
}

export function hasLoadedDynamicCities(): boolean {
  return loadedOnce;
}

/** Format a ticket price using the city's currency symbol. */
export function formatPrice(price: number | string | null | undefined, city: CitySlug | string | undefined): string | null {
  if (price == null || price === '') return null;
  const symbol = getCityConfig(city).currencySymbol;
  // Numbers render as `${symbol} ${num}`; pre-formatted strings get the symbol prepended only if missing
  if (typeof price === 'number') return `${symbol} ${price}`;
  return /^(aed|inr|₹|\$)/i.test(price) ? price : `${symbol} ${price}`;
}
