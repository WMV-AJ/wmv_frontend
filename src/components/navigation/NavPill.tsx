'use client';

// Floating 3-segment navigator (Home / Map / List) shared by the core views.
// The current view's segment expands to icon + label on a gold fill; the
// other two collapse to bare dim icons. Fixed bottom-center, safe-area
// aware; per-page bottomOffset keeps it clear of page-specific bottom UI
// (map card carousel, cards-page filter bar).
import { useRouter } from 'next/navigation';
import { Home, Map as MapIcon, List } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';
import { T, mono } from '@/lib/theme/tokens';

export type NavPillView = 'home' | 'map' | 'cards';

interface NavPillProps {
  city: string;
  active: NavPillView;
  /** Extra px above the safe-area bottom (default 16). */
  bottomOffset?: number;
}

const SEGMENTS: Array<{ view: NavPillView; label: string; Icon: typeof Home; path: (city: string) => string }> = [
  { view: 'home', label: 'Home', Icon: Home, path: (c) => `/${c}` },
  { view: 'map', label: 'Map', Icon: MapIcon, path: (c) => `/${c}/map` },
  { view: 'cards', label: 'List', Icon: List, path: (c) => `/${c}/cards` },
];

export default function NavPill({ city, active, bottomOffset = 16 }: NavPillProps) {
  const router = useRouter();

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: `max(${bottomOffset}px, calc(env(safe-area-inset-bottom) + ${bottomOffset}px))`,
        zIndex: 45,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: 4,
        borderRadius: 999,
        background: 'rgba(20,20,31,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${T.lineFaint}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {SEGMENTS.map(({ view, label, Icon, path }) => {
        const isActive = view === active;
        return (
          <button
            key={view}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              if (isActive) return;
              trackEvent('nav_view_change', { from: active, to: view, source: 'nav_pill' });
              router.push(path(city));
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              height: 38,
              padding: isActive ? '0 18px' : '0 13px',
              borderRadius: 999,
              background: isActive ? T.accent : 'transparent',
              color: isActive ? T.inkInverse : T.inkFaint,
              border: 'none',
              cursor: isActive ? 'default' : 'pointer',
              fontFamily: mono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              transition: 'background 0.2s ease, color 0.2s ease, padding 0.2s ease',
            }}
          >
            <Icon size={15} strokeWidth={isActive ? 2.4 : 2} />
            {isActive && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
