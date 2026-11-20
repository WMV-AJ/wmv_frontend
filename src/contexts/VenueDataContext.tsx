'use client';

import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { Venue, FilterOptions } from '@/types';
import { DEFAULT_CITY, type CitySlug } from '@/config/cities.config';

interface VenueDataContextType {
  city: CitySlug;
  allVenues: Venue[];
  filterOptions: FilterOptions;
  isLoadingVenues: boolean;
  isLoadingFilters: boolean;
  venueError: string | null;
  filterError: string | null;
  /** Load the city's events and filter options again (the Retry button). */
  refetch: () => void;
}

const defaultFilterOptions: FilterOptions = {
  areas: [],
  dates: [],
  hierarchicalGenres: {},
  hierarchicalVibes: {},
  vibes: [],
  genres: [],
  venueCategories: [],
  specialOffers: [],
  times: [],
  ticketPrices: [],
  venuePrices: [],
  atmospheres: [],
  eventCategories: []
};

const VenueDataContext = createContext<VenueDataContextType>({
  city: DEFAULT_CITY,
  allVenues: [],
  filterOptions: defaultFilterOptions,
  isLoadingVenues: true,
  isLoadingFilters: true,
  venueError: null,
  filterError: null,
  refetch: () => {},
});

export function useVenueData() {
  return useContext(VenueDataContext);
}

/**
 * Top-level paths that are not cities. Keep in step with PASSTHROUGH in
 * src/middleware.ts.
 */
const NON_CITY_SEGMENTS = new Set([
  'auth', 'api', '_next', 'how-it-works', 'home3', 'home4', 'faq', 'list-your-venue', 'privacy',
  'data-deletion', 'terms', 'monitoring',
]);

/**
 * Pull the city slug out of the URL: `/mumbai/...` → `mumbai`.
 *
 * The segment is trusted as it stands. The middleware has already redirected
 * every path whose first segment is not a real city, and the list of cities
 * known to the browser is incomplete until /api/cities answers. Checking
 * against that list sent a direct visit to /mumbai off to load Dubai's events.
 */
function extractCityFromPath(pathname: string | null): CitySlug {
  if (!pathname) return DEFAULT_CITY;
  const firstSegment = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  if (!firstSegment || NON_CITY_SEGMENTS.has(firstSegment) || firstSegment.includes('.')) return DEFAULT_CITY;
  return firstSegment;
}

/**
 * fetch with up to 2 retries on 5xx/network failure (500ms, 1500ms backoff).
 * A transient upstream blip used to surface as a hard error state (empty map,
 * no cards) for the whole session; a single retry almost always recovers it.
 * 4xx responses are returned as-is — retrying a client error is pointless.
 */
async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  const delays = [500, 1500];
  let lastError: unknown;

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      lastError = new Error(`HTTP error! status: ${response.status}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < delays.length) {
      await new Promise(resolve => setTimeout(resolve, delays[attempt]));
    }
  }
  throw lastError;
}

export function VenueDataProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const city = extractCityFromPath(pathname);

  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultFilterOptions);
  const [isLoadingVenues, setIsLoadingVenues] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [venueError, setVenueError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);

  // Bumped by refetch() to run both loads again.
  const [attempt, setAttempt] = useState(0);
  const refetch = useCallback(() => setAttempt((n) => n + 1), []);

  // Re-fetch when the city slug in the URL changes. A response is applied only
  // if its request is still the current one, so a slow answer for the city just
  // left can never overwrite the city now on screen.
  useEffect(() => {
    let cancelled = false;
    setAllVenues([]);
    setIsLoadingVenues(true);
    setVenueError(null);

    (async () => {
      try {
        const response = await fetchWithRetry(`/api/venues?city=${encodeURIComponent(city)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (cancelled) return;
        if (result.success && result.data) setAllVenues(result.data);
        else setVenueError(result.error || 'Invalid response format');
      } catch (err) {
        if (cancelled) return;
        setVenueError(err instanceof Error ? err.message : 'Network error occurred');
        console.error('Error fetching venues:', err);
      } finally {
        if (!cancelled) setIsLoadingVenues(false);
      }
    })();

    return () => { cancelled = true; };
  }, [city, attempt]);

  useEffect(() => {
    let cancelled = false;
    setFilterOptions(defaultFilterOptions);
    setIsLoadingFilters(true);
    setFilterError(null);

    (async () => {
      try {
        const response = await fetchWithRetry(`/api/filter-options?city=${encodeURIComponent(city)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (cancelled) return;
        if (result.success && result.data) setFilterOptions(result.data);
        else setFilterError(result.error || 'Invalid response format');
      } catch (err) {
        if (cancelled) return;
        setFilterError(err instanceof Error ? err.message : 'Network error occurred');
        console.error('Error fetching filter options:', err);
      } finally {
        if (!cancelled) setIsLoadingFilters(false);
      }
    })();

    return () => { cancelled = true; };
  }, [city, attempt]);

  return (
    <VenueDataContext.Provider
      value={{
        city,
        allVenues,
        filterOptions,
        isLoadingVenues,
        isLoadingFilters,
        venueError,
        filterError,
        refetch,
      }}
    >
      {children}
    </VenueDataContext.Provider>
  );
}
