import { NextResponse } from 'next/server';

// Defaults to prod backend (port 2300). Override via WMV_API_BASE env var.
const WMV_API_BASE = process.env.WMV_API_BASE || 'http://91.99.102.124:2300';

export async function GET() {
  try {
    const res = await fetch(`${WMV_API_BASE}/api/admin/venues/list?limit=1`, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ count: 0 });
    const data = await res.json();
    return NextResponse.json({ count: data.total ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
