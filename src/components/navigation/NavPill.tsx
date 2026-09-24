'use client';

// Floating 3-segment navigator (Home / Map / List) shared by the core views.
// The current view's segment expands to icon + label on a dark chip inside a
// light grey tray; the other two collapse to bare dim icons. Fixed bottom-center, safe-area
// aware; per-page bottomOffset keeps it clear of page-specific bottom UI
// (map card carousel, cards-page filter bar).
import { useRouter } from 'next/navigation';
import { Home, Map as MapIcon, List } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';
import { condensedFont } from '@/lib/theme/tokens';

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
        // Light grey tray. The pill went from near-black, through Home 4's
        // slate, to this: the basemap is now grey, and a dark control on a
        // grey map read as a hole punched in it. Inverting the whole tray
        // makes it sit ON the map instead. Near-opaque rather than blurred —
        // a backdrop blur here costs a recomposite per frame while the map
        // pans, and buys nothing once the fill is this solid.
        background: 'rgba(214, 216, 214, 0.96)',
        border: 'none',
        // Three layers, outermost first: a soft white halo that lifts the pale
        // tray off the grey basemap (a dark shadow alone muddied its edge into
        // the map), then a dark drop shadow for depth, then an inset highlight
        // along the top edge.
        boxShadow: [
          '0 0 24px 6px rgba(255,255,255,0.28)',
          '0 0 8px 2px rgba(255,255,255,0.40)',
          '0 8px 28px rgba(0,0,0,0.45)',
          'inset 0 1px 0 rgba(255,255,255,0.7)',
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
              // Inverted with the tray: the active segment is now the dark
              // chip and the tray is pale, rather than the other way round.
              // Home 4's palette carries no gold, and the map's category
              // colours are the only accents that should compete here.
              background: isActive ? '#27282B' : 'transparent',
              color: isActive ? '#E2E3E1' : '#5A5C60',
              border: 'none',
              cursor: isActive ? 'default' : 'pointer',
              fontFamily: condensedFont,
              fontSize: 11,
              fontWeight: 700,
              // Tighter than the old 0.08em: Archivo Narrow is condensed, so it
              // needs far less tracking than the proportional face did.
              letterSpacing: '0.04em',
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
