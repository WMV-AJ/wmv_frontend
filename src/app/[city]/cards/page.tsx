'use client';

import { useState, useMemo, useRef, useLayoutEffect, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useClientSideVenues } from '@/hooks/useClientSideVenues';
import { type HierarchicalFilterState } from '@/types';
import TopNav from '@/components/navigation/TopNav';
import NavPill from '@/components/navigation/NavPill';
import CategoryPills from '@/components/filters/CategoryPills';
import StackedEventCards from '@/components/events/StackedEventCards';
import FilterBottomSheet from '@/components/filters/FilterBottomSheet';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import {
  getCategoryColorForStackedCards,
  mergeSameVenueDayCards,
  transformVenueDataToStackedCards
} from '@/lib/stacked-card-adapter';
import { getCityConfig } from '@/config/cities.config';
import { getCityDateString } from '@/lib/city-date';
import { getVibeDataById } from '@/config/vibes-data';

function CardsInner() {
  const params = useParams();
  const city = (params?.city as string) || 'dubai';
  const cityConfig = getCityConfig(city);
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<HierarchicalFilterState>(() => {
    // Deep-link seeds (initializer-only — the URL seeds state, it is not
    // two-way-bound): ?cat=Club+Night (repeatable), ?area=Indiranagar,
    // ?date=today|tomorrow|YYYY-MM-DD, ?vibe=brunch, ?q=search text.
    // Same contract as the map page (MapPageClient).
    const catParams = searchParams?.getAll('cat') ?? [];
    const vibeParam = searchParams?.get('vibe');
    const areaParam = searchParams?.get('area');
    const dateParam = searchParams?.get('date');
    const qParam = searchParams?.get('q');

    const seededCategories = [...catParams];
    if (vibeParam) {
      const vibe = getVibeDataById(vibeParam);
      if (vibe) seededCategories.push(...vibe.categories);
    }

    // "Today" is the CITY's today, not the viewer's — building the entry via
    // UTC midnight matches how event dates parse for comparison in any
    // viewer timezone. (Viewer-local `new Date()` made an IST viewer's list
    // show zero Dubai events between IST- and Dubai-midnight.)
    const cityTodayEntry = (offsetDays = 0) => {
      const d = new Date(`${getCityDateString(city)}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + offsetDays);
      return d.toDateString();
    };
    let seededDates = [cityTodayEntry(0)];
    if (dateParam === 'tomorrow') {
      seededDates = [cityTodayEntry(1)];
    } else if (dateParam && dateParam !== 'today') {
      const d = new Date(dateParam);
      if (!Number.isNaN(d.getTime())) seededDates = [d.toDateString()];
    }

    return {
      selectedPrimaries: { genres: [], vibes: [] },
      selectedSecondaries: { genres: {}, vibes: {} },
      expandedPrimaries: { genres: [], vibes: [] },
      eventCategories: {
        selectedPrimaries: Array.from(new Set(seededCategories)),
        selectedSecondaries: {},
        expandedPrimaries: [],
      },
      attributes: { venue: [], energy: [], timing: [], status: [] },
      selectedAreas: [areaParam || cityConfig.defaultAreaLabel],
      activeDates: seededDates,
      activeOffers: [],
      searchQuery: qParam ?? '',
    };
  });

  const { allVenues, filteredVenues, isLoading } = useClientSideVenues(filters);

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [navHeight, setNavHeight] = useState(140);
  const [pillsHeight, setPillsHeight] = useState(0);
  const pillsRef = useRef<HTMLDivElement>(null);
  const cardsScrollRef = useRef<HTMLDivElement>(null);

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
    // One venue, one card: a venue running two events on the same date was two
    // cards in the deck with an identical venue block. They now share a card
    // with a switcher (same treatment as the map).
    return mergeSameVenueDayCards(Array.from(eventMap.values()));
  }, [filteredVenues]);

  // Clip the overlapping-card stack to the last card's real bottom. The deck's
  // negative margins otherwise reserve ~680px of phantom height below the last
  // card (a negative-margin + scroll-height browser quirk), which shows as an
  // over-scroll gap on mobile. Re-runs on expand/collapse and when the filtered
  // card set changes. (Same fix as /[city]/vibe/[vibeId].)
  useEffect(() => {
    const root = cardsScrollRef.current;
    if (!root) return;
    const stack = root.querySelector('.stacked-cards-stack') as HTMLElement | null;
    if (!stack) return;

    let adjusting = false;
    let raf = 0;
    const fix = () => {
      if (adjusting) return;
      adjusting = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        stack.style.height = 'auto';
        const cardEls = stack.querySelectorAll<HTMLElement>('.stacked-card');
        if (cardEls.length) {
          const last = cardEls[cardEls.length - 1];
          stack.style.height = `${Math.ceil(last.offsetTop + last.offsetHeight)}px`;
        }
        requestAnimationFrame(() => { adjusting = false; });
      });
    };

    fix();
    const mo = new MutationObserver(fix);
    mo.observe(stack, { subtree: true, attributes: true, attributeFilter: ['class', 'style'], childList: true });
    const ro = new ResizeObserver(fix);
    ro.observe(stack);
    window.addEventListener('resize', fix);
    return () => {
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener('resize', fix);
      cancelAnimationFrame(raf);
    };
  }, [cards]);

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
          ref={cardsScrollRef}
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
        <NavPill city={city} active="cards" />
      </main>
      </div>
    </ThemeProvider>
  );
}

// useSearchParams requires a Suspense boundary for `next build` (CSR bailout).
export default function CityCardsPage() {
  return (
    <Suspense fallback={null}>
      <CardsInner />
    </Suspense>
  );
}
