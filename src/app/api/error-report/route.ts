// Relay for browser error reports.
//
// The error tracker (NEXT_PUBLIC_SENTRY_DSN) is served over plain HTTP, and a
// page loaded over HTTPS is not allowed to post to it: the browser blocks the
// request, so no error from a visitor's browser ever arrived. The browser now
// posts here, on the site's own HTTPS address, and this route passes the
// report on from the server.
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Reports are small; session replays can run to a few megabytes. */
const MAX_BYTES = 10 * 1024 * 1024;

interface Target {
  origin: string;
  projectId: string;
  publicKey: string;
}

function parseDsn(dsn: string | undefined): Target | null {
  if (!dsn) return null;
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\/+|\/+$/g, '');
    if (!url.username || !/^\d+$/.test(projectId)) return null;
    return { origin: `${url.protocol}//${url.host}`, projectId, publicKey: url.username };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const target = parseDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);
  if (!target) return NextResponse.json({ error: 'Error reporting is not configured' }, { status: 503 });

  const body = await request.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Report is empty or too large' }, { status: 413 });
  }

  // The first line of a report names where it is addressed. Only pass on
  // reports addressed to our own project, so this cannot be used as an open relay.
  const bytes = new Uint8Array(body);
  const newline = bytes.indexOf(10);
  const firstLine = new TextDecoder().decode(bytes.subarray(0, newline === -1 ? Math.min(bytes.length, 4096) : newline));
  let addressedTo: Target | null = null;
  try {
    addressedTo = parseDsn((JSON.parse(firstLine) as { dsn?: string }).dsn);
  } catch {
    addressedTo = null;
  }
  if (!addressedTo || addressedTo.origin !== target.origin || addressedTo.projectId !== target.projectId || addressedTo.publicKey !== target.publicKey) {
    return NextResponse.json({ error: 'Report is not addressed to this site' }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${target.origin}/api/${target.projectId}/envelope/?sentry_version=7&sentry_key=${target.publicKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/x-sentry-envelope' }, body, signal: AbortSignal.timeout(10_000) },
    );
    return new NextResponse(null, { status: upstream.ok ? 200 : 502 });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
