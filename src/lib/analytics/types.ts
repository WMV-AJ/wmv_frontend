/**
 * Analytics event taxonomy. Keep this list authoritative — every event sent
 * through trackEvent() should appear here so dashboards can be built off a
 * known set of names.
 */
export type AnalyticsEventName =
  | 'page_view'
  | 'view_venue'
  | 'expand_event_card'
  | 'view_event'
  | 'click_instagram'
  | 'share_venue'
  | 'filter_applied'
  | 'search_performed'
  | 'nav_view_change'
  | 'login_started'
  | 'login_completed'
  | 'logout'
  | 'consent_given'
  | 'consent_denied';

export type AnalyticsProperties = Record<string, unknown>;

export interface TrackPayload {
  event_name: AnalyticsEventName;
  user_id?: string | null;
  anonymous_id: string;
  session_id: string;
  properties: AnalyticsProperties;
  page_path?: string;
  page_title?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  language?: string;
  timezone?: string;
  screen_size?: string;
  /** Active city slug — derived from the URL pathname. NULL on legacy paths. */
  city?: string;
}

export type ConsentStatus = 'granted' | 'denied' | 'undecided';

declare global {
  interface Window {
    // gtag is injected by the GA4 script tag in app/layout.tsx
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}
