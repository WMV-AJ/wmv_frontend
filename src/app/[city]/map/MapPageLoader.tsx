'use client';

// Client boundary that code-splits the map. MapLibre GL (~200KB min) was
// statically bundled into this route's chunk — dynamic(ssr:false) keeps it
// out of the initial JS so the shell paints while the map engine downloads.
// ssr:false is also semantically right: the map cannot render on the server.
import dynamic from 'next/dynamic';
import { T } from '@/lib/theme/tokens';

const MapPageClient = dynamic(() => import('./MapPageClient'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

function MapSkeleton() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Same pulsing-dots loader the map shows while venues stream in */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: T.inkFaint,
              animation: `wmv-skeleton-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`@keyframes wmv-skeleton-pulse { 0%, 100% { opacity: 0.25 } 50% { opacity: 1 } }`}</style>
    </div>
  );
}

export default function MapPageLoader() {
  return <MapPageClient />;
}
