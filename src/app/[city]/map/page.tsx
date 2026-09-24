// Server wrapper for the map view: metadata + canonical. The map itself is
// code-split behind MapPageLoader (client) → MapPageClient (MapLibre).
import type { Metadata } from 'next';
import { preload } from 'react-dom';
import MapPageLoader from './MapPageLoader';
import { getCityDisplayName } from '@/lib/server-data';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const name = await getCityDisplayName(city);
  const title = `${name} events map — tonight, live | Where's My Vibe`;
  const description = `Every venue with something on tonight in ${name}, on one live map. Filter by clubs, brunch, rooftops, ladies nights and more.`;

  return {
    title,
    description,
    alternates: { canonical: `/${city}/map` },
    openGraph: { title, description, url: `/${city}/map`, type: 'website', images: ['/og-image.png'] },
  };
}

export default function MapPage() {
  // The event card renders in the Home 4 idiom (Inter Tight + Inter, declared
  // in globals.css). Those faces are font-display:swap, and Arial's caps are
  // wider than Inter Tight's — so without a preload the first card paints in
  // Arial, then re-runs line-clamp on swap and visibly jumps. crossOrigin is
  // required even same-origin: font fetches are CORS-mode, and a preload
  // without it is discarded and fetched twice.
  preload('/home3/inter-tight-latin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  preload('/home3/inter-latin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });

  return <MapPageLoader />;
}
