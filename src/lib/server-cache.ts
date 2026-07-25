// ── SERVER-SIDE DERIVED-DATA CACHE ───────────────────────────────────
// Module-level TTL cache with in-flight promise dedup and
// stale-while-revalidate, for the Next API proxy routes.
//
// Why not `fetch(..., { next: { revalidate } })`? Next's data cache silently
// refuses to cache responses larger than 2MB, and the backend's full
// /api/events payload exceeds that — so `revalidate` was a no-op and every
// cold hit paid the full upstream fetch + JSON parse + derivation (measured
// 6s TTFB on /api/filter-options). Caching the *derived* output (6KB facets,
// ~320KB venue array) sidesteps the limit entirely.
//
// Safety: prod runs as a single pm2 fork process per port (standalone
// build), so a module-level Map is process-wide. If pm2 is ever switched to
// cluster mode each worker holds its own cache — still correct, just N×
// upstream calls. Cache resets on restart/deploy (fine — first hit warms it).
//
// The in-flight dedup is what prevents the upstream thundering herd (the
// observed 503s): concurrent requests for the same key share one promise.

interface CacheEntry<T> {
  value: T;
  /** Entry is fresh until this time — served directly. */
  freshUntil: number;
  /** Entry is servable-stale until this time — served + revalidated in bg. */
  staleUntil: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Get `key` from the cache, or compute it via `fetcher`.
 *
 * - Fresh hit → returned immediately.
 * - Stale-but-servable hit → returned immediately, refreshed in background.
 * - Miss/expired → callers share ONE in-flight `fetcher()` (dedup).
 * - `fetcher` failure with a servable-stale entry → stale value is returned
 *   instead of surfacing the error (upstream blips don't 5xx the client).
 */
export async function getCached<T>(
  key: string,
  ttlMs: number,
  staleMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key) as CacheEntry<T> | undefined;

  if (entry && now < entry.freshUntil) {
    return entry.value;
  }

  if (entry && now < entry.staleUntil) {
    // Serve stale, refresh in background (deduped).
    void refresh(key, ttlMs, staleMs, fetcher);
    return entry.value;
  }

  // Miss or fully expired — everyone waits on one shared fetch.
  try {
    return (await refresh(key, ttlMs, staleMs, fetcher)) as T;
  } catch (err) {
    if (entry) {
      // Expired-but-present beats a 5xx.
      return entry.value;
    }
    throw err;
  }
}

function refresh<T>(
  key: string,
  ttlMs: number,
  staleMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const p = (async () => {
    try {
      const value = await fetcher();
      const now = Date.now();
      store.set(key, { value, freshUntil: now + ttlMs, staleUntil: now + ttlMs + staleMs });
      return value;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, p);
  // Background refreshes must not become unhandled rejections.
  p.catch(() => {});
  return p;
}
