'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Map as MapView,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MapControls,
  MapPopup,
  useMap,
} from '@/components/ui/map';
import TopNav from '@/components/navigation/TopNav';
import CategoryPills from '@/components/filters/CategoryPills';
import FilterBottomSheet from '@/components/filters/FilterBottomSheet';
import MobileEventList from '@/components/mobile/MobileEventList';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useClientSideVenues } from '@/hooks/useClientSideVenues';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import {
  getCategoryColorForStackedCards,
  transformSupabaseDataToStackedCards,
} from '@/lib/stacked-card-adapter';
import { getMarkerColorScheme, getVenuePrimaryEventCategory } from '@/lib/map/marker-colors';
import { getDisplayName } from '@/lib/category-mappings';
import { type Venue, type HierarchicalFilterState } from '@/types';
import {
  MAPCN_CENTER,
  MAPCN_ZOOM,
  MAPCN_MIN_ZOOM,
  MAPCN_MAX_ZOOM,
  MAPCN_BOUNDS,
} from '@/lib/mapcn-config';

function getVenueColor(venue: Venue): string {
  return getMarkerColorScheme(venue).svgColor;
}

function GlowingMarker({
  color,
  isHighlighted,
  isActive,
  dimmed,
}: {
  color: string;
  isHighlighted: boolean;
  isActive: boolean;
  dimmed: boolean;
}) {
  const size = isHighlighted || isActive ? 20 : 14;
  const glowSize = isHighlighted ? 44 : isActive ? 36 : 28;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: glowSize,
        height: glowSize,
        opacity: dimmed ? 0.35 : 1,
        zIndex: isHighlighted ? 999 : isActive ? 998 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Outer glow / halo */}
      <div
        className="absolute rounded-full"
        style={{
          width: glowSize,
          height: glowSize,
          backgroundColor: color,
          opacity: isHighlighted ? 0.25 : 0.15,
          transition: 'all 0.3s ease',
        }}
      />
      {/* Pulsing ring for highlighted marker */}
      {isHighlighted && (
        <>
          <div
            className="absolute rounded-full animate-ping"
            style={{
              width: glowSize + 8,
              height: glowSize + 8,
              border: `2px solid ${color}`,
              opacity: 0.4,
              animationDuration: '1.5s',
            }}
          />
        </>
      )}
      {/* Inner dot */}
      <div
        className="relative rounded-full shadow-lg"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          border: `2.5px solid rgba(255,255,255,0.9)`,
          boxShadow: `0 0 ${isHighlighted ? 12 : 6}px ${color}80`,
          transition: 'all 0.3s ease',
        }}
      />
    </div>
  );
}

function OfferBanner({
  venue,
  offer,
}: {
  venue: Venue;
  offer: string;
}) {
  return (
    <MapPopup
      longitude={venue.lng}
      latitude={venue.lat}
      offset={32}
      closeOnClick={false}
      focusAfterOpen={false}
    >
      <div
        className="flex items-start gap-1.5 max-w-[50vw] rounded-none p-0 border-0 shadow-none"
        style={{
          background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
          color: '#fff',
          padding: '6px 12px 6px 9px',
          borderRadius: '6px',
          font: '600 11px/1.4 system-ui, sans-serif',
          boxShadow: '0 3px 12px rgba(124,58,237,0.45)',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0 mt-[1px]"
        >
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
        <span className="break-words whitespace-normal">{offer.trim()}</span>
      </div>
    </MapPopup>
  );
}

function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    const handler = () => onZoomChange(map.getZoom());
    handler();
    map.on('zoomend', handler);
    return () => { map.off('zoomend', handler); };
  }, [map, isLoaded, onZoomChange]);

  return null;
}

function MapClickHandler({ onClick }: { onClick: () => void }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    const handler = () => onClick();
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [map, isLoaded, onClick]);

  return null;
}

function PanToVenue({ venue }: { venue: Venue | null }) {
  const { map, isLoaded } = useMap();
  const prevVenueId = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !isLoaded || !venue) return;
    const venueIdStr = String(venue.venue_id);
    if (prevVenueId.current === venueIdStr) return;
    prevVenueId.current = venueIdStr;
    if (venue.lng && venue.lat) {
      map.easeTo({ center: [venue.lng, venue.lat], duration: 500 });
    }
  }, [map, isLoaded, venue]);

  return null;
}

