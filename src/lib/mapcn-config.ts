import type { LngLatBoundsLike } from 'maplibre-gl';

// MapLibre uses [lng, lat] order (opposite of Google Maps {lat, lng})
export const MAPCN_CENTER: [number, number] = [55.2708, 25.2048];
export const MAPCN_ZOOM = 12;
export const MAPCN_MIN_ZOOM = 10;
export const MAPCN_MAX_ZOOM = 18;

// Dubai bounds in MapLibre format: [[west, south], [east, north]]
export const MAPCN_BOUNDS: LngLatBoundsLike = [
  [54.8, 24.8],
  [55.6, 25.4],
];
