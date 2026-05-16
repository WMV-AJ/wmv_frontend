'use client';

import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useClientSideVenues } from '@/hooks/useClientSideVenues';
import { type HierarchicalFilterState } from '@/types';
import TopNav from '@/components/navigation/TopNav';
import CategoryPills from '@/components/filters/CategoryPills';
import StackedEventCards from '@/components/events/StackedEventCards';
import FilterBottomSheet from '@/components/filters/FilterBottomSheet';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import {
  getCategoryColorForStackedCards,
  transformVenueDataToStackedCards
} from '@/lib/stacked-card-adapter';
import { getCityConfig } from '@/config/cities.config';

export default function CityCardsPage() {
  const router = useRouter();
  const params = useParams();
  const city = (params?.city as string) || 'dubai';
  const cityConfig = getCityConfig(city);

  const [filters, setFilters] = useState<HierarchicalFilterState>({
    selectedPrimaries: { genres: [], vibes: [] },
    selectedSecondaries: { genres: {}, vibes: {} },
    expandedPrimaries: { genres: [], vibes: [] },
    eventCategories: { selectedPrimaries: [], selectedSecondaries: {}, expandedPrimaries: [] },
    attributes: { venue: [], energy: [], timing: [], status: [] },
    selectedAreas: [cityConfig.defaultAreaLabel], // "All Dubai" / "All Bangalore"
    activeDates: [new Date().toDateString()], // Default to today on page load
    activeOffers: [],
    searchQuery: ''
  });

  const { allVenues, filteredVenues, isLoading } = useClientSideVenues(filters);

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [navHeight, setNavHeight] = useState(140);
  const [pillsHeight, setPillsHeight] = useState(0);
  const pillsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = pillsRef.current;
    if (!el) return;
    const update = () => setPillsHeight(el.offsetHeight);
    update();
    if (typeof ResizeObserver !== 'undefined') {
      const obs = new ResizeObserver(update);
      obs.observe(el);
      return () => obs.disconnect();
    }
  }, []);

  const { filterOptions } = useFilterOptions();

  const handleFiltersChange = (newFilters: HierarchicalFilterState) => {
    setFilters(newFilters);
  };

  const handleDateChange = (dates: string[]) => {
    setFilters(prev => ({ ...prev, activeDates: dates }));
  };

  const dateFilteredVenues = useMemo(() => {
    if (filters.activeDates.length === 0) return allVenues;
    return allVenues.filter(venue => {
      if (!venue.event_date) return false;
      try {
        const venueDate = new Date(venue.event_date).toDateString();
        return filters.activeDates.includes(venueDate);
      } catch { return false; }
    });
  }, [allVenues, filters.activeDates]);

  const cards = useMemo(() => {
    const allCards = transformVenueDataToStackedCards(filteredVenues);
    const eventMap = new Map<string, typeof allCards[0]>();
    allCards.forEach(card => {
      if (card.event.id && !eventMap.has(card.event.id)) {
        eventMap.set(card.event.id, card);
      }
    });
    return Array.from(eventMap.values());
  }, [filteredVenues]);

  if (isLoading) {
    return (
      <main className="h-screen w-full flex items-center justify-center" style={{ background: '#0a0a1a' }}>
        <div className="p-8 max-w-md text-center">
          <h3 className="text-lg font-semibold mb-2 text-white">Loading Venues...</h3>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mt-4"></div>
        </div>
      </main>
    );
  }

  return (
    <ThemeProvider>
      <style>{`#cards-scroll-container::-webkit-scrollbar { display: none; }`}</style>
      <div className="wmv-phone-frame" style={{
        maxWidth: 430,
        margin: '0 auto',
        height: '100dvh',
        overflow: 'hidden',
        transform: 'translateZ(0)',
        background: '#0a0a1a',
      }}>
      <main className="h-full w-full" style={{ background: '#0a0a1a' }}>
        <TopNav
          embedded={false}
          hideProfile={true}
          onSearchClick={() => setIsFilterSheetOpen(true)}
          showDatePicker={true}
          datePickerProps={{
            venues: dateFilteredVenues,
            selectedDates: filters.activeDates,
            onDateChange: handleDateChange,
          }}
          onListToggle={() => router.push(`/${city}`)}
          isListView={false}
          onHeightChange={setNavHeight}
          darkMode={true}
        />

        <div
          ref={pillsRef}
          className="fixed left-0 right-0 z-30 px-2"
          style={{ top: navHeight + 6 }}
        >
          <CategoryPills
            filters={filters}
            onFiltersChange={handleFiltersChange}
            venues={dateFilteredVenues}
            inlineMode={true}
            variant="outlined"
            wrapPills={true}
            darkMode={true}
          />
        </div>

        <div
          id="cards-scroll-container"
          className="fixed left-2 right-2 bottom-0 z-10 overflow-y-auto rounded-2xl"
          style={{
            background: '#0a0a1a',
            top: `${navHeight + 6 + pillsHeight + 6}px`,
            transition: 'top 0.22s ease-out',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none' as const,
            msOverflowStyle: 'none' as any,
          }}
        >
          <StackedEventCards
            cards={cards}
            getCategoryColor={getCategoryColorForStackedCards}
          />
        </div>

        <FilterBottomSheet
          isOpen={isFilterSheetOpen}
          onClose={() => setIsFilterSheetOpen(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          filterOptions={filterOptions}
        />
      </main>
      </div>
    </ThemeProvider>
  );
}
