// Server-side proxy → backend /api/cities.
//
// Why a proxy instead of nginx routing: avoids needing a shared-infra
// change to /etc/nginx/sites-enabled/wmv. This Next.js route runs on the
// same VPS as the backend, so it can hit 127.0.0.1:2300 directly without
// CORS concerns, and the public path `/api/cities` works for any client.

export const dynamic = 'force-dynamic';

const BACKEND = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:2300';

export async function GET() {
  try {
    const r = await fetch(`${BACKEND}/api/cities`, { cache: 'no-store' });
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Backend unreachable',
      }),
      { status: 502, headers: { 'content-type': 'application/json; charset=utf-8' } },
    );
  }
}
