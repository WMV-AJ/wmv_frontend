'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  transformSupabaseDataToStackedCards
} from '@/lib/stacked-card-adapter';

export default function CardPage() {
  const router = useRouter();

  const [filters, setFilters] = useState<HierarchicalFilterState>({
    selectedPrimaries: { genres: [], vibes: [] },
    selectedSecondaries: { genres: {}, vibes: {} },
    expandedPrimaries: { genres: [], vibes: [] },
    eventCategories: { selectedPrimaries: [], selectedSecondaries: {}, expandedPrimaries: [] },
    attributes: { venue: [], energy: [], timing: [], status: [] },
    selectedAreas: ['All Dubai'],
    activeDates: [],
    activeOffers: [],
    searchQuery: ''
  });

  const { allVenues, filteredVenues, isLoading } = useClientSideVenues(filters);

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [navHeight, setNavHeight] = useState(140);

  const { filterOptions } = useFilterOptions();

  const handleFiltersChange = (newFilters: HierarchicalFilterState) => {
    setFilters(newFilters);
  };

  const handleDateChange = (dates: string[]) => {
    setFilters(prev => ({ ...prev, activeDates: dates }));
  };

  // Venues filtered by date only — so pill counts update when a date is selected
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
    const allCards = transformSupabaseDataToStackedCards(filteredVenues);
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
      <main className="min-h-screen w-full" style={{ background: '#0a0a1a' }}>
        {/* Dark TopNav — same as map page */}
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
          onListToggle={() => router.push('/')}
          isListView={false}
          onHeightChange={setNavHeight}
          darkMode={true}
        />

        {/* Floating category pills — counts reflect selected date */}
        <div
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

        {/* Stacked Event Cards — scrollable area below nav + pills */}
        <div
          id="cards-scroll-container"
          className="fixed left-1.5 md:left-2 right-1.5 md:right-2 bottom-0 z-10 overflow-y-auto rounded-2xl"
          style={{
            background: '#0a0a1a',
            top: `${navHeight + 90}px`,
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
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
    </ThemeProvider>
  );
}
