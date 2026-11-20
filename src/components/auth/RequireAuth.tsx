'use client';

// Sign-in is required for every city page. Auth lives in the browser (a token
// in localStorage, checked against the backend), so this guard is client-side:
// the server still renders the page, and a signed-out visitor is sent to the
// landing page with `?next=` so they return here after signing in.
//
// A visitor with a token is let through at once and verified in the
// background; a 401 clears the token (AuthContext) and the redirect follows.
// A network failure keeps the token, so a flaky connection never logs
// anyone out.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getAuthToken, useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { noteNavigation } from '@/lib/nav-back';

/** Only same-site, root-relative paths may be used as a return target. */
export function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;
  return raw;
}

function goToSignIn(): void {
  const here = `${window.location.pathname}${window.location.search}`;
  window.location.replace(`/?next=${encodeURIComponent(here)}`);
}

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [blocked, setBlocked] = useState(false);

  // Count page changes inside the site, for the event page's back arrow.
  const pathname = usePathname();
  const firstPath = useRef(true);
  useEffect(() => {
    if (firstPath.current) firstPath.current = false;
    else noteNavigation();
  }, [pathname]);

  // Before first paint: no token means no session, so cover the page and leave.
  useBrowserLayoutEffect(() => {
    if (getAuthToken()) return;
    setBlocked(true);
    goToSignIn();
  }, []);

  // After the backend answers: the token was rejected and has been cleared.
  useEffect(() => {
    if (loading || user || getAuthToken()) return;
    setBlocked(true);
    goToSignIn();
  }, [loading, user]);

  return (
    <>
      {children}
      {blocked && <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 2147483647, background: '#000' }} />}
    </>
  );
}
