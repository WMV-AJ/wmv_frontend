// Events API route — proxies to the WMV backend (`final_1` table) and applies
// per-venue / genre / vibe / offers / category / attribute / date filtering.
// No Supabase — all data lives in production Postgres on 91.99.102.124:2400.
import { NextResponse } from 'next/server';

interface EventRecord {
  event_vibe?: string[] | string | null;
  event_date?: string | null;
  id?: number;
  event_id?: number | string | null;
  venue_id?: number | null;
  venue_name?: string | null;
  venue_name_original?: string | null;
  event_name?: string | null;
  event_time?: string | null;
  event_created_at?: string | null;
  artist?: string | string[] | null;
  music_genre?: string | string[] | null;
  music_genre_processed?: {
    primaries: string[];
    secondariesByPrimary: Record<string, string[]>;
  } | null;
  ticket_price?: number | string | null;
  special_offers?: string | string[] | null;
  website_social?: string | string[] | null;
  confidence_score?: number | null;
  analysis_notes?: string | null;
  instagram_id?: string | null;
  event_categories?: Array<{ primary: string; secondary?: string; confidence?: number }> | null;
  attributes?: {
    venue?: string[];
    energy?: string[];
    status?: string[];
    timing?: string[];
  } | null;
  media_url_1?: string | null;
  media_type_1?: string | null;
  media_url_2?: string | null;
  media_type_2?: string | null;
}

const WMV_API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.WMV_API_BASE || 'http://91.99.102.124:2302').replace(/\/$/, '');

