import type { Metadata } from 'next';
import Map2Loader from './Map2Loader';
import { getCityDisplayName } from '@/lib/server-data';
import './map2.css';
import './map2-details.css';

interface Props { params: Promise<{ city: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const name = await getCityDisplayName(city);
  return {
    title: `${name} events map preview | Where's My Vibe`,
    description: `Explore events and venues in ${name} on the Where's My Vibe map.`,
    robots: { index: false, follow: false },
    alternates: { canonical: `/${city}/map` },
  };
}

export default function Map2Page() { return <Map2Loader />; }
