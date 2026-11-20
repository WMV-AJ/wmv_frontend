// Server wrapper for the area listing page: "Things to do in Dubai Marina".
// Renders the heading, a one-sentence answer and the event list as HTML, plus
// ItemList JSON-LD. The interactive cards live in ./AreaListClient.tsx.
import type { Metadata } from 'next';
import AreaListClient from './AreaListClient';
import JsonLd from '@/components/seo/JsonLd';
import ServerEventList, { SeoIntro } from '@/components/seo/ServerEventList';
import { humanizeSlug, slugifyArea } from '@/lib/areas';
import { getCityEvents, getCityServerConfig, type CityServerConfig } from '@/lib/server-data';
import { buildItemListSchema } from '@/lib/seo-schema';
import { cityToday, formatLongDate, THIN_PAGE_MIN_EVENTS, toSeoEvents, upcoming, type SeoEvent } from '@/lib/seo-events';

interface Props {
  params: Promise<{ city: string; areaSlug: string }>;
}

interface AreaEvents {
  cfg: CityServerConfig;
  today: string;
  /** The area's real label from the data ("JBR"), or a title-cased slug when nothing matches. */
  areaName: string;
  events: SeoEvent[];
}

async function loadAreaEvents(city: string, areaSlug: string): Promise<AreaEvents> {
  const [cfg, raw] = await Promise.all([getCityServerConfig(city), getCityEvents(city)]);
  const today = cityToday(cfg);
  const inArea = toSeoEvents(raw, cfg).filter((e) => e.area && slugifyArea(e.area) === areaSlug);
  return {
    cfg,
    today,
    areaName: inArea[0]?.area ?? humanizeSlug(areaSlug),
    events: upcoming(inArea, today),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, areaSlug } = await params;
  const { cfg, areaName, events } = await loadAreaEvents(city, areaSlug);
  const cityName = cfg.displayName;
  const title = `Things to do in ${areaName}, ${cityName} — tonight & this week | Where's My Vibe`;
  const description = `Events, brunches and nightlife in ${areaName}, ${cityName} — updated daily from venues' own Instagram stories.`;

  return {
    title,
    description,
    alternates: { canonical: `/${city}/area/${areaSlug}` },
    ...(events.length < THIN_PAGE_MIN_EVENTS ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: `/${city}/area/${areaSlug}`, type: 'website', images: ['/og-image-v2.png'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-image-v2.png'] },
  };
}

export default async function AreaListPage({ params }: Props) {
  const { city, areaSlug } = await params;
  const { cfg, today, areaName, events } = await loadAreaEvents(city, areaSlug);
  const itemList = buildItemListSchema(events.map((e) => e.raw), city, `Things to do in ${areaName}`);
  const answer = events.length > 0
    ? `Where's My Vibe lists ${events.length} things to do in ${areaName}, ${cfg.displayName} from today onward, read from venues' own Instagram posts and updated on ${formatLongDate(today)}.`
    : `Where's My Vibe has nothing listed in ${areaName}, ${cfg.displayName} right now. The list is rebuilt every day from venues' own Instagram posts.`;

  return (
    <>
      {itemList && <JsonLd data={itemList} />}
      <AreaListClient
        intro={<SeoIntro heading={`Things to do in ${areaName}, ${cfg.displayName}`} answer={answer} />}
        serverList={<ServerEventList events={events} city={city} />}
      />
    </>
  );
}
