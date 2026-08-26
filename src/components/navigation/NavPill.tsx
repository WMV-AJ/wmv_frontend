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
  /** Suppressed while a modal owns the screen — see the guard in the body. */
  hidden?: boolean;
}

const SEGMENTS: Array<{ view: NavPillView; label: string; Icon: typeof Home; path: (city: string) => string }> = [
  { view: 'home', label: 'Home', Icon: Home, path: (c) => `/${c}` },
  { view: 'map', label: 'Map', Icon: MapIcon, path: (c) => `/${c}/map` },
  { view: 'cards', label: 'List', Icon: List, path: (c) => `/${c}/cards` },
];

export default function NavPill({ city, active, bottomOffset = 16, hidden = false }: NavPillProps) {
  const router = useRouter();

  // A modal owns the screen while it is open. The pill is fixed at z-index 45
  // and the filter sheet paints at z-40, so the pill sat ON TOP of the sheet's
  // own options — in the 24 Aug capture the MAP button covered "1st Block
  // Koramangala" in the middle of the Areas list. Raising the sheet instead
  // would only move the collision onto its Cancel/Apply bar; the pill should
  // not be there at all.
  if (hidden) return null;

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
        // Near-opaque surfaceAlt + real border: the old surface-on-bg fill
        // was ~4 RGB points from the page background (black-on-black), and
        // the backdrop blur cost a recomposite per frame over the moving map.
        background: 'rgba(28,28,42,0.97)',
        border: `1px solid ${T.line}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
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
              background: isActive ? T.accent : T.overlay,
              color: isActive ? T.inkInverse : T.inkMuted,
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
