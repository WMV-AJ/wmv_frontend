// Every page is reachable only via /<city>/... The old single-city routes
// (/, /map, /cards) were deleted alongside this middleware — requests to
// those legacy paths land here and are 308-redirected to the default city's
// equivalent.
//
// Auth is still client-side via AuthContext (backend at /api/auth/*).
import { NextResponse, type NextRequest } from 'next/server';
import { ALL_CITIES, DEFAULT_CITY } from './config/cities.config';

const KNOWN_CITY_PREFIXES = (ALL_CITIES as readonly string[]).map((c) => `/${c}`);

// Top-level paths that must NOT be rewritten under a city prefix.
const PASSTHROUGH = new Set(['login', 'auth', 'api', '_next', 'favicon.ico']);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bare root → default city home
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_CITY}`;
    return NextResponse.redirect(url, 308);
  }

  // Already city-scoped? Let it through unchanged.
  if (KNOWN_CITY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // Reserved top-level (auth, login, api, static) — let it through.
  const firstSegment = pathname.split('/').filter(Boolean)[0] ?? '';
  if (PASSTHROUGH.has(firstSegment)) {
    return NextResponse.next();
  }

  // Anything else (e.g. /map, /cards, /tonight, typos) → DEFAULT_CITY prefix.
  // 308 preserves method + search params on bookmarks / older social shares.
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_CITY}${pathname}`;
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Skip Next internals, API, and static assets — middleware only sees pages.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|404|_error|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)'],
};