export default function MapTestPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<HierarchicalFilterState>({
    selectedPrimaries: { genres: [], vibes: [] },
    selectedSecondaries: { genres: {}, vibes: {} },
    expandedPrimaries: { genres: [], vibes: [] },
    eventCategories: {
      selectedPrimaries: [],
      selectedSecondaries: {},
      expandedPrimaries: [],
    },
    attributes: { venue: [], energy: [], timing: [], status: [] },
    selectedAreas: ['All Dubai'],
    activeDates: [],
    activeOffers: [],
    searchQuery: '',
  });

  const { allVenues, filteredVenues, isLoading, error } = useClientSideVenues(filters);

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const { filterOptions } = useFilterOptions();

  const venueDateMap = useMemo(() => {
    const map = new Map<string, { day: string; date: string; dateKey: string; isToday: boolean }[]>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allVenues.forEach((venue) => {
      if (!venue.event_date || !venue.venue_id) return;
      const venueKey = String(venue.venue_id);
      try {
        const d = new Date(venue.event_date);
        if (isNaN(d.getTime())) return;
        const dateKey = d.toDateString();
        if (!map.has(venueKey)) map.set(venueKey, []);
        const existing = map.get(venueKey)!;
        if (!existing.some((e) => e.dateKey === dateKey)) {
          existing.push({
            day: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            dateKey,
            isToday: d.toDateString() === today.toDateString(),
          });
        }
      } catch { /* skip */ }
    });

    map.forEach((dates) => {
      dates.sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime());
    });
    return map;
  }, [allVenues]);

  const cards = useMemo(() => {
    const rawCards = transformSupabaseDataToStackedCards(filteredVenues);
    const todayTime = new Date().setHours(0, 0, 0, 0);
    const dedupMap = new Map<string, (typeof rawCards)[0]>();
    rawCards.forEach((card) => {
      const key = `${card.venue.id}|${(card.event.event_name || '').toLowerCase().trim()}`;
      if (!dedupMap.has(key)) {
        dedupMap.set(key, card);
      } else {
        const existing = dedupMap.get(key)!;
        const existingDist = Math.abs(new Date(existing.event.event_date).getTime() - todayTime);
        const newDist = Math.abs(new Date(card.event.event_date).getTime() - todayTime);
        if (newDist < existingDist) dedupMap.set(key, card);
      }
    });
    let result = Array.from(dedupMap.values());
    if (filters.activeDates.length > 0) {
      result = result.filter((card) => {
        try {
          return filters.activeDates.includes(new Date(card.event.event_date).toDateString());
        } catch { return true; }
      });
    }
    return result.sort(
      (a, b) => (new Date(a.event.event_date).getTime() || 0) - (new Date(b.event.event_date).getTime() || 0),
    );
  }, [filteredVenues, filters.activeDates]);

  const allCards = useMemo(() => {
    const rawCards = transformSupabaseDataToStackedCards(allVenues);
    const eventMap = new Map<string, (typeof rawCards)[0]>();
    rawCards.forEach((card) => {
      if (card.event.id && !eventMap.has(card.event.id)) eventMap.set(card.event.id, card);
    });
    return Array.from(eventMap.values());
  }, [allVenues]);

  const dateFilteredVenues = useMemo(() => {
    if (filters.activeDates.length === 0) return allVenues;
    return allVenues.filter((venue) => {
      if (!venue.event_date) return false;
      try {
        return filters.activeDates.includes(new Date(venue.event_date).toDateString());
      } catch { return false; }
    });
  }, [allVenues, filters.activeDates]);

  const venues = useMemo(() => {
    const venueMap = new Map<number, (typeof filteredVenues)[0]>();
    filteredVenues.forEach((venue) => {
      if (venue.venue_id && !venueMap.has(venue.venue_id)) {
        venueMap.set(venue.venue_id, venue);
      }
    });
    return Array.from(venueMap.values()).filter((v) => v.lat && v.lng);
  }, [filteredVenues]);

  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [mapClickCount, setMapClickCount] = useState(0);
  const [highlightedVenueId, setHighlightedVenueId] = useState<string | null>(null);
  const [highlightedOffer, setHighlightedOffer] = useState<string | null>(null);
  const [presetRangeDates, setPresetRangeDates] = useState<string[]>([]);
  const [navHeight, setNavHeight] = useState(140);
  const [currentZoom, setCurrentZoom] = useState(MAPCN_ZOOM);

  const showLabels = currentZoom >= 14;

  const highlightedVenue = useMemo(() => {
    if (!highlightedVenueId) return null;
    return venues.find((v) => String(v.venue_id) === highlightedVenueId) || null;
  }, [highlightedVenueId, venues]);

  const handleDateChange = (dates: string[]) => {
    setFilters({ ...filters, activeDates: dates });
  };

  const handlePresetRangeDatesChange = useCallback((dates: string[]) => {
    setPresetRangeDates(dates);
  }, []);

  const handleVenueSelect = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
  }, []);

  const handleFiltersChange = (newFilters: HierarchicalFilterState) => {
    setFilters(newFilters);
  };

  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
  }, []);

  if (error) {
    return (
      <main className="h-screen w-full flex items-center justify-center bg-background">
        <div className="retro-surface p-8 max-w-md text-center">
          <h3 className="text-lg font-semibold mb-2 text-red-400">Error Loading Venues</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  if (isLoading && venues.length === 0) {
    return (
      <main className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500/20 border-t-purple-500 mx-auto mb-4" />
          <p className="text-gray-400 text-sm font-medium tracking-wide">Discovering events in Dubai...</p>
        </div>
      </main>
    );
  }

  return (
    <ThemeProvider>
      <main className="h-screen w-full relative overflow-hidden" style={{ height: '100dvh' }}>
        <h1 className="sr-only">Dubai Event Discovery - MapCN Test</h1>

        {/* Mobile TopNav (fixed overlay) */}
        <TopNav
          embedded={false}
          hideProfile={true}
          onSearchClick={() => setIsFilterSheetOpen(true)}
          showDatePicker={true}
          datePickerProps={{
            venues: filteredVenues,
            selectedDates: filters.activeDates,
            onDateChange: handleDateChange,
          }}
          showCategoryPills={true}
          categoryPillsContent={
            <CategoryPills
              filters={filters}
              onFiltersChange={handleFiltersChange}
              venues={dateFilteredVenues}
              inlineMode={true}
            />
          }
          onListToggle={() => router.push('/list')}
          isListView={false}
          onPresetRangeDatesChange={handlePresetRangeDatesChange}
          onHeightChange={setNavHeight}
        />

        {/* Full-screen MapCN Map (light mode) */}
        <div className="absolute inset-0">
          <MapView
            center={MAPCN_CENTER}
            zoom={MAPCN_ZOOM}
            minZoom={MAPCN_MIN_ZOOM}
            maxZoom={MAPCN_MAX_ZOOM}
            maxBounds={MAPCN_BOUNDS}
            theme="light"
            className="w-full h-full"
          >
            <ZoomTracker onZoomChange={handleZoomChange} />
            <PanToVenue venue={highlightedVenue} />
            <MapClickHandler onClick={() => setMapClickCount((c) => c + 1)} />

            {venues.map((venue) => {
              const color = getVenueColor(venue);
              const venueIdStr = String(venue.venue_id);
              const isHighlighted = highlightedVenueId === venueIdStr;
              const hasDimming = !!highlightedVenueId;

              return (
                <MapMarker
                  key={venue.venue_id}
                  longitude={venue.lng}
                  latitude={venue.lat}
                  onClick={() => handleVenueSelect(venue)}
                >
                  <MarkerContent className="flex flex-col items-center">
                    <GlowingMarker
                      color={color}
                      isHighlighted={isHighlighted}
                      isActive={selectedVenue?.venue_id === venue.venue_id}
                      dimmed={hasDimming && !isHighlighted}
                    />
                  </MarkerContent>

                  {showLabels && (
                    <MarkerLabel position="bottom" className="text-gray-700 font-semibold drop-shadow-sm text-[10px]">
                      {venue.name}
                    </MarkerLabel>
                  )}
                </MapMarker>
              );
            })}

            {/* Offer banner for highlighted venue */}
            {highlightedVenue && highlightedOffer && (
              <OfferBanner venue={highlightedVenue} offer={highlightedOffer} />
            )}

            <MapControls position="bottom-right" showZoom showCompass />
          </MapView>

          <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-md px-3 py-1.5 text-xs text-gray-600 border border-gray-200 shadow-sm z-10">
            MapCN (MapLibre) · {venues.length} venues
          </div>
        </div>

        {/* Event cards — slides up from bottom */}
        <MobileEventList
          cards={cards}
          allCards={allCards}
          getCategoryColor={getCategoryColorForStackedCards}
          activeDates={filters.activeDates}
          selectedVenueId={selectedVenue?.venue_id}
          venueDateMap={venueDateMap}
          selectedDates={filters.activeDates}
          onDateChange={handleDateChange}
          dismissSignal={mapClickCount}
          onActiveCardChange={setHighlightedVenueId}
          onActiveOfferChange={setHighlightedOffer}
          presetRangeDates={presetRangeDates}
          navHeight={navHeight}
        />

        {/* Filter Bottom Sheet */}
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
