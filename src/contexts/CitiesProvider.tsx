'use client';

import { useEffect } from 'react';
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
 * This is purely a side-effect provider; no context value is exposed.
 * Components that need to enumerate cities can import `ALL_CITIES`
 * directly from cities.config.ts as they already do.
 */
export function CitiesProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!hasLoadedDynamicCities()) {
      loadCitiesFromApi();
    }
  }, []);
  return <>{children}</>;
}
