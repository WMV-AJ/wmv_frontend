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

export type CitySlug = 'dubai' | 'bangalore';

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

/** Format a ticket price using the city's currency symbol. */
export function formatPrice(price: number | string | null | undefined, city: CitySlug | string | undefined): string | null {
  if (price == null || price === '') return null;
  const symbol = getCityConfig(city).currencySymbol;
  // Numbers render as `${symbol} ${num}`; pre-formatted strings get the symbol prepended only if missing
  if (typeof price === 'number') return `${symbol} ${price}`;
  return /^(aed|inr|₹|\$)/i.test(price) ? price : `${symbol} ${price}`;
}
