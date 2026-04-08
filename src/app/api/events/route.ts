// Events API route - now using final_1 table (with special character cleaning)
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface EventRecord {
  event_vibe?: string[];
  event_date?: string;
  id?: number;
  venue_name?: string;
  special_offers?: string;
  music_genre_processed?: {
    primaries: string[];
    secondariesByPrimary: Record<string, string[]>;
  };
  event_categories?: Array<{
    primary: string;
    secondary: string;
    confidence: number;
  }>;
  attributes?: {
    venue: string[];
    energy: string[];
    status: string[];
    timing: string[];
  };
  venue_id?: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const venue_id = searchParams.get('venue_id'); // Use venue_id (place_id) as the primary identifier
    const limit = searchParams.get('limit') || '50';
    const genres = searchParams.get('genres'); // comma-separated list
    const vibes = searchParams.get('vibes'); // comma-separated list
    const offers = searchParams.get('offers'); // comma-separated list
    const dates = searchParams.get('dates'); // comma-separated list
    const eventCategories = searchParams.get('eventCategories'); // comma-separated list of "primary|secondary" pairs
    const attributes = searchParams.get('attributes'); // comma-separated list of "type:value" pairs

    let query = supabase
      .from('final_1')
      .select('*')
      .not('event_id', 'is', null) // Only get records with event data
      .order('event_date', { ascending: false }) // Show newest dates first
      .limit(parseInt(limit));

    // Filter by venue_id (place_id) if specified - this is the distinct identifier for venues
    if (venue_id) {
      query = query.eq('venue_id', parseInt(venue_id));
    }

    // Filter by genres - will apply in JS after fetching since music_genre_processed is JSONB
    let genreFilterToApply = null;
    if (genres) {
      genreFilterToApply = genres.split(',').map(g => g.trim());
    }

    // Apply vibes filter after getting initial data since array substring search is complex
    let vibeFilterToApply = null;
    if (vibes) {
      vibeFilterToApply = vibes.split(',').map(v => v.trim());
    }

    // Parse event categories filter - format: "primary|secondary,primary|secondary"
    let eventCategoriesFilterToApply = null;
    if (eventCategories) {
      eventCategoriesFilterToApply = eventCategories.split(',').map(cat => {
        const [primary, secondary] = cat.split('|');
        return { primary, secondary };
      });
    }

    // Parse attributes filter - format: "venue:Indoor,energy:High Energy,timing:Night Event"
    let attributesFilterToApply = null;
    if (attributes) {
      attributesFilterToApply = attributes.split(',').reduce((acc, attr) => {
        const [type, value] = attr.split(':');
        if (!acc[type]) acc[type] = [];
        acc[type].push(value);
        return acc;
      }, {} as Record<string, string[]>);
    }

    // Filter by offers if specified (using string matching for pipe-separated values)
    if (offers) {
      const offerList = offers.split(',').map(o => o.trim());
      const offerConditions = offerList.map(offer => `special_offers.ilike.%${offer}%`).join(',');
      query = query.or(offerConditions);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: false,
        data: [],
        error: error.message
      }, { status: 500 });
    }

    // Apply vibes filter in JavaScript since Supabase array substring search is complex
    let filteredData = data;
    if (vibeFilterToApply && vibeFilterToApply.length > 0) {
      filteredData = data?.filter((record: EventRecord) => {
        if (!record.event_vibe || !Array.isArray(record.event_vibe)) return false;

        // Check if any of the requested vibes matches any element in the event_vibe array
        return vibeFilterToApply.some((requestedVibe: string) =>
          record.event_vibe!.some((eventVibeElement: string) =>
            eventVibeElement && eventVibeElement.toLowerCase().includes(requestedVibe.toLowerCase())
          )
        );
      });
    }

    // Apply genre filter in JavaScript
    if (genreFilterToApply && genreFilterToApply.length > 0) {
      filteredData = filteredData?.filter((record: EventRecord) => {
        if (!record.music_genre_processed?.primaries) return false;
        return genreFilterToApply.some((requestedGenre: string) =>
          record.music_genre_processed!.primaries.includes(requestedGenre)
        );
      });
    }

    // Apply event categories filter in JavaScript
    if (eventCategoriesFilterToApply && eventCategoriesFilterToApply.length > 0) {
      filteredData = filteredData?.filter((record: EventRecord) => {
        if (!record.event_categories || record.event_categories.length === 0) return false;

        // Event matches if ANY of its categories match the filter (OR logic for multi-category events)
        return eventCategoriesFilterToApply.some(filterCat => {
          return record.event_categories!.some(eventCat => {
            // Check if primary matches
            if (eventCat.primary !== filterCat.primary) return false;

            // If no secondary specified in filter, primary match is enough
            if (!filterCat.secondary) return true;

            // Check if secondary matches
            return eventCat.secondary === filterCat.secondary;
          });
        });
      });
    }

    // Apply attributes filter in JavaScript (AND logic - all selected attributes must match)
    if (attributesFilterToApply) {
      filteredData = filteredData?.filter((record: EventRecord) => {
        if (!record.attributes) return false;

        // Check each attribute type
        for (const [type, requiredValues] of Object.entries(attributesFilterToApply)) {
          const eventValues = record.attributes[type as keyof typeof record.attributes] || [];

          // Check if ANY of the required values for this type match (OR within same type)
          const hasMatch = requiredValues.some(requiredValue =>
            eventValues.includes(requiredValue)
          );

          // If this attribute type doesn't match, exclude the event (AND across types)
          if (!hasMatch) return false;
        }

        return true;
      });
    }

    // Apply dates filter if specified
    if (dates && filteredData) {
      const dateList = dates.split(',').map(d => d.trim());
      filteredData = filteredData.filter((record: EventRecord) => {
        if (!record.event_date) return false;

        const eventDate = new Date(record.event_date);
        if (isNaN(eventDate.getTime())) return false;

        return dateList.some((selectedDate: string) => {
          try {
            // Handle both date formats: "17 Sept 25" and "17/September/2025"
            let selectedDateObj: Date;

            if (selectedDate.includes('/')) {
              // Old format: "17/September/2025"
              const [day, monthName, year] = selectedDate.split('/');
              const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                'July', 'August', 'September', 'October', 'November', 'December'];
              const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
              if (monthIndex === -1) return false;
              selectedDateObj = new Date(parseInt(year), monthIndex, parseInt(day));
            } else {
              // New format: "17 Sept 25"
              const [day, monthPart, year] = selectedDate.split(' ');
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
              const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthPart.toLowerCase());
              if (monthIndex === -1) return false;
              const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
              selectedDateObj = new Date(fullYear, monthIndex, parseInt(day));
            }
            if (isNaN(selectedDateObj.getTime())) return false;

            // Compare dates (ignoring time) - use UTC to avoid timezone issues
            const eventDateOnly = new Date(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate());
            const selectedDateOnly = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());

            return eventDateOnly.getTime() === selectedDateOnly.getTime();
          } catch {
            return false;
          }
        });
      });
    }

    // Transform to expected frontend format
    const transformedData = filteredData?.map(record => ({
      id: record.id,
      created_at: record.event_created_at,
      // Ensure event_date is always in ISO format (YYYY-MM-DD)
      event_date: record.event_date
        ? (typeof record.event_date === 'string'
            ? record.event_date
            : new Date(record.event_date).toISOString().split('T')[0])
        : null,
      event_time: record.event_time,
      venue_id: record.venue_id, // Include venue_id for grouping
      venue_name: record.venue_name,
      artist: Array.isArray(record.artist) ? record.artist.join(', ') : record.artist,
      music_genre: record.music_genre_processed?.primaries?.join(', ') || '',
      event_vibe: Array.isArray(record.event_vibe) ? record.event_vibe.join(', ') : record.event_vibe,
      event_name: record.event_name,
      ticket_price: record.ticket_price,
      special_offers: Array.isArray(record.special_offers) ? record.special_offers.join(', ') : record.special_offers,
      website_social: Array.isArray(record.website_social) ? record.website_social.join(', ') : record.website_social,
      confidence_score: record.confidence_score,
      analysis_notes: record.analysis_notes,
      event_details: record.event_details || null,
      instagram_id: record.instagram_id,
      event_categories: record.event_categories,
      attributes: record.attributes,
      media_url_1: record.media_url_1 || null,
      media_type_1: record.media_type_1 || null,
      media_url_2: record.media_url_2 || null,
      media_type_2: record.media_type_2 || null
    })) || [];

    // Deduplicate events based on event.id (preferred) or fallback to event_name + event_date + venue_name
    // This prevents the same event from appearing multiple times due to OR query matching multiple rows
    const eventMap = new Map();
    transformedData.forEach(event => {
      // Prioritize event.id for deduplication, fallback to composite key
      const eventKey = event.id?.toString() ||
        `${event.event_name || event.artist}_${event.event_date}_${event.venue_name}`.toLowerCase().trim();
      if (!eventMap.has(eventKey)) {
        eventMap.set(eventKey, event);
      }
    });
    const deduplicatedData = Array.from(eventMap.values());

    return NextResponse.json({
      success: true,
      data: deduplicatedData,
      message: `Retrieved ${deduplicatedData.length} events from final_1`
    });
  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json({
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}