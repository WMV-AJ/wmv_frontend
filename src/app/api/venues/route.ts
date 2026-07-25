// Venues API route - thin proxy to the WMV backend at :2302/api/events.
// The backend serves events joined with venue data from `final_1`.
// This route preserves the legacy field-renaming contract the frontend
// adapter depends on (venue_name_original → name, venue_rating → rating, etc.)
// and rewires media from the new `media_urls[]` array.
import { NextResponse } from 'next/server';
import { getCached } from '@/lib/server-cache';

interface VenueResponse {
  venue_id: number;
  name: string;
  area: string;
  address: string;
  country: string;
  lat: number;
  lng: number;
  phone: string;
  website: string;
  category: string;
  created_at: string;
  final_instagram: string;
  event_date: string;
  rating: number;
  rating_count: number;
}

// Server-side only. Never read NEXT_PUBLIC_BACKEND_URL here — the public URL
// resolves to this same host (wheresmyvibe.com → VPS), so using it would
// trigger an infinite proxy loop. Set WMV_API_BASE in the VPS env (recommend
// `http://localhost:2300` since FE+BE are co-located — saves TLS + a hop);
// the literal public-IP fallback is for emergency boot only.
const WMV_API_BASE = (process.env.WMV_API_BASE || 'http://localhost:2300').replace(/\/$/, '');

