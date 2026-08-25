// Filter Options API route - areas from WMV backend with hierarchical genre/vibe structure
import { NextResponse } from 'next/server';
import { getCached } from '@/lib/server-cache';

interface FilterRecord {
  venue_area?: string;
  event_vibe?: string[];
  event_date?: string;
  music_genre_processed?: {
    primaries: string[];
    secondariesByPrimary: Record<string, string[]>;
    colorFamilies: string[];
  };
  venue_category?: string;
  id?: number;
  venue_name?: string;
}

// FE + BE are co-located on the VPS; loopback by default. Override via
// WMV_API_BASE in the environment for local dev (e.g. http://localhost:4000).
const WMV_API_BASE = process.env.WMV_API_BASE || 'http://localhost:2300';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');

  try {
    // Cache the DERIVED 6KB facet object, not the raw upstream fetch — Next's
    // data cache silently refuses >2MB responses, so the old
    // `fetch(..., { next: { revalidate: 1800 } })` was a no-op and every cold
    // hit paid full upstream fetch + derivation (measured 6s TTFB). Concurrent
    // requests share one in-flight derivation (kills the 503 thundering herd).
    const body = await getCached(
      `filter-options:${city ?? 'all'}`,
      30 * 60_000, // fresh: 30 min (data refreshes daily)
      24 * 60 * 60_000, // stale-servable: 24 h
      () => buildFilterOptions(city),
    );
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=1800' },
    });
  } catch (error) {
    // Upstream down and no stale cache to serve — same graceful empty
    // response the route always returned (deliberately NOT cached).
    console.error('filter-options upstream failed with empty cache:', error);
    return NextResponse.json({
      success: true,
      data: { areas: [], vibes: [], dates: [], genres: [] },
      message: 'Retrieved 0 areas/vibes/dates/genres (upstream error)',
    });
  }
}

