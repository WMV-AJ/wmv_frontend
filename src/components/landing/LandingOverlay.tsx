'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { DEFAULT_CITY, CITIES, type CitySlug } from '@/config/cities.config';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from '@/components/auth/UserMenu';
import { trackEvent } from '@/lib/analytics/track';
import { CityPicker } from './CityPicker';

function GoogleSignInPill({ returnTo }: { returnTo: string }) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handle = () => {
    setLoading(true);
    trackEvent('login_started', { provider: 'google' });
    signIn(returnTo);
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '10px 16px',
        height: 48,
        borderRadius: 9999,
        background: '#fff',
        border: '1px solid rgba(255,255,255,0.6)',
        color: '#0a0a1a',
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.7 : 1,
        boxShadow:
          '0 8px 24px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2) inset',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
      onMouseEnter={(e) => {
        if (loading) return;
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow =
          '0 14px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.3) inset';
      }}
      onMouseLeave={(e) => {
        if (loading) return;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow =
          '0 10px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.2) inset';
      }}
    >
      {loading ? (
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '2px solid rgba(0,0,0,0.15)',
            borderTopColor: '#0a0a1a',
            animation: 'wmv-spin 0.8s linear infinite',
            display: 'inline-block',
          }}
        />
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
}

export function LandingOverlay() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [city, setCity] = useState<CitySlug>(DEFAULT_CITY);
  const cityName = CITIES[city].displayName;
  const isAuthed = !!user;

  return (
    <>
      {/* Top-right: avatar + sign-out menu, only when signed in */}
      {!authLoading && isAuthed && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 50,
          }}
        >
          <UserMenu variant="compact" />
        </div>
      )}

      {/* Bottom-center: [Continue with Google] [city ▾] [→] — single row */}
      <div
        style={{
          position: 'fixed',
          bottom: 'max(28px, env(safe-area-inset-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
          maxWidth: '94vw',
        }}
      >
        {!authLoading && !isAuthed && <GoogleSignInPill returnTo={`/${city}`} />}
        <CityPicker value={city} onChange={setCity} />
        <button
            type="button"
            onClick={() => router.push(`/${city}`)}
            aria-label={`Enter ${cityName}`}
            title={`Enter ${cityName}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)',
              border: '1.5px solid rgba(255,255,255,0.6)',
              color: '#0a0a1a',
              cursor: 'pointer',
              boxShadow:
                '0 8px 28px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.2) inset',
              transition: 'transform 160ms ease, box-shadow 160ms ease, background 160ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.boxShadow =
                '0 12px 36px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.3) inset';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
              e.currentTarget.style.boxShadow =
                '0 8px 28px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.2) inset';
            }}
          >
          <ArrowRight size={22} strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}
