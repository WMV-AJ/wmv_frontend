// Server wrapper for the map view: metadata + canonical. The map itself is
// code-split behind MapPageLoader (client) → MapPageClient (MapLibre).
import type { Metadata } from 'next';
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
  return <MapPageLoader />;
}
