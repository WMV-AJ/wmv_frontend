'use client';

import { useEffect } from 'react';
import { setAuthToken } from '@/contexts/AuthContext';

/**
 * Landing page for the post-OAuth redirect from the backend.
 * The backend appends `#token=...&return_to=...` to the URL fragment;
 * we move the token to localStorage and push the user to `return_to`.
 *
 * Using a fragment (`#`) keeps the token out of HTTP request lines and
 * any access logs / referrer headers along the way.
 */
export default function AuthCompletePage() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const rawReturnTo = params.get('return_to') || '/';
    // Allow only same-origin root-relative paths
    const returnTo = rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : '/';

    if (token) {
      setAuthToken(token);
    }
    // Replace so the URL fragment isn't preserved in history
    window.location.replace(returnTo);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a14', color: '#fff' }}>
      <div className="text-sm text-gray-300">Signing you in…</div>
    </div>
  );
}
