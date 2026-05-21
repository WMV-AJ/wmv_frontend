// Routing model:
//   - `/`              → landing page (src/app/page.tsx) with city picker.
//   - `/<city>/...`    → city-scoped pages (src/app/[city]/...).
//   - `/login`, `/auth/...`, `/api/...`, `/_next/...` → pass-through.
//   - Legacy unprefixed paths (`/map`, `/cards`, typos) 308-redirect to
//     `/${DEFAULT_CITY}${path}` so old bookmarks keep working.
//
// City validity: static `ALL_CITIES` covers Dubai + Bangalore (build-time
// fallback). Dynamic cities (Mumbai etc., added at runtime via the city-
// onboarding workflow) are resolved by an async fetch to /api/cities on
// first encounter, cached per worker for 60s. Without this, /mumbai would
// be treated as a typo and redirected to /dubai/mumbai.
//
// Auth is still client-side via AuthContext (backend at /api/auth/*).

import { NextResponse, type NextRequest } from 'next/server';
import { ALL_CITIES, DEFAULT_CITY } from './config/cities.config';

const KNOWN_CITY_PREFIXES = (ALL_CITIES as readonly string[]).map((c) => `/${c}`);

// Top-level paths that must NOT be rewritten under a city prefix.
const PASSTHROUGH = new Set(['auth', 'api', '_next', 'favicon.ico']);

// Dynamic cities cache, refreshed against the backend's /api/cities.
// Worker-local, hydrated lazily on first unknown-path request.
let DYNAMIC_SLUGS: Set<string> = new Set();
let lastFetchAt = 0;
let inFlight: Promise<void> | null = null;
const CACHE_TTL_MS = 60_000;
const BACKEND_INTERNAL = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:2300';

async function refreshDynamicCities(): Promise<void> {
  // Coalesce concurrent refreshes so one request doesn't trigger 50 fetches.
  if (inFlight) return inFlight;
  if (Date.now() - lastFetchAt < CACHE_TTL_MS) return;
  inFlight = (async () => {
    try {
      const r = await fetch(`${BACKEND_INTERNAL}/api/cities`, { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json();
      if (!j.success || !Array.isArray(j.cities)) return;
      DYNAMIC_SLUGS = new Set(
        j.cities
          .filter((c: { status?: string }) => c.status === 'active')
          .map((c: { slug: string }) => c.slug),
      );
      lastFetchAt = Date.now();
    } catch {
      // Silently keep stale cache — fallback to static ALL_CITIES still works.
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bare root → the landing page (src/app/page.tsx). Let it through.
  if (pathname === '/') {
    return NextResponse.next();
  }

  // /login and /login/* fold into the landing page.
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url, 308);
  }

  // Already city-scoped against the static list? Let it through.
  if (KNOWN_CITY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // Reserved top-level (auth, api, _next, static) — let it through.
  const firstSegment = pathname.split('/').filter(Boolean)[0] ?? '';
  if (PASSTHROUGH.has(firstSegment)) {
    return NextResponse.next();
  }

  // Unknown first segment — could be a dynamically-onboarded city (e.g.
  // /mumbai) that isn't in the static ALL_CITIES list. Consult the cached
  // dynamic registry; refresh from the backend if stale.
  await refreshDynamicCities();
  if (DYNAMIC_SLUGS.has(firstSegment)) {
    return NextResponse.next();
  }

  // Truly unknown (e.g. /map, /cards, /tonight, typos) → DEFAULT_CITY prefix.
  // 307 (temporary) rather than 308 (permanent) so browsers re-ask the
  // server next time — important because a slug that's invalid today
  // (e.g. /mumbai pre-onboarding) might be valid tomorrow once it lands
  // in the DB-backed city registry. 308 was caching that decision
  // permanently and breaking newly-activated cities for old visitors.
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_CITY}${pathname}`;
  return NextResponse.redirect(url, 307);
}

export const config = {
  // Skip Next internals, API, and static assets — middleware only sees pages.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|404|_error|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)'],
};
