import type { HierarchicalFilterState } from '@/types';
import { COLOR_HEX_MAP, getCategoryColor, getHexColor } from '@/lib/category-mappings';
import { hasAllCitySentinel } from '@/lib/city-helpers';

export interface FilterColorScheme {
  hexColor: string;
  colorName: string;
  hasActiveFilter: boolean;
}

/**
 * Determine if any filters are active (excluding "All Dubai")
 */
function hasActiveFilters(filters: HierarchicalFilterState): boolean {
  return (
    // Event categories filter
    (filters.eventCategories?.selectedPrimaries &&
     filters.eventCategories.selectedPrimaries.length > 0) ||
    // Vibes filter (primaries or secondaries)
    (filters.selectedPrimaries?.vibes &&
     filters.selectedPrimaries.vibes.length > 0) ||
    (filters.selectedSecondaries?.vibes &&
     Object.keys(filters.selectedSecondaries.vibes).length > 0) ||
    // Genres filter (primaries or secondaries)
    (filters.selectedPrimaries?.genres &&
     filters.selectedPrimaries.genres.length > 0) ||
    (filters.selectedSecondaries?.genres &&
     Object.keys(filters.selectedSecondaries.genres).length > 0) ||
    // Areas filter (excluding "All Dubai")
    (filters.selectedAreas &&
     filters.selectedAreas.length > 0 &&
     !hasAllCitySentinel(filters.selectedAreas)) ||
    // Offers filter
    (filters.activeOffers && filters.activeOffers.length > 0) ||
    // Attributes filters
    (filters.attributes?.venue && filters.attributes.venue.length > 0) ||
    (filters.attributes?.energy && filters.attributes.energy.length > 0) ||
    (filters.attributes?.timing && filters.attributes.timing.length > 0) ||
    (filters.attributes?.status && filters.attributes.status.length > 0)
  );
}

/**
 * Get active filter color scheme based on priority:
 * Event Categories > Vibes > Genres > Attributes > Areas > Offers
 */
export function getActiveFilterColorScheme(
  filters: HierarchicalFilterState
): FilterColorScheme {
  // Priority 1: Event Categories
  if (filters.eventCategories?.selectedPrimaries &&
      filters.eventCategories.selectedPrimaries.length > 0) {
    const firstCategory = filters.eventCategories.selectedPrimaries[0];
    const colorName = getCategoryColor(firstCategory);
    return {
      hexColor: getHexColor(colorName),
      colorName,
      hasActiveFilter: true
    };
  }

  // Priority 2: Vibes (hierarchical)
  if (filters.selectedPrimaries?.vibes && filters.selectedPrimaries.vibes.length > 0) {
    return {
      hexColor: COLOR_HEX_MAP.purple,
      colorName: 'purple',
      hasActiveFilter: true
    };
  }

  // Check secondaries for vibes
  if (filters.selectedSecondaries?.vibes &&
      Object.keys(filters.selectedSecondaries.vibes).length > 0) {
    return {
      hexColor: COLOR_HEX_MAP.purple,
      colorName: 'purple',
      hasActiveFilter: true
    };
  }

  // Priority 3: Genres (hierarchical)
  if (filters.selectedPrimaries?.genres && filters.selectedPrimaries.genres.length > 0) {
    return {
      hexColor: COLOR_HEX_MAP.orange,
      colorName: 'orange',
      hasActiveFilter: true
    };
  }

  // Check secondaries for genres
  if (filters.selectedSecondaries?.genres &&
      Object.keys(filters.selectedSecondaries.genres).length > 0) {
    return {
      hexColor: COLOR_HEX_MAP.orange,
      colorName: 'orange',
      hasActiveFilter: true
    };
  }

  // Priority 4: Attributes (venue, energy, timing, status)
  if (filters.attributes?.venue && filters.attributes.venue.length > 0) {
    return {
      hexColor: COLOR_HEX_MAP.blue,
      colorName: 'blue',
      hasActiveFilter: true
    };
  }

  if (filters.attributes?.energy && filters.attributes.energy.length > 0) {
    return {
      hexColor: COLOR_HEX_MAP.orange,
      colorName: 'orange',
      hasActiveFilter: true
    };
  }

  if (filters.attributes?.timing && filters.attributes.timing.length > 0) {
    return {
      hexColor: COLOR_HEX_MAP.teal,
      colorName: 'teal',
      hasActiveFilter: true
    };
  }

  if (filters.attributes?.status && filters.attributes.status.length > 0) {
    return {
      hexColor: COLOR_HEX_MAP.pink,
      colorName: 'pink',
      hasActiveFilter: true
    };
  }

  // Priority 5: Areas
  if (filters.selectedAreas &&
      filters.selectedAreas.length > 0 &&
      !hasAllCitySentinel(filters.selectedAreas)) {
    return {
      hexColor: COLOR_HEX_MAP.blue,
      colorName: 'blue',
      hasActiveFilter: true
    };
  }

  // Priority 6: Offers
  if (filters.activeOffers && filters.activeOffers.length > 0) {
    return {
      hexColor: COLOR_HEX_MAP.green,
      colorName: 'green',
      hasActiveFilter: true
    };
  }

  // No active filter
  return {
    hexColor: COLOR_HEX_MAP.gray,
    colorName: 'gray',
    hasActiveFilter: false
  };
}
