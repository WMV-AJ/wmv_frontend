/**
 * Analytics tracking helper.
 *
 * Single entry point for all event firing. Each call dual-fires to:
 *   1. GA4 via window.gtag (loaded by app/layout.tsx)
 *   2. The first-party backend at POST {NEXT_PUBLIC_BACKEND_URL}/api/analytics/track
 *
 * Consent decides how a visitor is identified, not whether a visit is counted:
 *   - Accepted: a random browser ID and visit ID are kept in the browser's
 *     storage and sent with every event, and GA4 runs if it is configured.
 *   - Not accepted (undecided or rejected): nothing is written to storage and
 *     GA4 never fires. The backend still receives the event, marked
 *     'cookieless', and gives the visitor an ID that lasts one day.
 *
 * All public functions are SSR-safe — they early-return if window is undefined.
 */
import type {
  AnalyticsEventName,
  AnalyticsProperties,
  ConsentStatus,
  TrackPayload,
} from './types';
import { ALL_CITIES } from '@/config/cities.config';

/** Derive the city slug from the current URL. Returns null for non-city paths
 *  (login, auth, etc.). The backend further validates against ALL_CITIES, but
 *  doing it client-side keeps the wire format clean. */
function extractCityFromPath(): string | null {
  if (!isBrowser()) return null;
  const first = window.location.pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  return first && (ALL_CITIES as readonly string[]).includes(first) ? first : null;
}

const ANONYMOUS_ID_KEY = 'wmv_anonymous_id';
const SESSION_ID_KEY = 'wmv_session_id';
const UTM_KEY = 'wmv_utm';
const CONSENT_KEY = 'analytics_consent';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min idle
/** Sent as anonymous_id and session_id when the visitor has no stored ID. Must match the backend. */
const COOKIELESS_MARKER = 'cookieless';

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

/** Campaign tags on the link the visitor followed, read from the current URL. */
function utmFromUrl(): UtmSnapshot {
  if (!isBrowser()) return {};
  const params = new URLSearchParams(window.location.search);
  const snapshot: UtmSnapshot = {};
  (['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const).forEach((k) => {
    const v = params.get(k);
    if (v) snapshot[k] = v;
  });
  return snapshot;
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
  const snapshot = utmFromUrl();
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


/** Assistants whose answers link out to the web, by the host a click arrives from. */
const AI_REFERRER_HOSTS: Record<string, string> = {
  'chatgpt.com': 'chatgpt',
  'chat.openai.com': 'chatgpt',
  'perplexity.ai': 'perplexity',
  'claude.ai': 'claude',
  'gemini.google.com': 'gemini',
  'copilot.microsoft.com': 'copilot',
};

/** Which AI assistant sent this visit, or null for any other referrer. */
export function aiSourceFromReferrer(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    return AI_REFERRER_HOSTS[host] ?? null;
  } catch {
    return null;
  }
}

function buildPayload(
  name: AnalyticsEventName,
  properties: AnalyticsProperties,
  pathOverride?: string,
  titleOverride?: string,
): TrackPayload {
  // Without consent nothing may be written to the browser's storage, so the
  // stored IDs and the saved campaign tags are only used once it is granted.
  const consented = getConsentStatus() === 'granted';
  const utm = consented ? captureUtm() : utmFromUrl();
  const lang = typeof navigator !== 'undefined' ? navigator.language : undefined;
  const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
  const screen_size =
    typeof window !== 'undefined' && window.screen
      ? `${window.screen.width}x${window.screen.height}`
      : undefined;

  const aiSource = isBrowser() ? aiSourceFromReferrer(document.referrer) : null;

  // Some events carry the account ID as a property; it is not sent without consent.
  const sentProperties: AnalyticsProperties = { ...properties };
  if (!consented) delete sentProperties.user_id;

  return {
    event_name: name,
    user_id: consented ? cachedUserId : null,
    anonymous_id: consented ? getOrCreateAnonymousId() : COOKIELESS_MARKER,
    session_id: consented ? getOrCreateSessionId() : COOKIELESS_MARKER,
    // ai_source rides in properties so the backend schema needs no change.
    properties: aiSource ? { ...sentProperties, ai_source: aiSource } : sentProperties,
    page_path: pathOverride ?? (isBrowser() ? window.location.pathname : undefined),
    page_title: titleOverride ?? (isBrowser() ? document.title : undefined),
    referrer: isBrowser() ? document.referrer || undefined : undefined,
    ...utm,
    language: lang,
    timezone: tz,
    screen_size,
    city: extractCityFromPath() ?? undefined,
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

/** Browsers driven by automation (tests, some crawlers) are never counted. */
function isAutomated(): boolean {
  return typeof navigator !== 'undefined' && navigator.webdriver === true;
}

function fireGtag(name: AnalyticsEventName, payload: TrackPayload): void {
  if (!isBrowser() || typeof window.gtag !== 'function') return;
  if (getConsentStatus() !== 'granted') return;
  window.gtag('event', name, {
    ...payload.properties,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    page_path: payload.page_path,
    page_title: payload.page_title,
    user_id: payload.user_id || undefined,
  });
}

export function trackEvent(name: AnalyticsEventName, properties: AnalyticsProperties = {}): void {
  if (!isBrowser() || isAutomated()) return;
  const payload = buildPayload(name, properties);
  fireGtag(name, payload);
  postToBackend(payload);
}

/**
 * Record a page view. `gaOnly` sends it to GA4 alone: the cookie banner uses
 * it on Accept, when our own table already holds this page view from before
 * the visitor answered but GA4, which waits for consent, does not.
 */
export function trackPageView(path?: string, title?: string, options: { gaOnly?: boolean } = {}): void {
  if (!isBrowser() || isAutomated()) return;
  const payload = buildPayload('page_view', {}, path, title);
  // Send GA4 page_view via gtag config (so referrer/title pick up automatically),
  // plus a custom event so it lands in our first-party table.
  if (typeof window.gtag === 'function' && getConsentStatus() === 'granted') {
    window.gtag('event', 'page_view', {
      page_path: payload.page_path,
      page_title: payload.page_title,
      page_location: window.location.href,
    });
  }
  if (!options.gaOnly) postToBackend(payload);
}

/** Initialise IDs + UTM capture on first call. Idempotent. Does nothing until analytics is accepted. */
export function initAnalytics(): void {
  if (!isBrowser()) return;
  if (getConsentStatus() !== 'granted') return;
  getOrCreateAnonymousId();
  getOrCreateSessionId();
  captureUtm();
}
