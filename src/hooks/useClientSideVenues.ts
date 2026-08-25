'use client';

import { useMemo } from 'react';
import type { Venue, HierarchicalFilterState, FilterState } from '@/types';
import { getEventCategories } from '@/lib/category-utils';
import { useVenueData } from '@/contexts/VenueDataContext';

interface UseClientSideVenuesResult {
  allVenues: Venue[];
  filteredVenues: Venue[];
  isLoading: boolean;
  error: string | null;
}

// Convert hierarchical filter state to flat filter state for filtering logic
function convertHierarchicalToFlat(hierarchicalState: HierarchicalFilterState): FilterState {
  const allActiveGenres: string[] = [];
  const allActiveVibes: string[] = [];

  // Process genres
  hierarchicalState.selectedPrimaries.genres.forEach(primary => {
    const secondaries = hierarchicalState.selectedSecondaries.genres?.[primary] || [];
    if (secondaries.length > 0) {
      // If there are selected secondaries, only include them
      allActiveGenres.push(...secondaries);
    } else {
      // If no secondaries selected, include the primary itself
      allActiveGenres.push(primary);
    }
  });

  // Process vibes
  hierarchicalState.selectedPrimaries.vibes.forEach(primary => {
    const secondaries = hierarchicalState.selectedSecondaries.vibes?.[primary] || [];
    if (secondaries.length > 0) {
      // If there are selected secondaries, only include them
      allActiveVibes.push(...secondaries);
    } else {
      // If no secondaries selected, include the primary itself
      allActiveVibes.push(primary);
    }
  });

  return {
    selectedAreas: hierarchicalState.selectedAreas,
    activeVibes: allActiveVibes,
    activeDates: hierarchicalState.activeDates,
    activeGenres: allActiveGenres,
    activeOffers: hierarchicalState.activeOffers,
    searchQuery: hierarchicalState.searchQuery
  };
}

