'use client';

// Shown when the events for a city could not be loaded, so an outage never
// looks like a city with nothing on.
import { RefreshCw } from 'lucide-react';
import { useVenueData } from '@/contexts/VenueDataContext';

export default function LoadError({ full = false }: {
  /** Fill the screen (for pages that have nothing else to show). */
  full?: boolean;
}) {
  const { refetch, isLoadingVenues } = useVenueData();
  return (
    <div
      role="alert"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
        textAlign: 'center', padding: '48px 24px', color: 'var(--wmv-ink)',
        ...(full ? { position: 'fixed', inset: 0, background: 'var(--wmv-bg)' } : {}),
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 650 }}>Couldn&rsquo;t load events</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--wmv-ink-muted)', maxWidth: 280 }}>
        Something went wrong on our side or your connection dropped. Nothing is missing; please try again.
      </div>
      <button
        type="button"
        onClick={refetch}
        disabled={isLoadingVenues}
        className="wmv-invert"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, height: 44, padding: '0 20px',
          border: 'none', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
          cursor: isLoadingVenues ? 'wait' : 'pointer', opacity: isLoadingVenues ? 0.6 : 1,
        }}
      >
        <RefreshCw style={{ width: 15, height: 15 }} />
        {isLoadingVenues ? 'Loading' : 'Try again'}
      </button>
    </div>
  );
}
