'use client';

import dynamic from 'next/dynamic';

const MapPageClient = dynamic(() => import('../map/MapPageClient'), {
  ssr: false,
  loading: () => <div className="wmv-map2-loading" role="status">Finding tonight&apos;s good plans…</div>,
});

export default function Map2Loader() { return <MapPageClient variant="map2" />; }
