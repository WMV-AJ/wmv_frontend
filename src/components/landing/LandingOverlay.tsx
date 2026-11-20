'use client';

// The bottom row of the landing page: [city ▾] [Continue with Google], there
// from the first frame. Sign-in is required to enter a city, so a signed-out
// visitor gets no way past this row; a signed-in one gets [city ▾] [Enter →].
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { DEFAULT_CITY, CITIES, type CitySlug } from '@/config/cities.config';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from '@/components/auth/UserMenu';
import { trackEvent } from '@/lib/analytics/track';
import { safeNextPath } from '@/components/auth/RequireAuth';
import { CityPicker } from './CityPicker';
import { bodyFont } from '@/lib/theme/tokens';

const PRIMARY_PILL: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 1,
  minWidth: 0,
  gap: 8,
  padding: '0 18px',
  height: 44,
  borderRadius: 9999,
  background: '#fff',
  border: '1px solid rgba(255,255,255,0.6)',
  color: '#0a0a1a',
  fontFamily: bodyFont,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)',
};

const NOTE: React.CSSProperties = {
  maxWidth: 320,
  margin: 0,
  textAlign: 'center',
  color: 'rgba(255,255,255,0.85)',
  fontFamily: bodyFont,
  fontSize: 12.5,
  lineHeight: 1.45,
};

/** How long the button waits for the redirect to Google before giving up. */
const SIGN_IN_STALL_MS = 8000;

function GoogleSignInPill({ returnTo }: { returnTo: string }) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading) return;
    // signIn() navigates away. If we are still here, it did not start.
    const timer = window.setTimeout(() => setLoading(false), SIGN_IN_STALL_MS);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const handle = () => {
    setLoading(true);
    trackEvent('login_started', { provider: 'google' });
    signIn(returnTo);
  };

  return (
    <button type="button" onClick={handle} disabled={loading} style={{ ...PRIMARY_PILL, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
      {loading ? (
        <span
          style={{
            width: 16, height: 16, borderRadius: '50%', display: 'inline-block',
            border: '2px solid rgba(0,0,0,0.15)', borderTopColor: '#0a0a1a', animation: 'wmv-spin 0.8s linear infinite',
          }}
        />
      ) : (
        <>
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
}

/**
 * Google refuses sign-in inside the Instagram, Facebook and TikTok in-app
 * browsers, so there we point the visitor at their real browser instead of
 * showing a button that can only fail.
 */
function isInAppBrowser(userAgent: string): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|TikTok|musical_ly|Snapchat|Line\//i.test(userAgent);
}

function OpenInBrowser() {
  const [copied, setCopied] = useState(false);
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (isAndroid && typeof window !== 'undefined') {
    const { host, pathname, search } = window.location;
    return (
      <a href={`intent://${host}${pathname}${search}#Intent;scheme=https;end`} style={{ ...PRIMARY_PILL, textDecoration: 'none' }}>
        Open in your browser to sign in
      </a>
    );
  }
  return (
    <button type="button" onClick={copyLink} style={PRIMARY_PILL}>
      {copied ? 'Link copied. Paste it in Safari' : 'Copy link to open in Safari'}
    </button>
  );
}

interface LandingOverlayProps {
  /** Hide the signed-in avatar while the intro's Skip pill is using that corner. */
  hideUserMenu?: boolean;
}

const FOOTER_LINKS: Array<[string, string]> = [
  ['How it works', '/how-it-works'],
  ['FAQ', '/faq'],
  ['List your venue', '/list-your-venue'],
];

export function LandingOverlay({ hideUserMenu = false }: LandingOverlayProps = {}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [city, setCity] = useState<CitySlug>(DEFAULT_CITY);
  // Read once on the client: where a guarded page sent the visitor from, a
  // failed sign-in, and whether this is an in-app browser.
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [signInFailed, setSignInFailed] = useState(false);
  const [inApp, setInApp] = useState(false);
  // Auth can resolve before this subtree hydrates, so the first client render
  // must match the server's: treat auth as unresolved until mounted.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(safeNextPath(params.get('next')));
    setSignInFailed(params.has('error'));
    setInApp(isInAppBrowser(navigator.userAgent));
    setMounted(true);
  }, []);

  const pickCity = (slug: CitySlug) => {
    setCity(slug);
    // An explicit city choice wins over the page the visitor was sent from.
    setNextPath(null);
  };

  const cityName = CITIES[city]?.displayName ?? city;
  const resolving = !mounted || authLoading;
  const isAuthed = !resolving && !!user;
  const destination = nextPath ?? `/${city}`;

  let note: string | null = null;
  if (!resolving && !isAuthed && inApp) note = 'Google sign-in does not work inside this app. Open Where’s My Vibe in your browser to continue.';
  else if (!resolving && !isAuthed && signInFailed) note = 'Sign-in did not complete. Please try again.';

  return (
    <>
      {/* Top-right: avatar + sign-out menu, only when signed in */}
      {isAuthed && !hideUserMenu && (
        <div style={{ position: 'absolute', top: 'max(16px, env(safe-area-inset-top))', right: 16, zIndex: 50 }}>
          <UserMenu variant="compact" />
        </div>
      )}

      {/* Scrim so the row reads over any frame of the animation. */}
      <div
        aria-hidden
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 200, zIndex: 40,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.9) 62%, #000 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 'max(24px, calc(env(safe-area-inset-bottom) + 14px))',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          padding: '0 16px',
        }}
      >
        {note && <p role="status" style={NOTE}>{note}</p>}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, maxWidth: '100%' }}>
          <CityPicker value={city} onChange={pickCity} />
          {/* Reserve the button's space while auth resolves so the row does not jump. */}
          {resolving && <span aria-hidden style={{ ...PRIMARY_PILL, width: 190, opacity: 0.25, boxShadow: 'none' }} />}
          {!resolving && !isAuthed && (inApp ? <OpenInBrowser /> : <GoogleSignInPill returnTo={destination} />)}
          {isAuthed && (
            <button type="button" onClick={() => router.push(destination)} style={PRIMARY_PILL}>
              <span>{nextPath ? 'Continue' : `Enter ${cityName}`}</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
        <nav aria-label="About Where's My Vibe" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 18px' }}>
          {FOOTER_LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={(e) => { e.preventDefault(); router.push(href); }}
              style={{ color: 'rgba(255,255,255,0.55)', fontFamily: bodyFont, fontSize: 11, letterSpacing: '0.04em', textDecoration: 'none' }}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}
