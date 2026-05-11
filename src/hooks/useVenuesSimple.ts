'use client';

import { useState, useEffect } from 'react';
import type { Venue, FilterState } from '@/types';
import { hasAllCitySentinel } from '@/lib/city-helpers';

export function useVenuesSimple(filters?: FilterState) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    async function loadVenues() {
      console.log('🔧 SIMPLE HOOK - Starting to load venues');
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Build query parameters
        const searchParams = new URLSearchParams();
        searchParams.set('t', Date.now().toString());
        
        if (filters?.selectedAreas?.length && !hasAllCitySentinel(filters.selectedAreas)) {
          searchParams.set('areas', filters.selectedAreas.join(','));
        }
        if (filters?.activeVibes?.length) {
          searchParams.set('vibes', filters.activeVibes.join(','));
        }
        if (filters?.activeDates?.length) {
          searchParams.set('dates', filters.activeDates.join(','));
        }
        if (filters?.activeGenres?.length) {
          searchParams.set('genres', filters.activeGenres.join(','));
        }
        if (filters?.activeOffers?.length) {
          searchParams.set('offers', filters.activeOffers.join(','));
        }
        
        const url = `/api/venues?${searchParams.toString()}`;
        console.log('🔧 SIMPLE HOOK - Fetching URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('🔧 SIMPLE HOOK - Response:', result.success, 'venues:', result.data?.length || 0);
        
        if (!cancelled && result.success && Array.isArray(result.data)) {
          setVenues(result.data);
          setError(null);
          console.log('🔧 SIMPLE HOOK - Venues set successfully:', result.data.length);
        } else if (!cancelled) {
          const errorMsg = result.error || 'Invalid response format';
          setError(errorMsg);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMsg = err instanceof Error ? err.message : 'Network error occurred';
          setError(errorMsg);
          console.error('🔧 SIMPLE HOOK - Error:', errorMsg);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          console.log('🔧 SIMPLE HOOK - Loading complete');
        }
      }
    }

    loadVenues();
    
    return () => {
      cancelled = true;
    };
  }, [
    filters?.selectedAreas?.join(','),
    filters?.activeVibes?.join(','), 
    filters?.activeDates?.join(','),
    filters?.activeGenres?.join(','),
    filters?.activeOffers?.join(',')
  ]);

  console.log('🔧 SIMPLE HOOK - Current state:', { venues: venues.length, isLoading, error: !!error });
  
  return { venues, isLoading, error };
}