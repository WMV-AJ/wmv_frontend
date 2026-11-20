// Server wrapper for the vibe listing page — the SEO "money page":
// "Brunches in Dubai", "Ladies nights in Mumbai", etc. Renders the heading,
// a one-sentence answer and the event list as HTML, plus ItemList JSON-LD.
// The interactive cards live in ./VibeListClient.tsx ('use client').
import type { Metadata } from 'next';
import VibeListClient from './VibeListClient';
import JsonLd from '@/components/seo/JsonLd';
import ServerEventList, { SeoIntro } from '@/components/seo/ServerEventList';
import { getVibeDataById, matchesVibe } from '@/config/vibes-data';
import { getCityEvents, getCityServerConfig, type CityServerConfig } from '@/lib/server-data';
import { buildItemListSchema } from '@/lib/seo-schema';
import { cityToday, formatLongDate, THIN_PAGE_MIN_EVENTS, toSeoEvents, upcoming, type SeoEvent } from '@/lib/seo-events';

interface Props {
  params: Promise<{ city: string; vibeId: string }>;
}

type VibeData = NonNullable<ReturnType<typeof getVibeDataById>>;

async function loadVibeEvents(city: string, vibe: VibeData): Promise<{ cfg: CityServerConfig; today: string; events: SeoEvent[] }> {
  const [cfg, raw] = await Promise.all([getCityServerConfig(city), getCityEvents(city)]);
  const today = cityToday(cfg);
  const matching = raw.filter((e) => matchesVibe(e, vibe));
  return { cfg, today, events: upcoming(toSeoEvents(matching, cfg), today) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, vibeId } = await params;
  const vibe = getVibeDataById(vibeId);

  if (!vibe) {
    const cfg = await getCityServerConfig(city);
    return { title: `Events in ${cfg.displayName} | Where's My Vibe`, robots: { index: false, follow: true } };
  }

  const { cfg, events } = await loadVibeEvents(city, vibe);
  const name = cfg.displayName;
  const title = `${vibe.seoNoun} in ${name} — this week's picks | Where's My Vibe`;
  const description = `Live list of ${vibe.seoNoun.toLowerCase()} in ${name}, updated daily from venues' own Instagram stories. See what's on tonight and this week.`;

  return {
    title,
    description,
    alternates: { canonical: `/${city}/vibe/${vibeId}` },
    // A near-empty list is not worth a place in the index.
    ...(events.length < THIN_PAGE_MIN_EVENTS ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: `/${city}/vibe/${vibeId}`, type: 'website', images: ['/og-image-v2.png'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-image-v2.png'] },
  };
}

export default async function VibeListPage({ params }: Props) {
  const { city, vibeId } = await params;
  const vibe = getVibeDataById(vibeId);
  if (!vibe) return <VibeListClient />;

  const { cfg, today, events } = await loadVibeEvents(city, vibe);
  const noun = vibe.seoNoun.toLowerCase();
  const itemList = buildItemListSchema(events.map((e) => e.raw), city, `${vibe.seoNoun} in ${cfg.displayName}`);
  const answer = events.length > 0
    ? `Where's My Vibe lists ${events.length} ${noun} in ${cfg.displayName} from today onward, read from venues' own Instagram posts and updated on ${formatLongDate(today)}.`
    : `Where's My Vibe has no ${noun} listed in ${cfg.displayName} right now. The list is rebuilt every day from venues' own Instagram posts.`;

  return (
    <>
      {itemList && <JsonLd data={itemList} />}
      <VibeListClient
        intro={<SeoIntro heading={`${vibe.seoNoun} in ${cfg.displayName}`} answer={answer} />}
        serverList={<ServerEventList events={events} city={city} />}
      />
    </>
  );
}