function parseSelectedDate(raw: string): Date | null {
  const s = raw.trim();
  try {
    if (s.includes('/')) {
      const [day, monthName, year] = s.split('/');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      const idx = monthNames.findIndex((m) => m.toLowerCase() === monthName.toLowerCase());
      if (idx === -1) return null;
      return new Date(parseInt(year), idx, parseInt(day));
    }
    const [day, monthPart, year] = s.split(' ');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec',
    ];
    const idx = monthNames.findIndex((m) => m.toLowerCase() === monthPart.toLowerCase());
    if (idx === -1) return null;
    const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
    return new Date(fullYear, idx, parseInt(day));
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const venue_id = searchParams.get('venue_id');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const genres = searchParams.get('genres');
    const vibes = searchParams.get('vibes');
    const offers = searchParams.get('offers');
    const dates = searchParams.get('dates');
    const eventCategories = searchParams.get('eventCategories');
    const attributes = searchParams.get('attributes');

    const upstream = await fetch(`${WMV_API_BASE}/api/events`, { cache: 'no-store' });
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, data: [], error: `Upstream ${upstream.status}: ${upstream.statusText}` },
        { status: 502 },
      );
    }
    const payload = await upstream.json();
    let records: EventRecord[] = Array.isArray(payload?.data) ? payload.data : [];

    // Only events
    records = records.filter((r) => r.event_id != null);

    // Filter by venue_id if specified
    if (venue_id) {
      const wanted = parseInt(venue_id, 10);
      records = records.filter((r) => r.venue_id === wanted);
    }

    // Newest first
    records.sort((a, b) => {
      const ad = a.event_date ? new Date(a.event_date).getTime() : 0;
      const bd = b.event_date ? new Date(b.event_date).getTime() : 0;
      return bd - ad;
    });

    // Genre filter — primaries match
    if (genres) {
      const wanted = genres.split(',').map((g) => g.trim());
      records = records.filter((r) => {
        const primaries = r.music_genre_processed?.primaries;
        if (!primaries || primaries.length === 0) return false;
        return wanted.some((g) => primaries.includes(g));
      });
    }

    // Vibes filter — substring match against any vibe entry
    if (vibes) {
      const wanted = vibes.split(',').map((v) => v.trim().toLowerCase());
      records = records.filter((r) => {
        const ev = Array.isArray(r.event_vibe) ? r.event_vibe : [];
        return wanted.some((w) =>
          ev.some((entry) => typeof entry === 'string' && entry.toLowerCase().includes(w)),
        );
      });
    }

    // Offers filter — substring match against special_offers (string or array)
    if (offers) {
      const wanted = offers.split(',').map((o) => o.trim().toLowerCase());
      records = records.filter((r) => {
        const so = r.special_offers;
        const text = Array.isArray(so) ? so.join(' ') : (so || '');
        const lower = text.toLowerCase();
        return wanted.some((o) => lower.includes(o));
      });
    }

    // Event categories — `primary|secondary,primary|secondary`
    if (eventCategories) {
      const filters = eventCategories.split(',').map((cat) => {
        const [primary, secondary] = cat.split('|');
        return { primary, secondary };
      });
      records = records.filter((r) => {
        const cats = r.event_categories;
        if (!cats || cats.length === 0) return false;
        return filters.some((f) =>
          cats.some((c) => c.primary === f.primary && (!f.secondary || c.secondary === f.secondary)),
        );
      });
    }

    // Attributes — `type:value,type:value` (AND across types, OR within a type)
    if (attributes) {
      const grouped = attributes.split(',').reduce<Record<string, string[]>>((acc, attr) => {
        const [type, value] = attr.split(':');
        if (!type || !value) return acc;
        (acc[type] ||= []).push(value);
        return acc;
      }, {});
      records = records.filter((r) => {
        if (!r.attributes) return false;
        for (const [type, requiredValues] of Object.entries(grouped)) {
          const eventValues = (r.attributes as Record<string, string[] | undefined>)[type] || [];
          if (!requiredValues.some((rv) => eventValues.includes(rv))) return false;
        }
        return true;
      });
    }

    // Dates filter
    if (dates) {
      const list = dates.split(',').map((d) => d.trim());
      records = records.filter((r) => {
        if (!r.event_date) return false;
        const ed = new Date(r.event_date);
        if (isNaN(ed.getTime())) return false;
        return list.some((selected) => {
          const sd = parseSelectedDate(selected);
          if (!sd || isNaN(sd.getTime())) return false;
          const a = new Date(ed.getUTCFullYear(), ed.getUTCMonth(), ed.getUTCDate());
          const b = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate());
          return a.getTime() === b.getTime();
        });
      });
    }

    // Cap to requested limit
    records = records.slice(0, limit);

    // Transform to frontend shape
    const transformed = records.map((r) => ({
      id: r.id,
      created_at: r.event_created_at,
      event_date: r.event_date
        ? (typeof r.event_date === 'string'
            ? r.event_date
            : new Date(r.event_date).toISOString().split('T')[0])
        : null,
      event_time: r.event_time,
      venue_id: r.venue_id,
      venue_name: r.venue_name,
      artist: Array.isArray(r.artist) ? r.artist.join(', ') : r.artist,
      music_genre: r.music_genre_processed?.primaries?.join(', ') || '',
      event_vibe: Array.isArray(r.event_vibe) ? r.event_vibe.join(', ') : r.event_vibe,
      event_name: r.event_name,
      ticket_price: r.ticket_price,
      special_offers: Array.isArray(r.special_offers) ? r.special_offers.join(', ') : r.special_offers,
      website_social: Array.isArray(r.website_social) ? r.website_social.join(', ') : r.website_social,
      confidence_score: r.confidence_score,
      analysis_notes: r.analysis_notes,
      instagram_id: r.instagram_id,
      event_categories: r.event_categories,
      attributes: r.attributes,
      media_url_1: r.media_url_1 || null,
      media_type_1: r.media_type_1 || null,
      media_url_2: r.media_url_2 || null,
      media_type_2: r.media_type_2 || null,
    }));

    // Dedup
    const map = new Map<string, typeof transformed[number]>();
    transformed.forEach((event) => {
      const key = event.id?.toString()
        || `${event.event_name || event.artist}_${event.event_date}_${event.venue_name}`.toLowerCase().trim();
      if (!map.has(key)) map.set(key, event);
    });
    const dedup = Array.from(map.values());

    return NextResponse.json({
      success: true,
      data: dedup,
      message: `Retrieved ${dedup.length} events`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, data: [], error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
