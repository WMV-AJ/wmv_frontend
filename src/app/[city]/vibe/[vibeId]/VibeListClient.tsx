'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useClientSideVenues } from '@/hooks/useClientSideVenues';
import { type HierarchicalFilterState } from '@/types';
import { transformVenueDataToStackedCards } from '@/lib/stacked-card-adapter';
import { getCityConfig } from '@/config/cities.config';
import { trackEvent } from '@/lib/analytics/track';
import { isUpcomingInCity } from '@/lib/city-date';
import { getVibeById, matchesVibe } from '@/config/vibes';
import StackedCardsListPage, { ListPageHeader } from '@/components/cards/StackedCardsListPage';

// No filters — we want ALL venues from context, then filter by vibe ourselves
// so the count matches the homepage "Pick your vibe" pill exactly.
const EMPTY_FILTERS: HierarchicalFilterState = {
  selectedPrimaries: { genres: [], vibes: [] },
  selectedSecondaries: { genres: {}, vibes: {} },
  expandedPrimaries: { genres: [], vibes: [] },
  eventCategories: { selectedPrimaries: [], selectedSecondaries: {}, expandedPrimaries: [] },
  attributes: { venue: [], energy: [], timing: [], status: [] },
  selectedAreas: [],
  activeDates: [],
  activeOffers: [],
  searchQuery: '',
};

const serif = "var(--font-playfair), 'Playfair Display', Georgia, serif";
const mono = "var(--font-geist-sans), ui-monospace, monospace";

export default function VibeListingPage() {
  const router = useRouter();
  const params = useParams();
  const city = (params?.city as string) || 'dubai';
  const vibeId = (params?.vibeId as string) || '';
  const vibe = getVibeById(vibeId);

  const { allVenues, isLoading } = useClientSideVenues(EMPTY_FILTERS);

  // All upcoming events matching this vibe → deduped stacked cards.
  const cards = useMemo(() => {
    if (!vibe) return [];
    const matched = allVenues.filter((v: any) => {
      // City-anchored upcoming check (viewer-local midnight hid the city's
      // tonight for viewers in timezones ahead of the city).
      if (!isUpcomingInCity(v.event_date, city)) return false;
      return matchesVibe(v, vibe);
    });

    const allCards = transformVenueDataToStackedCards(matched as any);
    const eventMap = new Map<string, typeof allCards[0]>();
    allCards.forEach(card => {
      if (card.event.id && !eventMap.has(card.event.id)) {
        eventMap.set(card.event.id, card);
      }
    });
    return Array.from(eventMap.values());
  }, [allVenues, vibe]);

  const Icon = vibe?.Icon;

  const header = (
    <ListPageHeader
      onViewMap={vibe ? () => { trackEvent('nav_view_change', { from: 'vibe_list', to: 'map', source: 'list_header', vibe: vibe.id }); router.push(`/${city}/map?vibe=${vibe.id}`); } : undefined}
      onBack={() => router.push(`/${city}`)}
      icon={Icon ? <Icon style={{ width: 12, height: 12, color: '#0a0a14' }} /> : null}
      iconBg={vibe ? vibe.color : '#2a2638'}
      title={vibe ? vibe.label : 'Vibe not found'}
      subtitle={
        !vibe ? '' : isLoading ? 'Loading…'
        : `${cards.length} event${cards.length === 1 ? '' : 's'} · ${getCityConfig(city).displayName}`
      }
    />
  );

  const emptyState = (
    <div style={{ padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ fontFamily: serif, fontSize: 18, color: '#f5f2ed' }}>
        {vibe ? `No ${vibe.label.toLowerCase()} events right now` : 'That vibe doesn’t exist'}
      </div>
      <div style={{ fontFamily: mono, fontSize: 11, color: '#a8a2b8', marginTop: 8, lineHeight: 1.5 }}>
        {vibe ? 'Check back soon — the city updates daily.' : 'Pick a vibe from the home page.'}
      </div>
    </div>
  );

  return (
    <StackedCardsListPage
      city={city}
      header={header}
      cards={cards}
      isLoading={!!vibe && isLoading}
      emptyState={emptyState}
      mastheadFrom="vibe"
    />
  );
}
