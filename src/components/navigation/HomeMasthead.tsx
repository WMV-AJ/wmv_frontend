'use client';

// Shared top nav used by the homepage (/[city]) and the vibe listing page
// (/[city]/vibe/[vibeId]) so both have the identical masthead: logo + title,
// a search field, and the auth corner widget. The Map and Cards icon buttons
// were removed — both views are reachable from the bottom nav pill.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';
import AuthCornerWidget from '@/components/auth/AuthCornerWidget';
import ThemeToggle from './ThemeToggle';
import { WORDMARK_STYLE, bodyFont, displayFont } from '@/lib/theme/tokens';

// Site theme tokens (globals.css — light by default, .dark for dark).
const T = {
  surface: 'var(--wmv-surface)',
  ink: 'var(--wmv-ink)',
  inkMuted: 'var(--wmv-ink-muted)',
  line: 'var(--wmv-line)',
};


interface HomeMastheadProps {
  city: string;
  /** analytics: which screen the nav is rendered on (defaults to 'home') */
  from?: string;
}

export default function HomeMasthead({ city, from = 'home' }: HomeMastheadProps) {
  const router = useRouter();
  const [q, setQ] = useState('');
  // Home shows the search as an icon; tapping it opens the field in the bar.
  const iconSearch = from === 'home';
  const [searchOpen, setSearchOpen] = useState(false);
  const showField = !iconSearch || searchOpen;

  const submitSearch = (ev: React.FormEvent) => {
    ev.preventDefault();
    const term = q.trim();
    trackEvent('home_search_submit', { city, q: term, source: 'masthead' });
    router.push(`/${city}/cards?date=today${term ? `&q=${encodeURIComponent(term)}` : ''}`);
  };

  return (
    <div style={{
      padding: '14px 18px 12px',
      borderBottom: `1px solid ${T.line}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src="/wmv-logo.gif"
          alt="Where's My Vibe"
          onClick={() => router.push(`/${city}`)}
          style={{
            width: 28, height: 28, objectFit: 'cover',
            borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
          }}
        />
        <div>
          <div style={{
            ...(from === 'home'
              ? WORDMARK_STYLE
              : { fontFamily: displayFont, fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', lineHeight: 1 }),
            color: T.ink,
          }}>Where&rsquo;s My Vibe</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flex: 1, minWidth: 0, marginLeft: 12 }}>
        {!showField && (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search events and venues"
            style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
              border: `1px solid ${T.line}`, background: T.surface, color: T.ink, cursor: 'pointer',
            }}
          >
            <Search style={{ width: 15, height: 15 }} />
          </button>
        )}
        {showField && <form
          onSubmit={submitSearch}
          style={{
            flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 7,
            border: `1px solid ${T.line}`, background: T.surface,
            borderRadius: 999, padding: '7px 12px',
          }}
        >
          <Search style={{ width: 14, height: 14, color: T.inkMuted, flexShrink: 0 }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Event, venue, etc"
            aria-label="Search events and venues"
            autoFocus={iconSearch}
            onBlur={() => { if (iconSearch && !q.trim()) setSearchOpen(false); }}
            style={{
              flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
              color: T.ink, fontFamily: bodyFont, fontSize: 12, fontWeight: 500,
            }}
          />
        </form>}
        <ThemeToggle />
        {/* Auth state: real avatar when signed in, sign-in icon otherwise. */}
        <AuthCornerWidget />
      </div>
    </div>
  );
}
