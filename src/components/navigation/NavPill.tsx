'use client';

// Floating 3-segment navigator (Home / Map / List) shared by the core views.
// The current view's segment expands to icon + label on a gold fill; the
// other two collapse to bare dim icons. Fixed bottom-center, safe-area
// aware; per-page bottomOffset keeps it clear of page-specific bottom UI
// (map card carousel, cards-page filter bar).
import { useRouter } from 'next/navigation';
import { Home, Map as MapIcon, List } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';
import { T, bodyFont } from '@/lib/theme/tokens';

export type NavPillView = 'home' | 'map' | 'cards';

interface NavPillProps {
  city: string;
  active: NavPillView;
  /** Extra px above the safe-area bottom (default 16). */
  bottomOffset?: number;
  /** Suppressed while a modal owns the screen — see the guard in the body. */
  hidden?: boolean;
  /**
   * Set false when `bottomOffset` is measured from an element that already
   * includes env(safe-area-inset-bottom) — the map's card carousel does, and
   * adding it again lifts the pill ~34px on notched iPhones.
   */
  safeAreaAware?: boolean;
}

const SEGMENTS: Array<{ view: NavPillView; label: string; Icon: typeof Home; path: (city: string) => string }> = [
  { view: 'home', label: 'Home', Icon: Home, path: (c) => `/${c}` },
  { view: 'map', label: 'Map', Icon: MapIcon, path: (c) => `/${c}/map` },
  { view: 'cards', label: 'List', Icon: List, path: (c) => `/${c}/cards` },
];

export default function NavPill({ city, active, bottomOffset = 16, hidden = false, safeAreaAware = true }: NavPillProps) {
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
        bottom: safeAreaAware
          ? `max(${bottomOffset}px, calc(env(safe-area-inset-bottom) + ${bottomOffset}px))`
          : `${bottomOffset}px`,
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
        // No rim: the basemap is grey now, so the dark pill separates from it
        // on its own and a border only added noise.
        border: 'none',
        // White drop shadow, not black. A black shadow under a near-black pill
        // sitting on a grey basemap did nothing visible; a white halo separates
        // it from the map instead. The inset top highlight is unchanged.
        boxShadow: [
          '0 0 18px 4px rgba(255,255,255,0.06)',
          '0 0 6px 1px rgba(255,255,255,0.10)',
          'inset 0 1px 0 rgba(255,255,255,0.06)',
        ].join(', '),
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
              // White, not the brand gold. Gold competed with the map's
              // category colours; white reads as neutral chrome and lets the
              // pins own the only saturated colour on the screen.
              background: isActive ? '#FFFFFF' : T.overlay,
              color: isActive ? T.inkInverse : T.inkMuted,
              border: 'none',
              cursor: isActive ? 'default' : 'pointer',
              fontFamily: bodyFont,
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
