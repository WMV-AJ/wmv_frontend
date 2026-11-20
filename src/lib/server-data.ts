// ── SERVER-SIDE DATA HELPERS (SEO/metadata layer) ────────────────────
// Used by generateMetadata, sitemap.ts, and JSON-LD builders in the server
// page wrappers. Talks to the backend DIRECTLY over loopback (WMV_API_BASE /
// BACKEND_INTERNAL_URL) — never NEXT_PUBLIC_BACKEND_URL, which resolves to
// this same host and would loop through nginx.
//
// Every helper is wrapped in try/catch with a static fallback: metadata and
// sitemaps must never crash a build or a request when the backend is down
// (repo convention — see cities.config.ts).
import { getCached } from '@/lib/server-cache';
import { ALL_CITIES, CITIES, getCityConfig } from '@/config/cities.config';

const BACKEND =
  (process.env.WMV_API_BASE || process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:2300').replace(/\/$/, '');

export interface CityRegistryEntry {
  slug: string;
  displayName: string;
}

/** The parts of a city's config that server-rendered pages need. */
export interface CityServerConfig {
  slug: string;
  displayName: string;
  country: string;
  currency: string;
  utcOffsetHours: number;
}

interface RawRegistryCity {
  slug: string;
  displayName?: string;
  status?: string;
  country?: string;
  currency?: string;
  utcOffsetHours?: number | string;
}

/** Active cities straight from the backend registry. Throws when the backend is unreachable. */
async function fetchRegistry(): Promise<RawRegistryCity[]> {
  return getCached('seo:registry', 60_000, 60 * 60_000, async () => {
    const r = await fetch(`${BACKEND}/api/cities`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`cities upstream ${r.status}`);
    const j = await r.json();
    if (!j.success || !Array.isArray(j.cities)) throw new Error('bad cities payload');
    const active = j.cities.filter((c: RawRegistryCity) => !c.status || c.status === 'active');
    if (active.length === 0) throw new Error('empty cities payload');
    return active as RawRegistryCity[];
  });
}

/** Active cities from the backend registry; static config fallback. */
export async function getActiveCities(): Promise<CityRegistryEntry[]> {
  try {
    const registry = await fetchRegistry();
    return registry.map((c) => ({
      slug: c.slug,
      displayName: c.displayName || getCityConfig(c.slug).displayName,
    }));
  } catch {
    return (ALL_CITIES as readonly string[]).map((slug) => ({
      slug,
      displayName: getCityConfig(slug).displayName,
    }));
  }
}

/**
 * Whether a slug is a real city. Used to return a true 404 for made-up paths.
 * Fails open: if the registry cannot be reached, an unknown slug is allowed
 * through so a backend blip never turns a live city into a 404.
 */
export async function isKnownCity(slug: string): Promise<boolean> {
  if ((ALL_CITIES as readonly string[]).includes(slug)) return true;
  try {
    const registry = await fetchRegistry();
    return registry.some((c) => c.slug === slug);
  } catch {
    return true;
  }
}

/**
 * Display name, country, currency and UTC offset for a city, from the
 * registry. The static config only knows Dubai and Bangalore, so a server
 * render of Mumbai or Delhi would otherwise use Dubai's timezone and currency.
 */
export async function getCityServerConfig(slug: string): Promise<CityServerConfig> {
  const fallback = getCityConfig(slug);
  const fromStatic: CityServerConfig = {
    slug,
    displayName: fallback.displayName,
    country: fallback.country,
    currency: fallback.currency,
    utcOffsetHours: fallback.utcOffsetHours,
  };
  try {
    const entry = (await fetchRegistry()).find((c) => c.slug === slug);
    if (!entry) return fromStatic;
    const offset = Number(entry.utcOffsetHours);
    return {
      slug,
      displayName: entry.displayName || fromStatic.displayName,
      country: entry.country || fromStatic.country,
      currency: entry.currency || fromStatic.currency,
      utcOffsetHours: Number.isFinite(offset) ? offset : fromStatic.utcOffsetHours,
    };
  } catch {
    return fromStatic;
  }
}

/** Display name for a city slug, registry-aware with config fallback. */
export async function getCityDisplayName(slug: string): Promise<string> {
  const cities = await getActiveCities();
  return cities.find((c) => c.slug === slug)?.displayName || getCityConfig(slug).displayName;
}

/** Whether we have a REAL static config for this city (not the default-city fallback). */
export function hasStaticCityConfig(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(CITIES, slug);
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Full event list for a city (raw backend records). Cached 5min/1h. Empty array on failure. */
export async function getCityEvents(city: string): Promise<any[]> {
  try {
    return await getCached(`seo:events:${city}`, 5 * 60_000, 60 * 60_000, async () => {
      const r = await fetch(`${BACKEND}/api/events?city=${encodeURIComponent(city)}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`events upstream ${r.status}`);
      const j = await r.json();
      return Array.isArray(j?.data) ? j.data : [];
    });
  } catch {
    return [];
  }
}

/** Single event by id. Cached 60s/10min. Null on failure. */
export async function getEventById(city: string, id: string): Promise<any | null> {
  try {
    return await getCached(`seo:event:${city}:${id}`, 60_000, 10 * 60_000, async () => {
      const r = await fetch(
        `${BACKEND}/api/event/${encodeURIComponent(id)}?city=${encodeURIComponent(city)}`,
        { cache: 'no-store' },
      );
      if (!r.ok) throw new Error(`event upstream ${r.status}`);
      const j = await r.json();
      return j?.data?.event ?? j?.event ?? j?.data ?? null;
    });
  } catch {
    return null;
  }
}
