'use client';

// Persistent bottom Map/List switcher for the city home: appears once the
// hero (with its own CTAs) scrolls out of view, so the two core product
// views are always one tap away. Glass style, safe-area aware.
import { useEffect, useState, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { Map as MapIcon, List } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';
import { T, mono } from '@/lib/theme/tokens';

interface StickyModeBarProps {
  city: string;
  /** The hero element — the bar shows only after this scrolls out of view. */
  heroRef: RefObject<HTMLElement | null>;
}

export default function StickyModeBar({ city, heroRef }: StickyModeBarProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => setVisible(!entries.some((e) => e.isIntersecting)),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [heroRef]);

  const go = (to: 'map' | 'cards') => {
    trackEvent('nav_view_change', { from: 'home', to, source: 'sticky_bar' });
    router.push(`/${city}/${to}`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        transform: `translateX(-50%) translateY(${visible ? 0 : 80}px)`,
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        zIndex: 40,
        display: 'flex',
        gap: 4,
        padding: 4,
        borderRadius: 999,
        background: 'rgba(20,20,31,0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${T.lineFaint}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <button
        onClick={() => go('map')}
        style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px',
          borderRadius: 999, background: T.accent, color: T.inkInverse,
          border: 'none', cursor: 'pointer', fontFamily: mono, fontSize: 11,
          fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}
      >
        <MapIcon size={13} /> Map
      </button>
      <button
        onClick={() => go('cards')}
        style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px',
          borderRadius: 999, background: 'transparent', color: T.ink,
          border: 'none', cursor: 'pointer', fontFamily: mono, fontSize: 11,
          fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}
      >
        <List size={13} /> List
      </button>
    </div>
  );
}
