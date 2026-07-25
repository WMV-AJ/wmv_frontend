'use client';

import React, { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import {
  getConsentStatus,
  setConsentStatus,
  trackEvent,
  trackPageView,
} from '@/lib/analytics/track';

/**
 * Sticky bottom banner that gates analytics firing.
 *   - On Accept: persists 'granted', fires consent_given + a deferred page_view
 *     for the current path so the first hit isn't lost.
 *   - On Reject: persists 'denied', updates GA4 consent mode.
 *   - Hides automatically once any choice is recorded.
 */
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsentStatus() === 'undecided');
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    setConsentStatus('granted');
    setVisible(false);
    // Now that consent is granted, the very first page_view from
    // AnalyticsProvider has already been a no-op — re-fire one for the
    // current path so the entry hit is captured.
    if (typeof window !== 'undefined') {
      trackEvent('consent_given', {});
      trackPageView(window.location.pathname, document.title);
    }
  };

  const handleReject = () => {
    setConsentStatus('denied');
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-3 left-3 right-3 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[70] rounded-2xl px-4 py-3 md:px-5 md:py-4"
      style={{
        background: 'rgba(15, 15, 30, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
        color: '#fff',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Cookie className="w-5 h-5 text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1">We use cookies for analytics</p>
          <p className="text-xs text-gray-300 leading-relaxed">
            We collect anonymous usage data to improve the experience. No third-party advertising.
            You can change this any time.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleReject}
              className="text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)' }}
            >
              Reject
            </button>
            <button
              onClick={handleAccept}
              className="text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              style={{
                background: 'linear-gradient(135deg, #ca8a04 0%, #ec4899 100%)',
                color: '#fff',
                boxShadow: '0 0 12px rgba(202, 138, 4, 0.35)',
              }}
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
