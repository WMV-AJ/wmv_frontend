'use client';

// Shared top nav used by the homepage (/[city]) and the vibe listing page
// (/[city]/vibe/[vibeId]) so both have the identical masthead: logo + title,
// Map button, Cards button, and the auth corner widget.
import { useRouter } from 'next/navigation';
import { Map as MapIcon, List } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';
import AuthCornerWidget from '@/components/auth/AuthCornerWidget';

const T = {
  surface: '#14141f',
  ink: '#f5f2ed',
  inkMuted: '#a8a2b8',
  line: '#2a2638',
};

const serif = "var(--font-playfair), 'Playfair Display', Georgia, serif";

interface HomeMastheadProps {
  city: string;
  /** analytics: which screen the nav is rendered on (defaults to 'home') */
  from?: string;
}

export default function HomeMasthead({ city, from = 'home' }: HomeMastheadProps) {
  const router = useRouter();

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
            fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: 14,
            color: T.ink, letterSpacing: '-0.01em', lineHeight: 1,
          }}>Where&rsquo;s My Vibe</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => {
            trackEvent('nav_view_change', { from, to: 'map', source: 'header' });
            router.push(`/${city}/map`);
          }}
          className="w-8 h-8 md:w-6 md:h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ border: `1px solid ${T.line}`, background: T.surface, cursor: 'pointer', padding: 0 }}
          aria-label="Map"
        >
          <MapIcon className="w-3.5 h-3.5 md:w-3 md:h-3" style={{ color: T.inkMuted }} />
        </button>
        <button
          onClick={() => {
            trackEvent('nav_view_change', { from, to: 'cards', source: 'header' });
            router.push(`/${city}/cards`);
          }}
          className="w-8 h-8 md:w-6 md:h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ border: `1px solid ${T.line}`, background: T.surface, cursor: 'pointer', padding: 0 }}
          aria-label="Cards"
        >
          <List className="w-3.5 h-3.5 md:w-3 md:h-3" style={{ color: T.inkMuted }} />
        </button>
        {/* Auth state: real avatar when signed in, sign-in icon otherwise. */}
        <AuthCornerWidget />
      </div>
    </div>
  );
}
