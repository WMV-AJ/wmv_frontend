import { NextRequest, NextResponse } from 'next/server';

// FE + BE are co-located on the VPS; loopback by default. Override via
// WMV_API_BASE in the environment for local dev (e.g. http://localhost:4000).
const WMV_API_BASE = process.env.WMV_API_BASE || 'http://localhost:2300';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    const city = searchParams.get('city');

    if (!eventId) {
      return NextResponse.json({ error: 'Missing event id parameter' }, { status: 400 });
    }

    // City is forwarded so the backend's related-events query stays scoped to
    // the same city. event_id is globally unique so the primary lookup works
    // without it, but related events would otherwise leak across cities if
    // two venues with shared place_ids exist — see backend/src/index.ts.
    const upstreamUrl = city
      ? `${WMV_API_BASE}/api/event/${encodeURIComponent(eventId)}?city=${encodeURIComponent(city)}`
      : `${WMV_API_BASE}/api/event/${encodeURIComponent(eventId)}`;

    const upstream = await fetch(upstreamUrl, {
      next: { revalidate: 60 },
    });

    if (!upstream.ok) {
      const status = upstream.status === 404 ? 404 : 500;
      return NextResponse.json(
        { error: upstream.status === 404 ? 'Event not found' : 'Upstream error' },
        { status }
      );
    }

    const body = await upstream.json();
    const res = NextResponse.json({ event: body.event, related: body.related ?? [] });
    // Event detail rarely changes; 60s browser cache + 5m SWR keeps the
    // detail page snappy on repeat visits without serving stale forever.
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res;
  } catch (error) {
    console.error('Event API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
