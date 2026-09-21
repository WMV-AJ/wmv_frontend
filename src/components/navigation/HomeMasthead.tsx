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
import { bodyFont, displayFont } from '@/lib/theme/tokens';

const T = {
  surface: '#14141f',
  ink: '#f5f2ed',
  inkMuted: '#a8a2b8',
  line: '#2a2638',
};


interface HomeMastheadProps {
  city: string;
  /** analytics: which screen the nav is rendered on (defaults to 'home') */
  from?: string;
}

export default function HomeMasthead({ city, from = 'home' }: HomeMastheadProps) {
  const router = useRouter();
  const [q, setQ] = useState('');

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
            fontFamily: displayFont, fontWeight: 700, fontSize: 14,
            color: T.ink, letterSpacing: '-0.01em', lineHeight: 1,
          }}>Where&rsquo;s My Vibe</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, marginLeft: 12 }}>
        <form
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
            style={{
              flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
              color: T.ink, fontFamily: bodyFont, fontSize: 12, fontWeight: 500,
            }}
          />
        </form>
        {/* Auth state: real avatar when signed in, sign-in icon otherwise. */}
        <AuthCornerWidget />
      </div>
    </div>
  );
}
