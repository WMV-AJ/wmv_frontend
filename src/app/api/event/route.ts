import { NextRequest, NextResponse } from 'next/server';

// Defaults to prod backend (port 2300, multi-city aware). Override via
// WMV_API_BASE env var on Vercel / VPS if needed.
const WMV_API_BASE = process.env.WMV_API_BASE || 'http://91.99.102.124:2300';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ error: 'Missing event id parameter' }, { status: 400 });
    }

    const upstream = await fetch(`${WMV_API_BASE}/api/event/${encodeURIComponent(eventId)}`, {
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const status = upstream.status === 404 ? 404 : 500;
      return NextResponse.json(
        { error: upstream.status === 404 ? 'Event not found' : 'Upstream error' },
        { status }
      );
    }

    const body = await upstream.json();
    return NextResponse.json({ event: body.event, related: body.related ?? [] });
  } catch (error) {
    console.error('Event API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
