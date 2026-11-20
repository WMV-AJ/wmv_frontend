// Server wrapper for the city home: per-city metadata, a server-rendered
// summary of today's events, and ItemList JSON-LD.
// The interactive page lives in ./CityHomeClient.tsx ('use client').
import type { Metadata } from 'next';
import { preload } from 'react-dom';
import CityHomeClient from './CityHomeClient';
import CitySummary from '@/components/seo/CitySummary';
import JsonLd from '@/components/seo/JsonLd';
import { getCityEvents, getCityServerConfig } from '@/lib/server-data';
import { buildItemListSchema } from '@/lib/seo-schema';
import { cityToday, onDates, toSeoEvents, upcoming } from '@/lib/seo-events';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const { displayName: name } = await getCityServerConfig(city);
  const title = `Where's My Vibe — What's on tonight in ${name}`;
  const description = `Every ${name} venue's Instagram stories and events, read daily and put on one map. Happy hours, club nights, live music, comedy and food deals. Free, no app.`;

  return {
    title,
    description,
    alternates: { canonical: `/${city}` },
    openGraph: { title, description, url: `/${city}`, type: 'website', images: ['/og-image-v2.png'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-image-v2.png'] },
  };
}

export default async function CityHomePage({ params }: Props) {
  // Same as the map page: the home's display type is Inter Tight / Inter
  // (globals.css @font-face). Without a preload the hero paints in Arial and
  // reflows when the face arrives. crossOrigin is required even same-origin:
  // font fetches are CORS-mode.
  preload('/home3/inter-tight-latin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  preload('/home3/inter-latin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });

  const { city } = await params;
  const [cfg, raw] = await Promise.all([getCityServerConfig(city), getCityEvents(city)]);
  const today = cityToday(cfg);
  const events = upcoming(toSeoEvents(raw, cfg), today);
  const itemList = buildItemListSchema(
    onDates(events, [today]).map((e) => e.raw), city, `What's on in ${cfg.displayName} today`,
  );

  return (
    <>
      {itemList && <JsonLd data={itemList} />}
      <CityHomeClient serverSummary={<CitySummary cfg={cfg} today={today} events={events} />} />
    </>
  );
}
