'use client';

import { useEffect, useState } from 'react';
import { loadCitiesFromApi, hasLoadedDynamicCities } from '@/config/cities.config';

/**
 * Top-level provider that runs the DB-backed city loader once on the
 * client. After mount, `CITIES` + `ALL_CITIES` from cities.config.ts
 * include every active city in the backend's city_config table — newly
 * onboarded cities (e.g. Mumbai) appear without a code change.
 *
 * Failure is silent — the static Dubai+Bangalore fallback in
 * cities.config.ts keeps the app rendering even if /api/cities is down.
 *
 * Forces a single re-render of its descendants once the dynamic load
 * resolves, so callers of `getCityConfig(slug)` for slugs that weren't in
 * the static seed (e.g. Mumbai) pick up the real config instead of the
 * DEFAULT_CITY fallback that was returned on the SSR / first-paint pass.
 * Without this, the Mumbai /map page would init MapLibre at Dubai's
 * coords because `getCityConfig('mumbai')` returned Dubai's entry on
 * first read, and React would have nothing to invalidate later.
 */
export function CitiesProvider({ children }: { children: React.ReactNode }) {
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (hasLoadedDynamicCities()) return;
    loadCitiesFromApi().then(() => {
      setVersion(v => v + 1);
    });
  }, []);

  return <>{children}</>;
}
