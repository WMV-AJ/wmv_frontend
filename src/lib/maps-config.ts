// Google Maps Mobile Configuration — multi-city aware.

import { RETRO_MAP_STYLE, type LatLng } from '@/types';
import { getCityConfig, DEFAULT_CITY, type CitySlug } from '@/config/cities.config';

// Google Maps API Configuration
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!apiKey && process.env.NODE_ENV === 'development') {
  console.error('❌ CRITICAL: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined!');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC')));
}

/**
 * Google Maps loader config. `region` is now city-aware — it biases geocoding /
 * autocomplete results toward the right country. Use `getGoogleMapsConfig(city)`
 * when initializing the loader from a city-scoped page.
 */
export function getGoogleMapsConfig(city: CitySlug | string = DEFAULT_CITY) {
  return {
    apiKey: apiKey || '',
    libraries: ['places', 'geometry'] as never[],
    language: 'en',
    region: getCityConfig(city).region,
  };
}

// Backwards-compatible default — points at Dubai. Prefer `getGoogleMapsConfig(city)`.
export const GOOGLE_MAPS_CONFIG = getGoogleMapsConfig('dubai');

/** @deprecated — read from `getCityConfig(city).mapBounds`. */
export const DUBAI_BOUNDS = getCityConfig('dubai').mapBounds;

/**
 * Map options factory. Pass the city slug from your page (extracted via
 * `useParams()`) so the map centers / restricts on the right city.
 */
export const getMapOptions = (city: CitySlug | string = DEFAULT_CITY): google.maps.MapOptions => {
  const cfg = getCityConfig(city);
  return {
    center: cfg.mapCenter,
    zoom: cfg.defaultZoom,
    styles: RETRO_MAP_STYLE,
    disableDefaultUI: true,
    gestureHandling: 'greedy', // Mobile-optimized: allows single-finger map interaction
    mapTypeId: 'roadmap',
    clickableIcons: false,
    maxZoom: 18,
    minZoom: 10,
    restriction: {
      latLngBounds: cfg.mapBounds,
      strictBounds: false,
    },
    ...(typeof google !== 'undefined' && google.maps ? {
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
      streetViewControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
    } : {}),
  };
};

// Backwards-compatible default — points at Dubai. Prefer `getMapOptions(city)`.
export const MAP_OPTIONS = getMapOptions('dubai');

// Custom Map Controls Configuration
export const MAP_CONTROLS = {
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  rotateControl: false,
  scaleControl: true,
};

// Clustering functionality removed - using individual markers only

// Utility Functions
export const createLatLng = (lat: number, lng: number): google.maps.LatLng | null => {
  if (typeof google !== 'undefined' && google.maps) {
    return new google.maps.LatLng(lat, lng);
  }
  return null;
};

export const createBounds = (venues: { lat: number; lng: number }[]): google.maps.LatLngBounds | null => {
  if (typeof google !== 'undefined' && google.maps) {
    const bounds = new google.maps.LatLngBounds();
    venues.forEach(venue => {
      const latLng = createLatLng(venue.lat, venue.lng);
      if (latLng) bounds.extend(latLng);
    });
    return bounds;
  }
  return null;
};

export const calculateDistance = (point1: LatLng, point2: LatLng): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

/** @deprecated — use `isPointInCity(point, citySlug)`. */
export const isPointInDubai = (point: LatLng): boolean => isPointInCity(point, 'dubai');

export const isPointInCity = (point: LatLng, city: CitySlug | string): boolean => {
  const b = getCityConfig(city).mapBounds;
  return point.lat >= b.south && point.lat <= b.north && point.lng >= b.west && point.lng <= b.east;
};

// Map Event Handlers
export const handleMapIdle = (map: google.maps.Map, callback?: () => void) => {
  const listener = map.addListener('idle', () => {
    callback?.();
  });
  return listener;
};

export const handleMapBoundsChanged = (
  map: google.maps.Map, 
  callback: (bounds: google.maps.LatLngBounds) => void
) => {
  const listener = map.addListener('bounds_changed', () => {
    const bounds = map.getBounds();
    if (bounds) {
      callback(bounds);
    }
  });
  return listener;
};

export const handleMapZoomChanged = (
  map: google.maps.Map, 
  callback: (zoom: number) => void
) => {
  const listener = map.addListener('zoom_changed', () => {
    const zoom = map.getZoom();
    if (zoom !== undefined) {
      callback(zoom);
    }
  });
  return listener;
};

// Marker options factory function for different venue states
export const createCustomMarker = (hasStories: boolean, isSelected: boolean) => {
  if (typeof window === 'undefined' || !window.google?.maps) {
    // Return null for SSR/pre-load
    return null;
  }

  if (isSelected) {
    return {
      url: `data:image/svg+xml;base64,${btoa(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#ff006e" stroke="#d00060" stroke-width="4"/>
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16)
    };
  } else if (hasStories) {
    return {
      url: `data:image/svg+xml;base64,${btoa(`
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#D4AF37" stroke="#B8860B" stroke-width="2"/>
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(24, 24),
      anchor: new google.maps.Point(12, 12)
    };
  } else {
    return {
      url: `data:image/svg+xml;base64,${btoa(`
        <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="6" fill="#64748b" stroke="#334155" stroke-width="2"/>
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(16, 16),
      anchor: new google.maps.Point(8, 8)
    };
  }
};