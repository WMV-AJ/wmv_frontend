import type { LngLatBoundsLike } from 'maplibre-gl';
import { getCityConfig, type CitySlug } from '@/config/cities.config';

// MapLibre uses [lng, lat] order (opposite of Google Maps {lat, lng}).

/** Default zoom — same for every city for now. */
export const MAPCN_ZOOM = 12;
export const MAPCN_MIN_ZOOM = 10;
export const MAPCN_MAX_ZOOM = 18;

/**
 * Per-city map center, in MapLibre [lng, lat] order. Reads from the canonical
 * city config — Dubai stays at 55.27, 25.20; Bangalore at 77.59, 12.97.
 */
export function getMapCenter(city: CitySlug | string): [number, number] {
  const c = getCityConfig(city).mapCenter;
  return [c.lng, c.lat];
}

/**
 * Per-city map bounds in MapLibre format: [[west, south], [east, north]].
 */
export function getMapBounds(city: CitySlug | string): LngLatBoundsLike {
  const b = getCityConfig(city).mapBounds;
  return [
    [b.west, b.south],
    [b.east, b.north],
  ];
}

/**
 * @deprecated Use `getMapCenter(city)` — kept for back-compat with callers
 * that haven't been migrated yet. Returns the Dubai value.
 */
export const MAPCN_CENTER: [number, number] = getMapCenter('dubai');

/**
 * @deprecated Use `getMapBounds(city)`. Returns Dubai bounds.
 */
export const MAPCN_BOUNDS: LngLatBoundsLike = getMapBounds('dubai');
