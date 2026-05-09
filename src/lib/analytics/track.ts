/**
 * Analytics tracking helper.
 *
 * Single entry point for all event firing. Each call dual-fires to:
 *   1. GA4 via window.gtag (loaded by app/layout.tsx)
 *   2. The first-party backend at POST {NEXT_PUBLIC_BACKEND_URL}/api/analytics/track
 *
 * Both destinations are gated on the consent state in localStorage. Until the
 * user accepts the cookie banner, every call is a no-op (anonymous_id is still
 * generated so we have continuity across the consent boundary).
 *
 * All public functions are SSR-safe — they early-return if window is undefined.
 */
import type {
  AnalyticsEventName,
  AnalyticsProperties,
  ConsentStatus,
  TrackPayload,
} from './types';

const ANONYMOUS_ID_KEY = 'wmv_anonymous_id';
const SESSION_ID_KEY = 'wmv_session_id';
const UTM_KEY = 'wmv_utm';
const CONSENT_KEY = 'analytics_consent';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min idle

let cachedUserId: string | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function uuid(): string {
  // crypto.randomUUID is available in all browsers we target (Safari 14+, etc.)
  if (isBrowser() && typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback — not cryptographically strong, but fine for analytics IDs.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getConsentStatus(): ConsentStatus {
  if (!isBrowser()) return 'undecided';
  const v = window.localStorage.getItem(CONSENT_KEY);
  if (v === 'granted' || v === 'denied') return v;
  return 'undecided';
}

export function setConsentStatus(status: 'granted' | 'denied'): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(CONSENT_KEY, status);
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: status === 'granted' ? 'granted' : 'denied',
      ad_storage: status === 'granted' ? 'granted' : 'denied',
    });
  }
}

export function getOrCreateAnonymousId(): string {
  if (!isBrowser()) return 'ssr';
  let id = window.localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    id = uuid();
    window.localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
}

interface SessionRecord {
  id: string;
  lastActivity: number;
}

export function getOrCreateSessionId(): string {
  if (!isBrowser()) return 'ssr';
  const now = Date.now();
  const raw = window.sessionStorage.getItem(SESSION_ID_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SessionRecord;
      if (parsed.id && now - parsed.lastActivity < SESSION_TIMEOUT_MS) {
        parsed.lastActivity = now;
        window.sessionStorage.setItem(SESSION_ID_KEY, JSON.stringify(parsed));
        return parsed.id;
      }
    } catch {
      // fall through to fresh
    }
  }
  const fresh: SessionRecord = { id: uuid(), lastActivity: now };
  window.sessionStorage.setItem(SESSION_ID_KEY, JSON.stringify(fresh));
  return fresh.id;
}

interface UtmSnapshot {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

/**
 * Capture UTM params from the current URL on first load and persist them for
 * the session (sessionStorage). Subsequent navigations within the same session
 * keep the original attribution.
 */
function captureUtm(): UtmSnapshot {
  if (!isBrowser()) return {};
  const existing = window.sessionStorage.getItem(UTM_KEY);
  if (existing) {
    try {
      return JSON.parse(existing) as UtmSnapshot;
    } catch {
      // fall through
    }
  }
  const params = new URLSearchParams(window.location.search);
  const snapshot: UtmSnapshot = {};
  (['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const).forEach((k) => {
    const v = params.get(k);
    if (v) snapshot[k] = v;
  });
  if (Object.keys(snapshot).length > 0) {
    window.sessionStorage.setItem(UTM_KEY, JSON.stringify(snapshot));
  }
  return snapshot;
}

export function setUserId(userId: string | null): void {
  cachedUserId = userId;
  if (isBrowser() && typeof window.gtag === 'function') {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (measurementId) {
      window.gtag('config', measurementId, { user_id: userId || undefined });
    }
  }
}

function buildPayload(
  name: AnalyticsEventName,
  properties: AnalyticsProperties,
  pathOverride?: string,
  titleOverride?: string,
): TrackPayload {
  const utm = captureUtm();
  const lang = typeof navigator !== 'undefined' ? navigator.language : undefined;
  const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
  const screen_size =
    typeof window !== 'undefined' && window.screen
      ? `${window.screen.width}x${window.screen.height}`
      : undefined;

  return {
    event_name: name,
    user_id: cachedUserId,
    anonymous_id: getOrCreateAnonymousId(),
    session_id: getOrCreateSessionId(),
    properties,
    page_path: pathOverride ?? (isBrowser() ? window.location.pathname : undefined),
    page_title: titleOverride ?? (isBrowser() ? document.title : undefined),
    referrer: isBrowser() ? document.referrer || undefined : undefined,
    ...utm,
    language: lang,
    timezone: tz,
    screen_size,
  };
}

function postToBackend(payload: TrackPayload): void {
  if (!isBrowser()) return;
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!base) return;
  const url = `${base.replace(/\/$/, '')}/api/analytics/track`;
  const body = JSON.stringify(payload);
  // Prefer sendBeacon when leaving the page; fetch with keepalive otherwise.
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    }
  } catch {
    // fall through to fetch
  }
  // Fire-and-forget fetch; never throws to the caller.
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // intentionally swallowed
  });
}

function fireGtag(name: AnalyticsEventName, payload: TrackPayload): void {
  if (!isBrowser() || typeof window.gtag !== 'function') return;
  window.gtag('event', name, {
    ...payload.properties,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    page_path: payload.page_path,
    page_title: payload.page_title,
    user_id: payload.user_id || undefined,
  });
}

export function trackEvent(name: AnalyticsEventName, properties: AnalyticsProperties = {}): void {
  if (!isBrowser()) return;
  if (getConsentStatus() !== 'granted') return;
  const payload = buildPayload(name, properties);
  fireGtag(name, payload);
  postToBackend(payload);
}

export function trackPageView(path?: string, title?: string): void {
  if (!isBrowser()) return;
  if (getConsentStatus() !== 'granted') return;
  const payload = buildPayload('page_view', {}, path, title);
  // Send GA4 page_view via gtag config (so referrer/title pick up automatically),
  // plus a custom event so it lands in our first-party table.
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: payload.page_path,
      page_title: payload.page_title,
      page_location: window.location.href,
    });
  }
  postToBackend(payload);
}

/** Initialise IDs + UTM capture on first call. Idempotent. */
export function initAnalytics(): void {
  if (!isBrowser()) return;
  getOrCreateAnonymousId();
  getOrCreateSessionId();
  captureUtm();
}
