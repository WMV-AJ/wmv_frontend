import { NextResponse } from 'next/server';

// FE + BE are co-located on the VPS; loopback by default. Override via
// WMV_API_BASE in the environment for local dev (e.g. http://localhost:4000).
const WMV_API_BASE = process.env.WMV_API_BASE || 'http://localhost:2300';

// City-scoped venue count for the active city. Reads the same `/api/events`
// payload the rest of the UI uses (cheap and matches what the user actually
// sees on the map) and reduces to a deduped venue_id count.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    if (!city) {
      return NextResponse.json({ count: 0, error: 'city query param required' }, { status: 400 });
    }

    const res = await fetch(`${WMV_API_BASE}/api/events?city=${encodeURIComponent(city)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json({ count: 0 });

    const payload = await res.json();
    const rows: Array<{ venue_id?: number | string | null }> = Array.isArray(payload?.data) ? payload.data : [];
    const unique = new Set<string>();
    for (const r of rows) {
      if (r.venue_id != null) unique.add(String(r.venue_id));
    }

    const response = NextResponse.json({ count: unique.size });
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return response;
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
