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
  | 'share_event'
  | 'filter_applied'
  | 'search_performed'
  | 'nav_view_change'
  | 'login_started'
  | 'login_completed'
  | 'logout'
  | 'consent_given'
  | 'consent_denied'
  // Home-page tiles (these were already fired by [city]/page.tsx but missing here)
  | 'vibe_pill_click'
  | 'area_row_click'
  // Landing intro + marketing funnels
  //   Visitor funnel: page_view(/) → intro_completed|intro_skipped →
  //     landing_cta_click → page_view(/{city}) → nav_view_change → view_event
  //   B2B funnel: marketing_cta_click{cta:'list_venue'} →
  //     page_view(/list-your-venue) → venue_lead_click{channel}
  | 'intro_skipped'
  | 'intro_completed'
  | 'landing_cta_click'
  | 'marketing_cta_click'
  | 'venue_lead_click'
  | 'faq_expand';

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
