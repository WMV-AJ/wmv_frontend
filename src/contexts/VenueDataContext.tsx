'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { Venue, FilterOptions } from '@/types';
import { DEFAULT_CITY, isValidCity, type CitySlug } from '@/config/cities.config';

interface VenueDataContextType {
  city: CitySlug;
  allVenues: Venue[];
  filterOptions: FilterOptions;
  isLoadingVenues: boolean;
  isLoadingFilters: boolean;
  venueError: string | null;
  filterError: string | null;
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
});

export function useVenueData() {
  return useContext(VenueDataContext);
}

/** Pull the city slug out of the URL: `/dubai/...` → `dubai`. */
function extractCityFromPath(pathname: string | null): CitySlug {
  if (!pathname) return DEFAULT_CITY;
  const firstSegment = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  return isValidCity(firstSegment) ? firstSegment : DEFAULT_CITY;
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

  // Re-fetch when the city slug in the URL changes.
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setIsLoadingVenues(true);
        setVenueError(null);

        const response = await fetch(`/api/venues?city=${encodeURIComponent(city)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setAllVenues(result.data);
        } else {
          setVenueError(result.error || 'Invalid response format');
        }
      } catch (err) {
        setVenueError(err instanceof Error ? err.message : 'Network error occurred');
        console.error('Error fetching venues:', err);
      } finally {
        setIsLoadingVenues(false);
      }
    };

    fetchVenues();
  }, [city]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setIsLoadingFilters(true);
        setFilterError(null);

        const response = await fetch(`/api/filter-options?city=${encodeURIComponent(city)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setFilterOptions(result.data);
        } else {
          setFilterError(result.error || 'Invalid response format');
        }
      } catch (err) {
        setFilterError(err instanceof Error ? err.message : 'Network error occurred');
        console.error('Error fetching filter options:', err);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    fetchFilterOptions();
  }, [city]);

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
      }}
    >
      {children}
    </VenueDataContext.Provider>
  );
}
