// Venue Names API route — distinct venue names for autocomplete.
// Proxies to the WMV backend at /api/events; data is sourced from the
// production Postgres `final_1` table (no Supabase).
import { NextResponse } from 'next/server';

// Server-side only. Never read NEXT_PUBLIC_BACKEND_URL here — the public URL
// resolves to this same host (wheresmyvibe.com → VPS), so using it would
// trigger an infinite proxy loop. Set WMV_API_BASE on the VPS to
// `http://localhost:2300` (loopback to the backend); the literal public-IP
// fallback is for emergency boot only.
const WMV_API_BASE = (process.env.WMV_API_BASE || 'http://localhost:2300').replace(/\/$/, '');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const upstreamUrl = city
      ? `${WMV_API_BASE}/api/events?city=${encodeURIComponent(city)}`
      : `${WMV_API_BASE}/api/events`;
    // Venue names change rarely (only when a new venue is added).
    const upstream = await fetch(upstreamUrl, { next: { revalidate: 1800 } });
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, data: [], error: `Upstream ${upstream.status}: ${upstream.statusText}` },
        { status: 502 },
      );
    }
    const payload = await upstream.json();
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const records: any[] = Array.isArray(payload?.data) ? payload.data : [];

    const names = records
      .map((r) => r.venue_name_original ?? r.venue_name)
      .filter((n: unknown): n is string => typeof n === 'string' && n.trim().length > 0);

    const uniqueVenueNames = Array.from(new Set(names)).sort();

    return NextResponse.json({
      success: true,
      data: uniqueVenueNames,
      message: `Retrieved ${uniqueVenueNames.length} distinct venue names`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, data: [], error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
