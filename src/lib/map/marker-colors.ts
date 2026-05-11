import type { HierarchicalFilterState } from '@/types';
import {
  COLOR_HEX_MAP,
  getCategoryColor,
  getHexColor,
  getGoogleMapsColor
} from '@/lib/category-mappings';
import { hasAllCitySentinel, isAllCitySentinel } from '@/lib/city-helpers';

export type MarkerColorScheme = {
  primary: string;
  googleMapsColor: string;
  svgColor: string;
  borderColor: string;
};

/**
 * Get venue's primary event category from event_categories array
 */
export function getVenuePrimaryEventCategory(venue: any): string {
  if (!venue.event_categories || venue.event_categories.length === 0) {
    // Fallback to category string analysis
    return getEventCategoryFromVenueType(venue.category || '');
  }
  
  // Find the event category with highest confidence
  const sortedCategories = venue.event_categories
    .filter((cat: any) => cat.primary && cat.confidence)
    .sort((a: any, b: any) => b.confidence - a.confidence);
  
  if (sortedCategories.length > 0) {
    return sortedCategories[0].primary;
  }
  
  // Fallback
  return getEventCategoryFromVenueType(venue.category || '');
}

/**
 * Map venue category string to event category
 */
function getEventCategoryFromVenueType(category: string): string {
  const cat = category.toLowerCase();
  
  if (cat.includes('nightclub') || cat.includes('club') || cat.includes('disco')) {
    return 'Nightlife';
  } else if (cat.includes('sports bar') || cat.includes('dart bar') || cat.includes('pool billard')) {
    return 'Sports & Viewing';
  } else if (cat.includes('live music') || cat.includes('jazz') || cat.includes('karaoke')) {
    return 'Music Events';
  } else if (cat.includes('restaurant') || cat.includes('cafe') || cat.includes('dining')) {
    return 'Food & Dining';
  } else if (cat.includes('bar') || cat.includes('lounge') || cat.includes('pub')) {
    return 'Nightlife';
  } else {
    return 'Nightlife'; // Default to most common
  }
}

/**
 * Determine if any filters are active
 */
function hasActiveFilters(filters?: HierarchicalFilterState): boolean {
  if (!filters) return false;
  
  return (
    (filters.activeVibes && filters.activeVibes.length > 0) ||
    (filters.activeGenres && filters.activeGenres.length > 0) ||
    (filters.selectedAreas && filters.selectedAreas.length > 0 && !hasAllCitySentinel(filters.selectedAreas)) ||
    (filters.activeOffers && filters.activeOffers.length > 0) ||
    (filters.eventCategories && filters.eventCategories.selectedPrimaries.length > 0)
  );
}

/**
 * Get active filter type with priority
 */
function getActiveFilterType(filters?: HierarchicalFilterState): string {
  if (!filters) return 'default';
  
  // Priority: Event Categories > Vibes > Genres > Areas > Offers
  if (filters.eventCategories && filters.eventCategories.selectedPrimaries.length > 0) {
    return 'eventCategories';
  }
  if (filters.activeVibes && filters.activeVibes.length > 0) return 'vibes';
  if (filters.activeGenres && filters.activeGenres.length > 0) return 'genres';
  if (filters.selectedAreas && filters.selectedAreas.length > 0 &&
      !hasAllCitySentinel(filters.selectedAreas)) return 'areas';
  if (filters.activeOffers && filters.activeOffers.length > 0) return 'offers';
  
  return 'default';
}

/**
 * Get marker color scheme based on venue and filters
 */
export function getMarkerColorScheme(venue: any, filters?: HierarchicalFilterState): MarkerColorScheme {
  let colorName: string;
  let hexColor: string;
  
  if (!hasActiveFilters(filters)) {
    // Default state: Use venue's event category color
    const eventCategory = getVenuePrimaryEventCategory(venue);
    colorName = getCategoryColor(eventCategory);
    hexColor = getHexColor(colorName);
  } else {
    // Filters active: Use filter type color
    const activeType = getActiveFilterType(filters);
    
    switch (activeType) {
      case 'eventCategories':
        // Use the color of the category this venue actually matches
        const venueCategories = venue.event_categories || [];
        const selectedPrimaries = filters?.eventCategories?.selectedPrimaries || [];
        const matchedCategory = selectedPrimaries.find((cat: string) =>
          venueCategories.some((vc: any) => vc.primary === cat)
        );
        colorName = matchedCategory ? getCategoryColor(matchedCategory) : getCategoryColor(selectedPrimaries[0] || '');
        hexColor = getHexColor(colorName);
        break;
        
      case 'vibes':
        colorName = 'purple';
        hexColor = COLOR_HEX_MAP.purple;
        break;
        
      case 'genres': 
        colorName = 'orange';
        hexColor = COLOR_HEX_MAP.orange;
        break;
        
      case 'areas':
        colorName = 'blue';
        hexColor = COLOR_HEX_MAP.blue;
        break;
        
      case 'offers':
        colorName = 'green';
        hexColor = COLOR_HEX_MAP.green;
        break;
        
      default:
        colorName = 'gray';
        hexColor = COLOR_HEX_MAP.gray;
    }
  }
  
  return {
    primary: hexColor,
    googleMapsColor: getGoogleMapsColor(colorName),
    svgColor: hexColor,
    borderColor: hexColor
  };
}