export async function GET(request: Request) {
  // Multi-city: forward `?city=` to the backend so the venue list is scoped.
  // Falls back to all-cities if omitted (back-compat with old callers).
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');

  try {
    // Cache the TRANSFORMED per-city venue array (~320KB), not the raw
    // upstream fetch — Next's data cache refuses >2MB responses, so the old
    // `next: { revalidate: 300 }` never actually cached the full upstream
    // payload. Concurrent requests share one in-flight build (this dedup is
    // what killed the duplicate-fetch 503s observed in prod).
    const body = await getCached(
      `venues:${city ?? 'all'}`,
      5 * 60_000, // fresh: 5 min
      60 * 60_000, // stale-servable: 1 h
      () => buildVenues(city),
    );
    return NextResponse.json(body, {
      headers: {
        // 30s fresh, then up to 5 min serve-stale-while-revalidate.
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 502 });
  }
}

async function buildVenues(city: string | null): Promise<Record<string, unknown>> {
  {
    // Force client-side filtering by ignoring all parameters

    // Use empty filters since we want client-side filtering
    const selectedAreas: string[] = [];
    const activeVibes: string[] = [];
    const activeDates: string[] = [];
    const activeGenres: string[] = [];

    const upstreamUrl = city
      ? `${WMV_API_BASE}/api/events?city=${encodeURIComponent(city)}`
      : `${WMV_API_BASE}/api/events`;

    // Fetch from upstream WMV backend (joins events + venues from final_1 already).
    // Upstream records have 40+ fields; we keep loose typing here since this route
    // acts as a translation layer that strictly shapes the response at the bottom.
    // `no-store`: server-cache.ts owns caching of the derived output.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let upstreamData: any[] = [];
    {
      const upstream = await fetch(upstreamUrl, { cache: 'no-store' });
      if (!upstream.ok) {
        throw new Error(`Upstream ${upstream.status}: ${upstream.statusText}`);
      }
      const payload = await upstream.json();
      upstreamData = Array.isArray(payload?.data) ? payload.data : [];
    }

    // Keep only records with venue_id and coordinates (map markers need lat/lng).
    // Sort by venue_name to preserve legacy ordering.
    const data: any[] = upstreamData
      .filter(r =>
        r.venue_id != null && r.venue_lat != null && r.venue_lng != null
      )
      .sort((a, b) => {
        const an: string = a.venue_name || a.venue_name_original || '';
        const bn: string = b.venue_name || b.venue_name_original || '';
        return an.localeCompare(bn);
      });

    // Server-side filter params are currently unused; filtering happens in
    // `useClientSideVenues`. Keep the variables in scope to not break the
    // in-memory filter blocks below.
    void selectedAreas; void activeVibes; void activeDates; void activeGenres;

    // Helper function to transform event_vibe string into hierarchical structure
    const transformEventVibeToProcessed = (eventVibeArray: string[] | null | undefined) => {
      if (!eventVibeArray || !Array.isArray(eventVibeArray)) return null;

      // Define the same vibe categories as in filter-options
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

      // Extract individual tags from pipe-separated strings
      const vibeTags = eventVibeArray
        .flatMap(vibe => vibe.split('|').map(tag => tag.trim()))
        .filter(tag => tag);

      const primaries: string[] = [];
      const secondariesByPrimary: Record<string, string[]> = {};
      const colorFamilies: string[] = [];

      // Categorize each vibe tag
      Object.entries(vibeCategories).forEach(([primary, {keywords, color}]) => {
        const matchingTags = vibeTags.filter(tag =>
          keywords.some(keyword => tag.toLowerCase().includes(keyword.toLowerCase()))
        );

        if (matchingTags.length > 0) {
          primaries.push(primary);
          secondariesByPrimary[primary] = [...new Set(matchingTags)].sort();
          colorFamilies.push(color);
        }
      });

      if (primaries.length === 0) return null;

      return {
        primaries,
        secondariesByPrimary,
        colorFamilies
      };
    };

    // Transform data but don't deduplicate yet - we need to filter first
    let venues = data?.map((record: any) => {
      const mediaUrls: string[]  = Array.isArray(record.media_urls)  ? record.media_urls  : [];
      const mediaTypes: string[] = Array.isArray(record.media_types) ? record.media_types : [];
      return {
      venue_id: record.venue_id,
      name: record.venue_name || record.venue_name_original, // Use venue_name (matches events-bulk API), fallback to venue_name_original
      area: record.venue_area,
      address: record.venue_address,
      country: record.venue_country || 'UAE',
      lat: record.venue_lat,
      lng: record.venue_lng,
      phone: record.venue_phone,
      website: record.venue_website,
      category: record.venue_category,
      rating: record.venue_rating,
      rating_count: record.venue_rating_count,
      venue_highlights: record.venue_highlights,
      venue_atmosphere: record.venue_atmosphere,
      created_at: record.venue_created_at,
      final_instagram: record.venue_final_instagram,
      event_id: record.event_id,
      event_date: record.event_date,
      event_name: record.event_name,
      event_time: record.event_time,
      artist: record.artist,
      music_genre: record.music_genre,
      event_vibe: record.event_vibe,
      ticket_price: record.ticket_price,
      special_offers: record.special_offers,
      website_social: record.website_social,
      confidence_score: record.confidence_score,
      analysis_notes: record.analysis_notes,
      music_genre_processed: record.music_genre_processed,
      event_vibe_processed: record.event_vibe_processed || transformEventVibeToProcessed(record.event_vibe), // Use DB version if available, fallback to transform
      event_categories: record.event_categories,
      attributes: record.attributes,
      metadata: record.metadata,
      // Only pass the two media URLs we actually render. Dropping the full
      // arrays saves ~180 KB on the wire per response.
      media_url_1: mediaUrls[0] ?? record.media_url_1 ?? null,
      media_type_1: mediaTypes[0] ?? record.media_type_1 ?? null,
      media_url_2: mediaUrls[1] ?? record.media_url_2 ?? null,
      media_type_2: mediaTypes[1] ?? record.media_type_2 ?? null,
      deals: record.deals || null,
      scrape_date: record.scrape_date || null,
      swipe_link_url: record.swipe_link_url || null,
      };
    }) || [];

    // Apply vibes filtering in memory for complex string matching
    if (activeVibes.length > 0) {
      venues = venues.filter(venue => {
        if (!venue.event_vibe || !Array.isArray(venue.event_vibe)) return false;

        // Check if any selected vibe appears in any of the venue's vibe strings
        return activeVibes.some(selectedVibe =>
          venue.event_vibe.some((vibeString: string) =>
            vibeString && vibeString.toLowerCase().includes(selectedVibe.toLowerCase())
          )
        );
      });
    }

    // Apply date filtering in memory for date format matching
    if (activeDates.length > 0) {
      venues = venues.filter(venue => {
        if (!venue.event_date) return false;

        // Parse venue date (ISO format like "2025-09-17T00:00:00+00:00")
        const venueDate = venue.event_date.toString();

        return activeDates.some(selectedDate => {
          try {
            // Parse venue date from ISO format
            const venueDateObj = new Date(venueDate);

            // Parse selected date - handle both "17 Sept 25" and "17/September/2025" formats
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
              if (monthIndex === -1) {
                return false;
              }
              selectedDateObj = new Date(parseInt(year), monthIndex, parseInt(day));
            } else {
              // New format: "17 Sept 25"
              const [day, monthPart, year] = selectedDateStr.split(' ');
              const monthNames = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
              ];
              const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthPart.toLowerCase());
              if (monthIndex === -1) {
                return false;
              }
              // Handle 2-digit year
              const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
              selectedDateObj = new Date(fullYear, monthIndex, parseInt(day));
            }

            if (!isNaN(venueDateObj.getTime()) && !isNaN(selectedDateObj.getTime())) {
              // Compare just the date parts (year, month, day) - use UTC to avoid timezone issues
              const venueDateOnly = new Date(venueDateObj.getUTCFullYear(), venueDateObj.getUTCMonth(), venueDateObj.getUTCDate());
              const selectedDateOnly = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());

              const match = venueDateOnly.getTime() === selectedDateOnly.getTime();
              return match;
            }
          } catch (e) {
            // Date parsing failed - skip this venue
          }

          return false;
        });
      });
    }

    // Apply genre filtering using music_genre_processed primaries
    if (activeGenres.length > 0) {
      venues = venues.filter(venue => {
        if (!venue.music_genre_processed?.primaries) return false;

        // Check if any selected genre matches the venue's primary genres
        const hasMatch = activeGenres.some(selectedGenre =>
          venue.music_genre_processed.primaries.includes(selectedGenre)
        );

        return hasMatch;
      });
    }

    // NOTE: Removed venue_id deduplication to allow showing multiple events per venue
    // Client-side code (Map view, List view) will handle deduplication based on their needs:
    // - Map view: deduplicates by venue_id for map markers
    // - List view: deduplicates by event.id for event cards
    // This allows the List view to show all events, even multiple events at the same venue

    // Remove internal fields from final response
    const venueResponse: VenueResponse[] = venues.map((venue) => {
      return venue as VenueResponse;
    });

    return {
      success: true,
      data: venueResponse,
      message: `Retrieved ${venues.length} venues from upstream`,
    };
  }
}