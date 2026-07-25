// Server wrapper for the LEGACY short event URL (/{city}/{eventId}).
// Near-duplicate of /{city}/event/{eventId} — rather than merging the two
// 1.1k-line clients, this wrapper canonicalizes to the /event/ variant so
// the twins never compete in search.
import type { Metadata } from 'next';
import LegacyEventClient from './LegacyEventClient';
import { getCityDisplayName, getEventById } from '@/lib/server-data';

interface Props {
  params: Promise<{ city: string; eventId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, eventId } = await params;
  const [event, cityName] = await Promise.all([
    getEventById(city, eventId),
    getCityDisplayName(city),
  ]);

  const eventName = event?.event_name || event?.venue_name || 'Event';
  return {
    title: `${eventName} — ${cityName} | Where's My Vibe`,
    // The /event/ route is the canonical home for event pages.
    alternates: { canonical: `/${city}/event/${eventId}` },
    robots: { index: false, follow: true },
  };
}

export default function LegacyEventPage() {
  return <LegacyEventClient />;
}
