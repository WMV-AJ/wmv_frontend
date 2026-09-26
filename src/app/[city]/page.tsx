// Server wrapper for the city home: per-city metadata + canonical.
// The interactive page lives in ./CityHomeClient.tsx ('use client').
import type { Metadata } from 'next';
import { preload } from 'react-dom';
import CityHomeClient from './CityHomeClient';
import { getCityDisplayName } from '@/lib/server-data';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const name = await getCityDisplayName(city);
  const title = `Tonight in ${name} — live events, brunches & nightlife | Where's My Vibe`;
  const description = `What's actually happening in ${name} tonight: clubs, brunches, rooftops, ladies nights and live music — pulled live from Instagram stories and venue data.`;

  return {
    title,
    description,
    alternates: { canonical: `/${city}` },
    openGraph: { title, description, url: `/${city}`, type: 'website', images: ['/og-image.png'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-image.png'] },
  };
}

export default function CityHomePage() {
  // Same as the map page: the home's display type is Inter Tight / Inter
  // (globals.css @font-face). Without a preload the hero paints in Arial and
  // reflows when the face arrives. crossOrigin is required even same-origin:
  // font fetches are CORS-mode.
  preload('/home3/inter-tight-latin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  preload('/home3/inter-latin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  return <CityHomeClient />;
}
