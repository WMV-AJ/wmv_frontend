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
 * Sticky bottom banner asking whether we may keep an ID in this browser.
 * Visits are counted either way (see lib/analytics/track.ts); the answer
 * decides whether the visitor is recognised on later days.
 *   - On Accept: persists 'granted' and fires consent_given, which the backend
 *     uses to move this visit's earlier events onto the new stored ID.
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
    // Our own table already has this page view from before the answer. GA4
    // only starts now, so it alone gets the current page again.
    if (typeof window !== 'undefined') {
      trackEvent('consent_given', {});
      trackPageView(window.location.pathname, document.title, { gaOnly: true });
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
        background: 'var(--wmv-chrome)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--wmv-line)',
        boxShadow: '0 12px 32px var(--wmv-shadow)',
        color: 'var(--wmv-ink)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Cookie className="w-5 h-5 text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1">Can we remember this browser?</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--wmv-ink-muted)' }}>
            We count visits anonymously and store nothing on your device to do it. If you accept,
            we save a random ID here so we can recognise return visits. No third-party advertising.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleReject}
              className="text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              style={{ background: 'var(--wmv-overlay)', color: 'var(--wmv-ink)', border: '1px solid var(--wmv-line)' }}
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