async function buildFilterOptions(city: string | null): Promise<Record<string, unknown>> {
  {

    // Force parameters to empty for client-side filtering
    const selectedAreas: string[] = [];
    const activeVibes: string[] = [];
    const activeDates: string[] = [];
    const activeGenres: string[] = [];

    const upstreamUrl = city
      ? `${WMV_API_BASE}/api/events?city=${encodeURIComponent(city)}`
      : `${WMV_API_BASE}/api/events`;

    // Fetch from upstream WMV backend. `no-store`: server-cache.ts owns
    // caching of the derived output; double-caching the raw payload would
    // just burn memory (and Next refuses >2MB bodies anyway).
    let data: any[] = [];
    {
      const upstream = await fetch(upstreamUrl, { cache: 'no-store' });
      if (!upstream.ok) {
        throw new Error(`Upstream error: ${upstream.status} ${upstream.statusText}`);
      }
      const payload = await upstream.json();
      const raw: any[] = Array.isArray(payload?.data) ? payload.data : [];
      data = raw.map((r: any) => ({
        venue_area: r.venue_area,
        event_vibe: r.event_vibe,
        event_date: r.event_date,
        event_time: r.event_time,
        music_genre_processed: r.music_genre_processed,
        venue_category: r.venue_category,
        special_offers: r.special_offers,
        ticket_price: r.ticket_price,
        venue_price: r.venue_price,
        event_categories: r.event_categories,
        attributes: r.attributes,
      }));
    }

    // Helper function to apply filters excluding a specific filter type
    const getFilteredDataExcluding = (excludeFilterType: string) => {
      let filteredData = data || [];

      // Apply area filter if selected (unless we're excluding area)
      if (excludeFilterType !== 'areas' && selectedAreas.length > 0) {
        filteredData = filteredData.filter(record => {
          if (!record.venue_area) return false;
          return selectedAreas.some(area => {
            if (area === 'JBR') {
              return record.venue_area.toLowerCase().includes('jumeirah beach residence') ||
                     record.venue_area.toLowerCase().includes('jbr');
            }
            return record.venue_area.toLowerCase().includes(area.toLowerCase());
          });
        });
      }

      // Apply vibes filter if selected (unless we're excluding vibes)
      if (excludeFilterType !== 'vibes' && activeVibes.length > 0) {
        filteredData = filteredData.filter(record => {
          if (!record.event_vibe || !Array.isArray(record.event_vibe)) return false;
          return activeVibes.some(selectedVibe =>
            record.event_vibe.some((vibeString: string) =>
              vibeString && vibeString.toLowerCase().includes(selectedVibe.toLowerCase())
            )
          );
        });
      }

      // Apply date filter if selected (unless we're excluding dates)
      if (excludeFilterType !== 'dates' && activeDates.length > 0) {
        filteredData = filteredData.filter(record => {
          if (!record.event_date) return false;
          const venueDate = record.event_date.toString();
          return activeDates.some(selectedDate => {
            try {
              const venueDateObj = new Date(venueDate);
              const selectedDateStr = selectedDate.trim();
              let selectedDateObj: Date;

              if (selectedDateStr.includes('/')) {
                // Old format: "17/September/2025"
                const [day, monthPart, year] = selectedDateStr.split('/');
                const monthNames = [
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ];
                const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthPart.toLowerCase());
                if (monthIndex === -1) return false;
                selectedDateObj = new Date(parseInt(year), monthIndex, parseInt(day));
              } else {
                // New format: "17 Sept 25"
                const [day, monthPart, year] = selectedDateStr.split(' ');
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                  'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
                const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthPart.toLowerCase());
                if (monthIndex === -1) return false;
                const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
                selectedDateObj = new Date(fullYear, monthIndex, parseInt(day));
              }
              if (!isNaN(venueDateObj.getTime()) && !isNaN(selectedDateObj.getTime())) {
                const venueDateOnly = new Date(venueDateObj.getUTCFullYear(), venueDateObj.getUTCMonth(), venueDateObj.getUTCDate());
                const selectedDateOnly = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());
                return venueDateOnly.getTime() === selectedDateOnly.getTime();
              }
            } catch {
              return false;
            }
            return false;
          });
        });
      }

      // Apply genre filter if selected (unless we're excluding genres)
      if (excludeFilterType !== 'genres' && activeGenres.length > 0) {
        filteredData = filteredData.filter(record => {
          if (!record.music_genre_processed?.primaries) return false;
          return activeGenres.some(selectedGenre =>
            record.music_genre_processed.primaries.includes(selectedGenre)
          );
        });
      }

      return filteredData;
    };

    // Extract unique options for each filter type, excluding that filter from the filtering logic

    // Areas: exclude area filter, apply others
    const areaFilteredData = getFilteredDataExcluding('areas');
    const uniqueAreas = [...new Set(
      areaFilteredData?.map(record => record.venue_area).filter(area => area && area.trim())
    )].sort();

    // Extract hierarchical genres from music_genre_processed column
    const genreFilteredData = getFilteredDataExcluding('genres');

    // Build hierarchical structure from processed data
    const genreMap: Record<string, { color: string; subcategories: Set<string> }> = {};

    genreFilteredData?.forEach((record: FilterRecord) => {
      if (record.music_genre_processed?.primaries) {
        record.music_genre_processed.primaries.forEach(primary => {
          if (!genreMap[primary]) {
            // Get color from first record with this primary
            const color = record.music_genre_processed?.colorFamilies?.[0] || 'gray';
            genreMap[primary] = {
              color: color,
              subcategories: new Set()
            };
          }

          // Add secondaries for this primary
          const secondaries = record.music_genre_processed?.secondariesByPrimary?.[primary] || [];

          // If no secondaries exist, add the primary itself as a secondary
          if (secondaries.length === 0) {
            genreMap[primary].subcategories.add(primary);
          } else {
            secondaries.forEach(sec => genreMap[primary].subcategories.add(sec));
          }
        });
      }
    });

    // Convert to final format
    const hierarchicalGenres: Record<string, { color: string; subcategories: string[] }> = {};
    Object.entries(genreMap).forEach(([primary, data]) => {
      hierarchicalGenres[primary] = {
        color: data.color,
        subcategories: Array.from(data.subcategories).sort()
      };
    });

    // Get flat list for backward compatibility
    const allGenresFlat = Object.keys(hierarchicalGenres).sort();

    // Extract flat vibes from existing data and create hierarchical structure
    const vibeFilteredData = getFilteredDataExcluding('vibes');
    const flatVibes = [...new Set(
      vibeFilteredData?.flatMap((record: FilterRecord) =>
        Array.isArray(record.event_vibe)
          ? record.event_vibe
              .filter((vibe: string) => vibe && vibe.trim())
              .flatMap(vibe => vibe.split('|').map((tag: string) => tag.trim()).filter((tag: string) => tag))
          : []
      )
    )];

    // Define vibe categorization keywords (dynamic categorization)
    const vibeCategories: Record<string, {keywords: string[], color: string}> = {
      "Energy": {
        keywords: ["high energy", "nightclub", "packed", "party", "dance", "energetic"],
        color: "orange"
      },
      "Atmosphere": {
        keywords: ["open-air", "rooftop", "terrace", "lounge", "intimate", "casual", "chill"],
        color: "teal"
      },
      "Event Type": {
        keywords: ["beach", "pool", "dayclub", "brunch", "vip", "exclusive", "luxury", "fine dining"],
        color: "pink"
      },
      "Music Style": {
        keywords: ["techno", "house", "hip-hop", "r&b", "live", "rock", "indie", "jazz"],
        color: "indigo"
      }
    };

    // Build hierarchical vibes by categorizing each vibe tag
    const hierarchicalVibes: Record<string, { color: string; subcategories: string[] }> = {};

    Object.entries(vibeCategories).forEach(([primary, {keywords, color}]) => {
      const matchingVibes = flatVibes.filter(vibe =>
        keywords.some(keyword => vibe.toLowerCase().includes(keyword.toLowerCase()))
      );

      hierarchicalVibes[primary] = {
        color: color,
        subcategories: matchingVibes.sort()
      };
    });

    // Get all unique dates from database (historical and future)
    const dateFilteredData = getFilteredDataExcluding('dates');
    const uniqueDates = [...new Set(
      dateFilteredData?.map((record: FilterRecord) => {
        if (!record.event_date) return null;

        try {
          const eventDate = new Date(record.event_date);
          if (isNaN(eventDate.getTime())) return null;

          // Format as "17 Sept 25"
          const day = eventDate.getUTCDate();
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                             'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
          const month = monthNames[eventDate.getUTCMonth()];
          const year = eventDate.getUTCFullYear().toString().slice(-2); // Last 2 digits
          return `${day} ${month} ${year}`;
        } catch {
          return null;
        }
      }).filter(date => date !== null)
    )].sort((a, b) => {
      // Sort dates chronologically
      try {
        const parseDate = (dateStr: string) => {
          const [day, monthPart, year] = dateStr.split(' ');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                             'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
          const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthPart.toLowerCase());
          const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
          return new Date(fullYear, monthIndex, parseInt(day));
        };

        const dateA = parseDate(a);
        const dateB = parseDate(b);
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });

    // Extract unique venue categories by parsing JSON arrays
    const allVenueCategories: string[] = [];
    data.forEach((record: any) => {
      if (record.venue_category) {
        try {
          // venue_category is stored as JSON array string, parse it
          const categories = typeof record.venue_category === 'string'
            ? JSON.parse(record.venue_category)
            : record.venue_category;

          if (Array.isArray(categories)) {
            allVenueCategories.push(...categories);
          } else if (typeof categories === 'string') {
            allVenueCategories.push(categories);
          }
        } catch (e) {
          // If parsing fails, treat as regular string
          if (typeof record.venue_category === 'string' && record.venue_category.trim()) {
            allVenueCategories.push(record.venue_category);
          }
        }
      }
    });
    const venueCategories = [...new Set(allVenueCategories)].filter(cat => cat && cat.trim()).sort();

    // Extract unique special offers from special_offers array field
    const allOffers = data.flatMap((record: any) => {
      if (!record.special_offers) return [];
      if (Array.isArray(record.special_offers)) return record.special_offers;
      // If it's a string, split by common delimiters
      if (typeof record.special_offers === 'string') {
        return record.special_offers.split(/[,|;]/).map(o => o.trim()).filter(o => o);
      }
      return [];
    }) || [];

    const uniqueOffers = [...new Set(allOffers)].sort();

    // Helper function to categorize time into Morning/Afternoon/Evening/Night
    const categorizeTime = (timeStr: string): string[] => {
      if (!timeStr) return [];

      const categories: Set<string> = new Set();

      // Parse time ranges like "08:00 PM - 03:00 AM" or "1:30 PM - 11:00 PM"
      const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi;
      const matches = Array.from(timeStr.matchAll(timePattern));

      if (matches.length === 0) return [];

      // Helper to convert time to 24-hour format
      const to24Hour = (hour: number, minute: number, period: string): number => {
        let h = hour;
        if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
        if (period.toUpperCase() === 'AM' && h === 12) h = 0;
        return h + minute / 60;
      };

      // Get start and end times
      if (matches.length >= 1) {
        const startHour = parseInt(matches[0][1]);
        const startMin = parseInt(matches[0][2]);
        const startPeriod = matches[0][3];
        const startTime = to24Hour(startHour, startMin, startPeriod);

        let endTime = startTime + 3; // Default 3 hours if no end time
        if (matches.length >= 2) {
          const endHour = parseInt(matches[1][1]);
          const endMin = parseInt(matches[1][2]);
          const endPeriod = matches[1][3];
          endTime = to24Hour(endHour, endMin, endPeriod);

          // Handle overnight events (end time before start time)
          if (endTime < startTime) {
            endTime += 24;
          }
        }

        // Check which time periods this event spans
        // Morning: 6:00 AM (6.0) - 11:59 AM (11.99)
        // Afternoon: 12:00 PM (12.0) - 5:59 PM (17.99)
        // Evening: 6:00 PM (18.0) - 9:59 PM (21.99)
        // Night: 10:00 PM (22.0) - 5:59 AM (5.99) (includes overnight)

        for (let t = startTime; t < endTime; t += 0.5) {
          const hour = t % 24; // Normalize for overnight events

          if (hour >= 6 && hour < 12) {
            categories.add('Morning');
          } else if (hour >= 12 && hour < 18) {
            categories.add('Afternoon');
          } else if (hour >= 18 && hour < 22) {
            categories.add('Evening');
          } else {
            // Night: 22:00-23:59 and 0:00-5:59
            categories.add('Night');
          }
        }
      }

      return Array.from(categories);
    };

    // Extract and categorize event times into Morning/Afternoon/Evening/Night
    const timeCategories: Set<string> = new Set();
    data.forEach((record: any) => {
      if (record.event_time) {
        const categories = categorizeTime(record.event_time);
        categories.forEach(cat => timeCategories.add(cat));
      }
    });

    // Return in a logical order
    const orderedTimes = ['Morning', 'Afternoon', 'Evening', 'Night'].filter(t => timeCategories.has(t));

    // Extract and categorize ticket prices into AED ranges
    const allTicketPrices = data.map((record: any) => record.ticket_price).filter(price => price !== null && price !== undefined);
    const ticketPriceRanges = ['Free', 'AED 0-50', 'AED 50-100', 'AED 100-200', 'AED 200+'];

    // Extract unique atmospheres from attributes.energy and attributes.venue
    const allAtmospheres: string[] = [];
    data.forEach((record: any) => {
      if (record.attributes?.energy) {
        allAtmospheres.push(...record.attributes.energy);
      }
      if (record.attributes?.venue) {
        allAtmospheres.push(...record.attributes.venue);
      }
    });
    const uniqueAtmospheres = [...new Set(allAtmospheres)].sort();

    // Extract unique event categories (primaries only for filter options)
    const allEventCategories: string[] = [];
    data.forEach((record: any) => {
      if (record.event_categories && Array.isArray(record.event_categories)) {
        record.event_categories.forEach((cat: any) => {
          if (cat.primary) {
            allEventCategories.push(cat.primary);
          }
        });
      }
    });
    const uniqueEventCategories = [...new Set(allEventCategories)].sort();

    // Extract unique venue prices from database (actual values)
    const allVenuePrices = data.map((record: any) => record.venue_price)
      .filter(price => price !== null && price !== undefined && price.toString().trim())
      .map((price: any) => price.toString().trim());
    const uniqueVenuePrices = [...new Set(allVenuePrices)].sort();

    return {
      success: true,
      data: {
        areas: uniqueAreas,
        dates: uniqueDates,
        hierarchicalGenres: hierarchicalGenres,
        hierarchicalVibes: hierarchicalVibes,
        // Return flat genres for FilterBottomSheet backward compatibility
        genres: allGenresFlat,
        vibes: Object.keys(hierarchicalVibes),
        // NEW: Additional filter options
        venueCategories: venueCategories,
        specialOffers: uniqueOffers,
        times: orderedTimes, // Morning, Afternoon, Evening, Night
        ticketPrices: ticketPriceRanges, // AED ranges
        venuePrices: uniqueVenuePrices, // Actual values from database
        atmospheres: uniqueAtmospheres,
        eventCategories: uniqueEventCategories
      },
      message: `Retrieved ${uniqueAreas.length} areas, ${Object.keys(hierarchicalGenres).length} genre categories, ${Object.keys(hierarchicalVibes).length} vibe categories, ${uniqueDates.length} dates, ${venueCategories.length} venue categories, ${uniqueOffers.length} special offers, ${orderedTimes.length} time categories, ${uniqueAtmospheres.length} atmospheres, ${uniqueEventCategories.length} event categories, ${uniqueVenuePrices.length} venue prices`
    };
  }
}