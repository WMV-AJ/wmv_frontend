// Server wrapper for the area listing page: "Things to do in Dubai Marina".
// The interactive list lives in ./AreaListClient.tsx ('use client').
import type { Metadata } from 'next';
import AreaListClient from './AreaListClient';
import JsonLd from '@/components/seo/JsonLd';
import { humanizeSlug, slugifyArea } from '@/lib/areas';
import { getCityDisplayName, getCityEvents } from '@/lib/server-data';
import { buildItemListSchema } from '@/lib/seo-schema';

interface Props {
  params: Promise<{ city: string; areaSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, areaSlug } = await params;
  const areaName = humanizeSlug(areaSlug);
  const cityName = await getCityDisplayName(city);
  const title = `Things to do in ${areaName}, ${cityName} — tonight & this week | Where's My Vibe`;
  const description = `Events, brunches and nightlife in ${areaName}, ${cityName} — updated daily from venues' own Instagram stories.`;

  return {
    title,
    description,
    alternates: { canonical: `/${city}/area/${areaSlug}` },
    openGraph: { title, description, url: `/${city}/area/${areaSlug}`, type: 'website', images: ['/og-image.png'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-image.png'] },
  };
}

export default async function AreaListPage({ params }: Props) {
  const { city, areaSlug } = await params;
  const areaName = humanizeSlug(areaSlug);

  const events = await getCityEvents(city);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Match by round-tripping the slug (same rule the client's findAreaBySlug
  // uses) — area strings like "Marsa Dubai - Dubai Marina" don't survive a
  // naive humanize+compare.
  const matching = events.filter((e) => {
    if (!e?.event_date || !e?.venue_area) return false;
    const d = new Date(e.event_date);
    if (Number.isNaN(d.getTime()) || d < today) return false;
    return slugifyArea(String(e.venue_area)) === areaSlug;
  });
  const itemList = buildItemListSchema(matching, city, `Things to do in ${areaName}`);

  return (
    <>
      {itemList && <JsonLd data={itemList} />}
      <AreaListClient />
    </>
  );
}