export function useClientSideVenues(filters: HierarchicalFilterState): UseClientSideVenuesResult {
  // Use shared venue data from context — no duplicate fetches on page navigation
  const { allVenues, isLoadingVenues: isLoading, venueError: error } = useVenueData();

  // Filter venues client-side - this runs instantly
  const filteredVenues = useMemo(() => {
    if (!allVenues.length) return [];

    // Convert hierarchical state to flat state for filtering
    const flatFilters = convertHierarchicalToFlat(filters);

    // Recognise any "All <City>" sentinel as a no-op area filter. Per the
    // city config, that's "All Dubai" / "All Bangalore" / etc.
    const isAllCitySentinel = (s: string) => typeof s === 'string' && /^All\s+/i.test(s);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return allVenues.filter(venue => {
      // Always exclude past events
      if (venue.event_date) {
        const d = new Date(venue.event_date);
        if (!isNaN(d.getTime()) && d < todayStart) return false;
      }

      // Apply area filter — bypassed when any selectedArea is the "All <City>" sentinel
      if (
        flatFilters.selectedAreas?.length > 0 &&
        !flatFilters.selectedAreas.some(isAllCitySentinel)
      ) {
        const venueArea = venue.area || venue.venue_area;
        if (!venueArea) return false;

        const matchesArea = flatFilters.selectedAreas.some(selectedArea => {
          if (selectedArea === 'JBR') {
            return venueArea.toLowerCase().includes('jumeirah beach residence') ||
                   venueArea.toLowerCase().includes('jbr');
          }
          return venueArea.toLowerCase().includes(selectedArea.toLowerCase());
        });

        if (!matchesArea) return false;
      }

      // Apply genre filter using music_genre_processed primaries AND secondaries
      if (flatFilters.activeGenres?.length > 0) {
        if (!venue.music_genre_processed?.primaries) {
          console.log('🎵 FILTER - Venue excluded (no processed genres):', venue.name);
          return false;
        }

        // ANY selected genre must match (OR logic)
        const anyGenreMatches = flatFilters.activeGenres.some(selectedGenre => {
          // Check if it's a primary
          if (venue.music_genre_processed!.primaries.includes(selectedGenre)) {
            console.log('  ✅ Genre match (primary):', selectedGenre, 'in', venue.name);
            return true;
          }

          // Check if it's a secondary
          for (const [primary, secondaries] of Object.entries(venue.music_genre_processed!.secondariesByPrimary || {})) {
            if (secondaries.includes(selectedGenre)) {
              console.log('  ✅ Genre match (secondary):', selectedGenre, 'under', primary, 'in', venue.name);
              return true;
            }
          }

          console.log('  ❌ Genre no match:', selectedGenre, 'in', venue.name);
          return false;
        });

        if (!anyGenreMatches) {
          console.log('🎵 FILTER - Venue excluded (no matching genres):', venue.name, 'Primaries:', venue.music_genre_processed.primaries, 'Secondaries:', venue.music_genre_processed.secondariesByPrimary, 'Selected:', flatFilters.activeGenres);
          return false;
        }

        console.log('🎵 FILTER - Venue included:', venue.name, 'Primaries:', venue.music_genre_processed.primaries, 'Secondaries:', venue.music_genre_processed.secondariesByPrimary);
      }

      // Apply vibe filter using event_vibe_processed primaries AND secondaries
      if (flatFilters.activeVibes?.length > 0) {
        if (!venue.event_vibe_processed?.primaries) {
          console.log('🎯 FILTER - Venue excluded (no processed vibes):', venue.name);
          return false;
        }

        // ANY selected vibe must match (OR logic)
        const anyVibeMatches = flatFilters.activeVibes.some(selectedVibe => {
          // Check if it's a primary
          if (venue.event_vibe_processed!.primaries.includes(selectedVibe)) {
            return true;
          }

          // Check if it's a secondary
          for (const secondaries of Object.values(venue.event_vibe_processed!.secondariesByPrimary || {})) {
            if (secondaries.includes(selectedVibe)) {
              return true;
            }
          }

          return false;
        });

        if (!anyVibeMatches) {
          console.log('🎯 FILTER - Venue excluded (no matching vibes):', venue.name, 'Primaries:', venue.event_vibe_processed.primaries, 'Selected:', flatFilters.activeVibes);
          return false;
        }

        console.log('🎯 FILTER - Venue included:', venue.name, 'Vibe Primaries:', venue.event_vibe_processed.primaries);
      }

      // Apply date filter
      if (flatFilters.activeDates?.length > 0) {
        if (!venue.event_date) {
          console.log('🎯 FILTER - Venue excluded (no event_date):', venue.name);
          return false;
        }

        const venueDateKey = new Date(venue.event_date).toDateString();
        const matchesDate = flatFilters.activeDates.some(selectedDate => {
          // Match date regardless of time
          return venueDateKey === selectedDate;
        });

        if (!matchesDate) {
          console.log('🎯 FILTER - Venue excluded (date mismatch):', venue.name, 'Date:', venueDateKey, 'Selected:', flatFilters.activeDates);
          return false;
        }

        console.log('🎯 FILTER - Venue included (date match):', venue.name, 'Date:', venueDateKey);
      }

      // Apply search query. API rows carry `name` (venue_name is the DB-shaped
      // alias) — matching only venue_name silently matched nothing for /api/venues
      // data. Also match the event name so "brunch"-style queries work.
      if (flatFilters.searchQuery && flatFilters.searchQuery.trim()) {
        const query = flatFilters.searchQuery.toLowerCase();
        const venueName = (venue.venue_name || venue.name || '').toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventName = String((venue as any).event_name || '').toLowerCase();
        const venueCategory = venue.category?.toLowerCase() || venue.venue_category?.toLowerCase() || '';

        if (!venueName.includes(query) && !eventName.includes(query) && !venueCategory.includes(query)) {
          return false;
        }
      }

      // ===== NEW: Event Category Filtering =====
      // Apply event_categories filter (primary and secondary categories)
      if (filters.eventCategories && filters.eventCategories.selectedPrimaries.length > 0) {
        const venueCategories = getEventCategories(venue);

        if (venueCategories.length === 0) {
          console.log('🏷️ FILTER - Venue excluded (no event_categories):', venue.name);
          return false;
        }

        // Event matches if ANY of its categories match the filter (OR logic for multi-category events)
        const matchesEventCategory = venueCategories.some(cat => {
          // Check if category's primary is in selected primaries
          if (!filters.eventCategories!.selectedPrimaries.includes(cat.primary)) {
            return false;
          }

          // If no secondaries selected for this primary, primary match is enough
          const selectedSecondaries = filters.eventCategories!.selectedSecondaries[cat.primary] || [];
          if (selectedSecondaries.length === 0) {
            console.log('  ✅ Event Category match (primary only):', cat.primary, 'in', venue.name);
            return true;
          }

          // Check if category's secondary matches any selected secondary for this primary
          if (selectedSecondaries.includes(cat.secondary)) {
            console.log('  ✅ Event Category match (primary + secondary):', cat.primary, '>', cat.secondary, 'in', venue.name);
            return true;
          }

          return false;
        });

        if (!matchesEventCategory) {
          console.log('🏷️ FILTER - Venue excluded (no matching event_categories):', venue.name, 'Categories:', venueCategories, 'Selected:', filters.eventCategories);
          return false;
        }

        console.log('🏷️ FILTER - Venue included:', venue.name, 'Categories:', venueCategories);
      }

      // ===== NEW: Attribute Filtering =====
      // Apply attributes filter (venue, energy, timing, status)
      if (filters.attributes) {
        // Check venue attribute
        if (filters.attributes.venue.length > 0) {
          if (!venue.attributes?.venue || venue.attributes.venue.length === 0) {
            console.log('🏢 FILTER - Venue excluded (no venue attributes):', venue.name);
            return false;
          }

          const matchesVenueAttr = filters.attributes.venue.some(selectedVenue =>
            venue.attributes!.venue.includes(selectedVenue)
          );

          if (!matchesVenueAttr) {
            console.log('🏢 FILTER - Venue excluded (venue attribute mismatch):', venue.name, 'Has:', venue.attributes.venue, 'Need:', filters.attributes.venue);
            return false;
          }
        }

        // Check energy attribute
        if (filters.attributes.energy.length > 0) {
          if (!venue.attributes?.energy || venue.attributes.energy.length === 0) {
            console.log('⚡ FILTER - Venue excluded (no energy attributes):', venue.name);
            return false;
          }

          const matchesEnergyAttr = filters.attributes.energy.some(selectedEnergy =>
            venue.attributes!.energy.includes(selectedEnergy)
          );

          if (!matchesEnergyAttr) {
            console.log('⚡ FILTER - Venue excluded (energy attribute mismatch):', venue.name);
            return false;
          }
        }

        // Check timing attribute
        if (filters.attributes.timing.length > 0) {
          if (!venue.attributes?.timing || venue.attributes.timing.length === 0) {
            console.log('🕐 FILTER - Venue excluded (no timing attributes):', venue.name);
            return false;
          }

          const matchesTimingAttr = filters.attributes.timing.some(selectedTiming =>
            venue.attributes!.timing.includes(selectedTiming)
          );

          if (!matchesTimingAttr) {
            console.log('🕐 FILTER - Venue excluded (timing attribute mismatch):', venue.name);
            return false;
          }
        }

        // Check status attribute
        if (filters.attributes.status.length > 0) {
          if (!venue.attributes?.status || venue.attributes.status.length === 0) {
            console.log('🎫 FILTER - Venue excluded (no status attributes):', venue.name);
            return false;
          }

          const matchesStatusAttr = filters.attributes.status.some(selectedStatus =>
            venue.attributes!.status.includes(selectedStatus)
          );

          if (!matchesStatusAttr) {
            console.log('🎫 FILTER - Venue excluded (status attribute mismatch):', venue.name);
            return false;
          }
        }
      }

      // ===== NEW: Rating Filter =====
      // Apply minimum rating filter
      if (filters.selectedRatings && filters.selectedRatings.length > 0) {
        if (!venue.rating || venue.rating === 0) {
          console.log('⭐ FILTER - Venue excluded (no rating):', venue.name);
          return false;
        }

        // Venue must meet at least one of the selected minimum ratings
        const meetsRatingRequirement = filters.selectedRatings.some(minRating =>
          venue.rating! >= minRating
        );

        if (!meetsRatingRequirement) {
          console.log('⭐ FILTER - Venue excluded (rating too low):', venue.name, 'Has:', venue.rating, 'Need:', filters.selectedRatings);
          return false;
        }

        console.log('⭐ FILTER - Venue included (meets rating):', venue.name, 'Rating:', venue.rating);
      }

      // ===== NEW: Venue Category Filter =====
      // Apply venue category filter
      if (filters.selectedVenueCategories && filters.selectedVenueCategories.length > 0) {
        const venueCategory = venue.category || venue.venue_category;
        if (!venueCategory) {
          console.log('🏢 FILTER - Venue excluded (no category):', venue.name);
          return false;
        }

        // Check if venue's category matches any selected category
        const matchesCategory = filters.selectedVenueCategories.some(selectedCat =>
          venueCategory.toLowerCase().includes(selectedCat.toLowerCase())
        );

        if (!matchesCategory) {
          console.log('🏢 FILTER - Venue excluded (category mismatch):', venue.name, 'Has:', venueCategory, 'Need:', filters.selectedVenueCategories);
          return false;
        }

        console.log('🏢 FILTER - Venue included (category match):', venue.name, 'Category:', venueCategory);
      }

      // ===== NEW: Special Offers Filter =====
      // Apply special offers filter (Note: special_offers is on events, not venues in current schema)
      // This would require fetching event data for each venue to filter properly
      // For now, we'll skip this as it requires event data which isn't in the venue response
      if (flatFilters.activeOffers && flatFilters.activeOffers.length > 0) {
        console.log('🎁 FILTER - Special offers filter not yet implemented for venues');
        // TODO: Implement when event data is available with venues
      }

      // ===== NEW: Event Time Filter =====
      // Apply event time filter (categorized: Morning/Afternoon/Evening/Night)
      if (filters.selectedTimes && filters.selectedTimes.length > 0) {
        const venueTime = (venue as any).event_time;
        if (!venueTime) {
          console.log('🕐 FILTER - Venue excluded (no event_time):', venue.name);
          return false;
        }

        // Categorize the venue's time
        const categorizeTime = (timeStr: string): string[] => {
          if (!timeStr) return [];

          const categories: Set<string> = new Set();
          const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi;
          const matches = Array.from(timeStr.matchAll(timePattern));

          if (matches.length === 0) return [];

          const to24Hour = (hour: number, minute: number, period: string): number => {
            let h = hour;
            if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
            if (period.toUpperCase() === 'AM' && h === 12) h = 0;
            return h + minute / 60;
          };

          if (matches.length >= 1) {
            const startHour = parseInt(matches[0][1]);
            const startMin = parseInt(matches[0][2]);
            const startPeriod = matches[0][3];
            const startTime = to24Hour(startHour, startMin, startPeriod);

            let endTime = startTime + 3;
            if (matches.length >= 2) {
              const endHour = parseInt(matches[1][1]);
              const endMin = parseInt(matches[1][2]);
              const endPeriod = matches[1][3];
              endTime = to24Hour(endHour, endMin, endPeriod);
              if (endTime < startTime) endTime += 24;
            }

            for (let t = startTime; t < endTime; t += 0.5) {
              const hour = t % 24;
              if (hour >= 6 && hour < 12) categories.add('Morning');
              else if (hour >= 12 && hour < 18) categories.add('Afternoon');
              else if (hour >= 18 && hour < 22) categories.add('Evening');
              else categories.add('Night');
            }
          }

          return Array.from(categories);
        };

        const venueCategories = categorizeTime(venueTime);
        const matchesTime = filters.selectedTimes.some(selectedCategory =>
          venueCategories.includes(selectedCategory)
        );

        if (!matchesTime) {
          console.log('🕐 FILTER - Venue excluded (time category mismatch):', venue.name, 'Has categories:', venueCategories, 'Need:', filters.selectedTimes);
          return false;
        }

        console.log('🕐 FILTER - Venue included (time category match):', venue.name, 'Categories:', venueCategories);
      }

      // ===== NEW: Ticket Price Filter (AED) =====
      // Apply ticket price range filter
      if (filters.selectedTicketPrices && filters.selectedTicketPrices.length > 0) {
        const ticketPrice = (venue as any).ticket_price;

        const matchesPriceRange = filters.selectedTicketPrices.some(range => {
          if (range === 'Free') return ticketPrice === 0 || ticketPrice === null;
          if (range === 'AED 0-50') return ticketPrice >= 0 && ticketPrice <= 50;
          if (range === 'AED 50-100') return ticketPrice > 50 && ticketPrice <= 100;
          if (range === 'AED 100-200') return ticketPrice > 100 && ticketPrice <= 200;
          if (range === 'AED 200+') return ticketPrice > 200;
          return false;
        });

        if (!matchesPriceRange) {
          console.log('💰 FILTER - Venue excluded (ticket price mismatch):', venue.name, 'Price:', ticketPrice);
          return false;
        }

        console.log('💰 FILTER - Venue included (ticket price match):', venue.name, 'Price:', ticketPrice);
      }

      // ===== NEW: Venue Price Filter (Exact DB Values) =====
      // Apply venue price filter - matches exact values from database
      if (filters.selectedVenuePrices && filters.selectedVenuePrices.length > 0) {
        const venuePrice = (venue as any).venue_price;

        if (!venuePrice) {
          console.log('💵 FILTER - Venue excluded (no venue_price):', venue.name);
          return false;
        }

        // Match exact string values from database
        const matchesPrice = filters.selectedVenuePrices.some(selectedPrice =>
          venuePrice.toString().trim() === selectedPrice.toString().trim()
        );

        if (!matchesPrice) {
          console.log('💵 FILTER - Venue excluded (venue price mismatch):', venue.name, 'Has:', venuePrice, 'Need:', filters.selectedVenuePrices);
          return false;
        }

        console.log('💵 FILTER - Venue included (venue price match):', venue.name, 'Price:', venuePrice);
      }

      // ===== NEW: Atmosphere Filter =====
      // Apply atmosphere filter (using attributes.energy and attributes.venue)
      if (filters.selectedAtmospheres && filters.selectedAtmospheres.length > 0) {
        if (!venue.attributes) {
          console.log('🌟 FILTER - Venue excluded (no attributes):', venue.name);
          return false;
        }

        const venueAtmospheres = [
          ...(venue.attributes.energy || []),
          ...(venue.attributes.venue || [])
        ];

        if (venueAtmospheres.length === 0) {
          console.log('🌟 FILTER - Venue excluded (no atmosphere attributes):', venue.name);
          return false;
        }

        const matchesAtmosphere = filters.selectedAtmospheres.some(selectedAtmosphere =>
          venueAtmospheres.includes(selectedAtmosphere)
        );

        if (!matchesAtmosphere) {
          console.log('🌟 FILTER - Venue excluded (atmosphere mismatch):', venue.name, 'Has:', venueAtmospheres, 'Need:', filters.selectedAtmospheres);
          return false;
        }

        console.log('🌟 FILTER - Venue included (atmosphere match):', venue.name, 'Atmospheres:', venueAtmospheres);
      }

      // ===== NEW: Event Categories Filter =====
      // Apply event categories filter (primary categories only)
      if (filters.selectedEventCategories && filters.selectedEventCategories.length > 0) {
        if (!venue.event_categories || venue.event_categories.length === 0) {
          console.log('📂 FILTER - Venue excluded (no event_categories):', venue.name);
          return false;
        }

        const venueCategoryPrimaries = venue.event_categories.map(cat => cat.primary);

        const matchesCategory = filters.selectedEventCategories.some(selectedCategory =>
          venueCategoryPrimaries.includes(selectedCategory)
        );

        if (!matchesCategory) {
          console.log('📂 FILTER - Venue excluded (event category mismatch):', venue.name, 'Has:', venueCategoryPrimaries, 'Need:', filters.selectedEventCategories);
          return false;
        }

        console.log('📂 FILTER - Venue included (event category match):', venue.name, 'Categories:', venueCategoryPrimaries);
      }

      return true;
    });
  }, [allVenues, filters]);

  return {
    allVenues,
    filteredVenues,
    isLoading,
    error
  };
}