// Server wrapper for the canonical event detail page: per-event metadata +
// schema.org Event JSON-LD. The interactive page lives in
// ./EventPageClient.tsx ('use client').
import type { Metadata } from 'next';
import EventPageClient from './EventPageClient';
import JsonLd from '@/components/seo/JsonLd';
import { getCityDisplayName, getEventById } from '@/lib/server-data';
import { buildEventSchema } from '@/lib/seo-schema';

interface Props {
  params: Promise<{ city: string; eventId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, eventId } = await params;
  const [event, cityName] = await Promise.all([
    getEventById(city, eventId),
    getCityDisplayName(city),
  ]);

  if (!event) {
    return {
      title: `Event in ${cityName} | Where's My Vibe`,
      alternates: { canonical: `/${city}/event/${eventId}` },
    };
  }

  const eventName = event.event_name || event.venue_name || 'Event';
  const venuePart = event.venue_name && event.event_name ? ` at ${event.venue_name}` : '';
  const title = `${eventName}${venuePart} — ${cityName} | Where's My Vibe`;
  // Some records carry a date string in event_time ("25/07/2026") — showing
  // it next to event_date reads as a duplicate; keep only real times.
  const timePart =
    typeof event.event_time === 'string' && !/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(event.event_time.trim())
      ? event.event_time
      : null;
  const description = [
    event.event_date,
    timePart,
    event.venue_area,
    event.music_genre,
  ]
    .filter(Boolean)
    .join(' · ')
    .slice(0, 155) || `${eventName} in ${cityName}.`;

  const media = Array.isArray(event.media_urls) ? event.media_urls[0] : event.media_url_1;
  const ogImage = typeof media === 'string' && /\.(jpe?g|png|webp)$/i.test(media) ? media : '/og-image.png';

  return {
    title,
    description,
    alternates: { canonical: `/${city}/event/${eventId}` },
    openGraph: { title, description, url: `/${city}/event/${eventId}`, type: 'website', images: [ogImage] },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function EventPage({ params }: Props) {
  const { city, eventId } = await params;
  const [event, cityName] = await Promise.all([
    getEventById(city, eventId),
    getCityDisplayName(city),
  ]);
  const schema = event ? buildEventSchema(event, city, cityName) : null;

  return (
    <>
      {schema && <JsonLd data={schema} />}
      <EventPageClient />
    </>
  );
}
