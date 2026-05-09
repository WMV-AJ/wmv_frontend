'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { initAnalytics, setUserId, trackEvent, trackPageView } from './track';

/**
 * Wires analytics into the app:
 *   - inits anonymous_id / session_id / UTM capture on mount
 *   - fires page_view on every pathname / search-param change
 *   - syncs user_id from AuthContext, fires login_completed / logout transitions
 *
 * Must live inside <AuthProvider> so useAuth() resolves.
 */
export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const lastUserIdRef = useRef<string | null>(null);
  const initRanRef = useRef(false);

  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;
    initAnalytics();
  }, []);

  // page_view on route change. searchParams in deps so ?utm=... transitions count.
  useEffect(() => {
    if (!pathname) return;
    trackPageView(pathname, typeof document !== 'undefined' ? document.title : undefined);
  }, [pathname, searchParams]);

  // Sync user_id and fire login/logout events on transitions.
  useEffect(() => {
    if (loading) return;
    const newId = user?.id ?? null;
    const oldId = lastUserIdRef.current;
    if (newId === oldId) return;

    lastUserIdRef.current = newId;
    setUserId(newId);

    if (oldId === null && newId !== null) {
      // Only Google OAuth is supported right now; if more providers are added,
      // expose `provider` on the AuthUser shape and read it here.
      trackEvent('login_completed', { provider: 'google', user_id: newId });
    } else if (oldId !== null && newId === null) {
      trackEvent('logout', { user_id: oldId });
    }
  }, [user, loading]);

  return <>{children}</>;
}