/**
 * Check if a venue matches the active filter criteria
 */
export function doesVenueMatchFilters(
  venue: any, 
  filters?: HierarchicalFilterState
): boolean {
  if (!filters) return true;
  
  const activeType = getActiveFilterType(filters);
  
  switch (activeType) {
    case 'eventCategories':
      // Check if venue has any of the selected event categories
      return filters.eventCategories?.selectedPrimaries.some(category =>
        venue.event_categories?.some((venueCategory: any) =>
          venueCategory.primary === category
        )
      ) || false;
      
    case 'vibes':
      // Check if venue has any of the active vibes
      return filters.activeVibes?.some(vibe => 
        venue.event_vibe?.some((venueVibe: string) => 
          venueVibe.toLowerCase().includes(vibe.toLowerCase())
        )
      ) || false;
      
    case 'genres':
      // Check if venue has any of the active genres
      return filters.activeGenres?.some(genre =>
        venue.event_genres?.some((venueGenre: string) =>
          venueGenre.toLowerCase().includes(genre.toLowerCase())
        )
      ) || false;
      
    case 'areas':
      // Check if venue is in any of the selected areas
      return filters.selectedAreas?.some(area =>
        isAllCitySentinel(area) ||
        venue.area?.toLowerCase().includes(area.toLowerCase())
      ) || false;
      
    case 'offers':
      // Check if venue has any of the active offers
      return filters.activeOffers?.some(offer =>
        venue.event_offers?.some((venueOffer: string) =>
          venueOffer.toLowerCase().includes(offer.toLowerCase())
        )
      ) || false;
      
    default:
      return true;
  }
}

/**
 * Create custom SVG marker icon (for future use)
 */
export function createCustomMarkerIcon(
  colorScheme: MarkerColorScheme,
  size: number = 32
): string {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      
      <!-- Main circle -->
      <circle 
        cx="16" 
        cy="16" 
        r="12" 
        fill="${colorScheme.svgColor}" 
        stroke="${colorScheme.borderColor}" 
        stroke-width="2"
        filter="url(#shadow)"
      />
      
      <!-- Inner highlight -->
      <circle 
        cx="16" 
        cy="16" 
        r="8" 
        fill="rgba(255,255,255,0.3)" 
      />
      
      <!-- Center dot -->
      <circle 
        cx="16" 
        cy="16" 
        r="3" 
        fill="white" 
      />
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Get Google Maps marker URL with color
 */
export function getGoogleMapsMarkerUrl(
  colorScheme: MarkerColorScheme,
  size: number = 32
): string {
  return `https://maps.google.com/mapfiles/ms/icons/${colorScheme.googleMapsColor}-dot.png`;
}

/**
 * Create an SVG colored dot as a data URI
 */
function createDotSvg(hexColor: string, size: number): string {
  const r = size / 2 - 2;
  const c = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${c}" cy="${c}" r="${r}" fill="${hexColor}" stroke="white" stroke-width="2"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Get the appropriate marker icon configuration
 */
export function getMarkerIcon(
  venue: any,
  filters?: HierarchicalFilterState,
  size: number = 32
): { url: string; scaledSize: google.maps.Size; anchor: google.maps.Point } {
  const colorScheme = getMarkerColorScheme(venue, filters);
  const dotSize = Math.round(size * 0.5);

  return {
    url: createDotSvg(colorScheme.svgColor, dotSize),
    scaledSize: new google.maps.Size(dotSize, dotSize),
    anchor: new google.maps.Point(dotSize / 2, dotSize / 2),
  };
}