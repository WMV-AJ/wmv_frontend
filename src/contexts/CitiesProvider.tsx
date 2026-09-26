'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { loadCitiesFromApi, hasLoadedDynamicCities } from '@/config/cities.config';

// Bumped when the dynamic city load resolves. Re-rendering this provider
// alone does NOT re-render its descendants — `children` is the same element
// React already rendered, so it bails out — which left pages built from
// ALL_CITIES (e.g. the home city picker) stuck on the static Dubai +
// Bangalore seed whenever /api/cities resolved after their last render.
// Components that list cities call useCitiesVersion() to subscribe.
const CitiesVersionContext = createContext(0);

export function useCitiesVersion(): number {
  return useContext(CitiesVersionContext);
}

/**
 * Top-level provider that runs the DB-backed city loader once on the
 * client. After mount, `CITIES` + `ALL_CITIES` from cities.config.ts
 * include every active city in the backend's city_config table — newly
 * onboarded cities (e.g. Mumbai) appear without a code change.
 *
 * Failure is silent — the static Dubai+Bangalore fallback in
 * cities.config.ts keeps the app rendering even if /api/cities is down.
 *
 * Publishes a version bump once the dynamic load resolves (see
 * useCitiesVersion below), so callers of `getCityConfig(slug)` for slugs that weren't in
 * the static seed (e.g. Mumbai) pick up the real config instead of the
 * DEFAULT_CITY fallback that was returned on the SSR / first-paint pass.
 * Without this, the Mumbai /map page would init MapLibre at Dubai's
 * coords because `getCityConfig('mumbai')` returned Dubai's entry on
 * first read, and React would have nothing to invalidate later.
 */
export function CitiesProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (hasLoadedDynamicCities()) return;
    loadCitiesFromApi().then(() => {
      setVersion(v => v + 1);
    });
  }, []);

  return <CitiesVersionContext.Provider value={version}>{children}</CitiesVersionContext.Provider>;
}
