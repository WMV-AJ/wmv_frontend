// Server wrapper for the vibe listing page — the SEO "money page":
// "Brunches in Dubai", "Ladies nights in Mumbai", etc. Emits targeted
// metadata + an ItemList of today's/upcoming matching events as JSON-LD.
// The interactive list lives in ./VibeListClient.tsx ('use client').
import type { Metadata } from 'next';
import VibeListClient from './VibeListClient';
import JsonLd from '@/components/seo/JsonLd';
import { getVibeDataById, matchesVibe } from '@/config/vibes-data';
import { getCityDisplayName, getCityEvents } from '@/lib/server-data';
import { buildItemListSchema } from '@/lib/seo-schema';
import { isUpcomingInCity } from '@/lib/city-date';

interface Props {
  params: Promise<{ city: string; vibeId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, vibeId } = await params;
  const vibe = getVibeDataById(vibeId);
  const name = await getCityDisplayName(city);

  if (!vibe) {
    return { title: `Events in ${name} | Where's My Vibe` };
  }

  const title = `${vibe.seoNoun} in ${name} — this week's picks | Where's My Vibe`;
  const description = `Live list of ${vibe.seoNoun.toLowerCase()} in ${name}, updated daily from venues' own Instagram stories. See what's on tonight and this week.`;

  return {
    title,
    description,
    alternates: { canonical: `/${city}/vibe/${vibeId}` },
    openGraph: { title, description, url: `/${city}/vibe/${vibeId}`, type: 'website', images: ['/og-image.png'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-image.png'] },
  };
}

export default async function VibeListPage({ params }: Props) {
  const { city, vibeId } = await params;
  const vibe = getVibeDataById(vibeId);

  let itemList: Record<string, unknown> | null = null;
  if (vibe) {
    const events = await getCityEvents(city);
    const matching = events.filter(
      (e) => e?.event_date && isUpcomingInCity(e.event_date, city) && matchesVibe(e, vibe),
    );
    const name = await getCityDisplayName(city);
    itemList = buildItemListSchema(matching, city, `${vibe.seoNoun} in ${name}`);
  }

  return (
    <>
      {itemList && <JsonLd data={itemList} />}
      <VibeListClient />
    </>
  );
}
