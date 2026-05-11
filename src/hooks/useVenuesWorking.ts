'use client';

import { useState, useEffect, useRef } from 'react';
import type { Venue, FilterState } from '@/types';
import { hasAllCitySentinel } from '@/lib/city-helpers';

export function useVenuesWorking(filters?: FilterState) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    async function loadVenues() {
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
          searchParams.set('dates', filters.activeDates.join('|'));
        }
        if (filters?.activeGenres?.length) {
          searchParams.set('genres', filters.activeGenres.join(','));
        }
        if (filters?.activeOffers?.length) {
          searchParams.set('offers', filters.activeOffers.join(','));
        }
        
        const url = `/api/venues?${searchParams.toString()}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          signal: abortController.signal,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (abortController.signal.aborted) {
          return; // Request was cancelled
        }
        
        if (result.success && Array.isArray(result.data)) {
          setVenues(result.data);
          setError(null);
        } else {
          setError(result.error || 'Invalid response format');
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Request was cancelled, ignore error
        }
        
        if (!abortController.signal.aborted) {
          const errorMsg = err instanceof Error ? err.message : 'Network error occurred';
          setError(errorMsg);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadVenues();

    return () => {
      abortController.abort();
    };
  }, [
    filters?.selectedAreas?.join('|') || '',
    filters?.activeVibes?.join('|') || '',
    filters?.activeDates?.join('|') || '',
    filters?.activeGenres?.join('|') || '',
    filters?.activeOffers?.join('|') || ''
  ]);

  return { venues, isLoading, error };
}