'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { useClientSideVenues } from '@/hooks/useClientSideVenues';
import { type HierarchicalFilterState } from '@/types';
import { transformVenueDataToStackedCards } from '@/lib/stacked-card-adapter';
import { getCityConfig } from '@/config/cities.config';
import { trackEvent } from '@/lib/analytics/track';
import { findAreaBySlug, humanizeSlug } from '@/lib/areas';
import StackedCardsListPage, { ListPageHeader } from '@/components/cards/StackedCardsListPage';

// No filters — we want ALL venues from context, then filter by area ourselves so
// the count matches the homepage "Areas" row exactly.
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

export default function AreaListingPage() {
  const router = useRouter();
  const params = useParams();
  const city = (params?.city as string) || 'dubai';
  const areaSlug = (params?.areaSlug as string) || '';

  const { allVenues, isLoading } = useClientSideVenues(EMPTY_FILTERS);

  // Resolve the real area label from the slug (areas are dynamic data strings).
  const areaName = useMemo(
    () => findAreaBySlug(allVenues as Array<{ area?: string | null }>, areaSlug),
    [allVenues, areaSlug],
  );

  // All upcoming events in this area → deduped stacked cards.
  const cards = useMemo(() => {
    if (!areaName) return [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const matched = allVenues.filter((v: any) => {
      if (v.event_date) {
        const d = new Date(v.event_date);
        if (!isNaN(d.getTime()) && d < todayStart) return false; // upcoming only
      }
      return v.area === areaName;
    });

    const allCards = transformVenueDataToStackedCards(matched as any);
    const eventMap = new Map<string, typeof allCards[0]>();
    allCards.forEach(card => {
      if (card.event.id && !eventMap.has(card.event.id)) {
        eventMap.set(card.event.id, card);
      }
    });
    return Array.from(eventMap.values());
  }, [allVenues, areaName]);

  const title = areaName ?? humanizeSlug(areaSlug);

  const header = (
    <ListPageHeader
      onViewMap={areaName ? () => { trackEvent('nav_view_change', { from: 'area_list', to: 'map', source: 'list_header', area: areaName }); router.push(`/${city}/map?area=${encodeURIComponent(areaName)}`); } : undefined}
      onBack={() => router.push(`/${city}`)}
      icon={<MapPin style={{ width: 12, height: 12, color: '#0a0a14' }} />}
      iconBg="#f4c430"
      title={title}
      subtitle={
        isLoading ? 'Loading…'
        : `${cards.length} event${cards.length === 1 ? '' : 's'} · ${getCityConfig(city).displayName}`
      }
    />
  );

  const emptyState = (
    <div style={{ padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 18, color: '#f5f2ed' }}>
        No events in {title} right now
      </div>
      <div style={{ fontFamily: mono, fontSize: 11, color: '#a8a2b8', marginTop: 8, lineHeight: 1.5 }}>
        Check back soon — the city updates daily.
      </div>
    </div>
  );

  return (
    <StackedCardsListPage
      city={city}
      header={header}
      cards={cards}
      isLoading={isLoading}
      emptyState={emptyState}
      mastheadFrom="area"
    />
  );
}
