// Bulk Events API route — fetch events for multiple venues at once.
// Proxies to the WMV backend (`final_1` table); no Supabase.
import { NextResponse } from 'next/server';

interface EventRecord {
  event_vibe?: string[] | string | null;
  event_date?: string | null;
  id?: number;
  event_id?: number | string | null;
  venue_id?: number | null;
  venue_name?: string | null;
  event_name?: string | null;
  event_time?: string | null;
  event_created_at?: string | null;
  artists?: string | string[] | null;
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
}

// Server-side only. Never read NEXT_PUBLIC_BACKEND_URL here — the public URL
// resolves to this same host (wheresmyvibe.com → VPS), so using it would
// trigger an infinite proxy loop. Set WMV_API_BASE on the VPS to
// `http://localhost:2300` (loopback to the backend); the literal public-IP
// fallback is for emergency boot only.
const WMV_API_BASE = (process.env.WMV_API_BASE || 'http://localhost:2300').replace(/\/$/, '');

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { venue_ids, city, limit = 10, genres, vibes, offers, dates } = body as {
      venue_ids?: number[];
      city?: string;
      limit?: number;
      genres?: string[] | string;
      vibes?: string[] | string;
      offers?: string[] | string;
      dates?: string[] | string;
    };

    if (!venue_ids || !Array.isArray(venue_ids) || venue_ids.length === 0) {
      return NextResponse.json(
        { success: false, data: {}, error: 'venue_ids array is required' },
        { status: 400 },
      );
    }

    const upstreamUrl = city
      ? `${WMV_API_BASE}/api/events?city=${encodeURIComponent(city)}`
      : `${WMV_API_BASE}/api/events`;
    // Always read through to the backend, for the same reason as
    // /api/events: on 2026-07-28 and again on 2026-07-30 the standalone
    // server's on-disk fetch cache served a response that was two days old,
    // and restarting the process did not clear it. This route returns the
    // same event data, so it carries the same risk — on 30 July the database
    // held 500 Dubai events while the site served 356.
    //
    // The upstream is on localhost and the response already sets its own
    // short Cache-Control for clients, so there is nothing to gain here and a
    // silently stale site to lose.
    const upstream = await fetch(upstreamUrl, { cache: 'no-store' });
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, data: {}, error: `Upstream ${upstream.status}: ${upstream.statusText}` },
        { status: 502 },
      );
    }
    const payload = await upstream.json();
    let records: EventRecord[] = Array.isArray(payload?.data) ? payload.data : [];

    const wantedSet = new Set(venue_ids);
    records = records.filter((r) => r.event_id != null && r.venue_id != null && wantedSet.has(r.venue_id as number));

    records.sort((a, b) => {
      const ad = a.event_date ? new Date(a.event_date).getTime() : 0;
      const bd = b.event_date ? new Date(b.event_date).getTime() : 0;
      return bd - ad;
    });

    if (genres) {
      const wanted = (Array.isArray(genres) ? genres : genres.split(',')).map((g: string) => g.trim());
      records = records.filter((r) => {
        const primaries = r.music_genre_processed?.primaries;
        if (!primaries || primaries.length === 0) return false;
        return wanted.some((g) => primaries.includes(g));
      });
    }

    if (vibes) {
      const wanted = (Array.isArray(vibes) ? vibes : vibes.split(',')).map((v: string) => v.trim().toLowerCase());
      records = records.filter((r) => {
        const ev = Array.isArray(r.event_vibe) ? r.event_vibe : [];
        return wanted.some((w) =>
          ev.some((entry) => typeof entry === 'string' && entry.toLowerCase().includes(w)),
        );
      });
    }

    if (offers) {
      const wanted = (Array.isArray(offers) ? offers : offers.split(',')).map((o: string) => o.trim().toLowerCase());
      records = records.filter((r) => {
        const so = r.special_offers;
        const text = Array.isArray(so) ? so.join(' ') : (so || '');
        return wanted.some((o) => text.toLowerCase().includes(o));
      });
    }

    if (dates) {
      const list = (Array.isArray(dates) ? dates : dates.split(',')).map((d: string) => d.trim());
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

    // Cap per-venue (post-filter)
    records = records.slice(0, limit * venue_ids.length);

    const transformed = records.map((r) => ({
      id: r.event_id,
      created_at: r.event_created_at,
      event_date: r.event_date,
      event_time: r.event_time,
      venue_name: r.venue_name,
      venue_id: r.venue_id,
      artist: Array.isArray(r.artists) ? r.artists.join(', ') : r.artists,
      music_genre: Array.isArray(r.music_genre) ? r.music_genre.join(', ') : r.music_genre,
      event_vibe: Array.isArray(r.event_vibe) ? r.event_vibe.join(', ') : r.event_vibe,
      event_name: r.event_name,
      ticket_price: r.ticket_price,
      special_offers: Array.isArray(r.special_offers) ? r.special_offers.join(', ') : r.special_offers,
      website_social: Array.isArray(r.website_social) ? r.website_social.join(', ') : r.website_social,
      confidence_score: r.confidence_score,
      analysis_notes: r.analysis_notes,
      instagram_id: r.instagram_id,
    }));

    const eventsByVenue: Record<number, unknown[]> = {};
    transformed.forEach((event) => {
      if (event.venue_id != null) {
        (eventsByVenue[event.venue_id] ||= []).push(event);
      }
    });
    venue_ids.forEach((id) => {
      if (!eventsByVenue[id]) eventsByVenue[id] = [];
    });

    const totalEvents = Object.values(eventsByVenue).reduce((sum, events) => sum + events.length, 0);
    const venuesWithEvents = Object.values(eventsByVenue).filter((events) => events.length > 0).length;

    return NextResponse.json({
      success: true,
      data: eventsByVenue,
      message: `Retrieved ${totalEvents} events for ${venue_ids.length} venues`,
      stats: {
        total_events: totalEvents,
        venues_requested: venue_ids.length,
        venues_with_events: venuesWithEvents,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, data: {}, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
