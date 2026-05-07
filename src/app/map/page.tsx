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
  const size = isHighlighted ? 22 : isActive ? 24 : 12;
  const glowSize = isHighlighted ? 44 : isActive ? 48 : 24;

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
      {/* Outer glow / halo — only for active/highlighted */}
      {(isHighlighted || isActive) && (
        <div
          className="absolute rounded-full"
          style={{
            width: glowSize,
            height: glowSize,
            backgroundColor: color,
            opacity: isHighlighted ? 0.25 : 0.2,
            transition: 'all 0.3s ease',
          }}
        />
      )}
      {/* Pulsing ring for highlighted marker */}
      {isHighlighted && (
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
      )}
      {/* Selection ring for active marker */}
      {isActive && !isHighlighted && (
        <div
          className="absolute rounded-full"
          style={{
            width: size + 14,
            height: size + 14,
            border: `3px solid ${color}`,
            opacity: 1,
            transition: 'all 0.3s ease',
          }}
        />
      )}
      {/* White inner ring for active marker — creates contrast between ring and dot */}
      {isActive && !isHighlighted && (
        <div
          className="absolute rounded-full"
          style={{
            width: size + 6,
            height: size + 6,
            border: '2px solid white',
            transition: 'all 0.3s ease',
          }}
        />
      )}
      {/* Inner dot */}
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          boxShadow: (isHighlighted || isActive) ? `0 0 ${isHighlighted ? 14 : 10}px ${color}80` : 'none',
          transition: 'all 0.3s ease',
        }}
      />
    </div>
  );
}

function OfferBanner({
  venue,
  offer,
  color,
}: {
  venue: Venue;
  offer: string;
  color: string;
}) {
  return (
    <MapPopup
      longitude={venue.lng}
      latitude={venue.lat}
      offset={32}
      closeOnClick={false}
      focusAfterOpen={false}
      className="wmv-dark-popup max-w-[200px] p-0 rounded-xl border-0 shadow-none bg-transparent"
    >
      <div
        className="px-[11px] py-[7px] md:px-[8px] md:py-[5px]"
        style={{
          background: 'rgba(10,10,26,0.88)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: `1px solid ${color}55`,
          borderLeft: `3px solid ${color}`,
          borderRadius: '10px',
          boxShadow: `0 4px 20px rgba(0,0,0,0.55), 0 0 12px ${color}22`,
        }}
      >
        <p className="text-[11px] md:text-[9px] font-semibold leading-snug" style={{ color: '#f0f0ff' }}>{offer.trim()}</p>
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
    activeDates: [new Date().toDateString()],
    activeOffers: [],
    searchQuery: '',
  });

  const { allVenues, filteredVenues, isLoading, error } = useClientSideVenues(filters);

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const { filterOptions } = useFilterOptions();

  const venueDateMap = useMemo(() => {
    type DateEntry = {
      day: string; date: string; dateKey: string; isToday: boolean;
      timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
      hasSameDaySibling?: boolean;
    };
    const map = new Map<string, DateEntry[]>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseStartHour = (timeStr: string): number => {
      const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
      if (!match) return -1;
      let h = parseInt(match[1], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h;
    };
    const classifyTime = (h: number): 'morning' | 'afternoon' | 'evening' | 'night' => {
      if (h >= 6 && h < 12) return 'morning';
      if (h >= 12 && h < 18) return 'afternoon';
      if (h >= 18 && h < 22) return 'evening';
      return 'night';
    };

    // Collect raw entries per venue, keyed by date+time combo
    const rawMap = new Map<string, Array<{ dateKey: string; d: Date; eventTime: string }>>();
    allVenues.forEach((venue) => {
      if (!venue.event_date || !venue.venue_id) return;
      const venueKey = String(venue.venue_id);
      const eventTime = venue.event_time || '';
      try {
        const d = new Date(venue.event_date);
        if (isNaN(d.getTime())) return;
        const dateKey = d.toDateString();
        if (!rawMap.has(venueKey)) rawMap.set(venueKey, []);
        const existing = rawMap.get(venueKey)!;
        const combo = `${dateKey}|${eventTime}`;
        if (!existing.some(e => `${e.dateKey}|${e.eventTime}` === combo)) {
          existing.push({ dateKey, d, eventTime });
        }
      } catch { /* skip */ }
    });

    rawMap.forEach((entries, venueKey) => {
      const byDate = new Map<string, typeof entries>();
      entries.forEach(e => {
        if (!byDate.has(e.dateKey)) byDate.set(e.dateKey, []);
        byDate.get(e.dateKey)!.push(e);
      });

      const dateOptions: DateEntry[] = [];
      byDate.forEach((dateEntries, dateKey) => {
        const first = dateEntries[0];
        if (dateEntries.length === 1) {
          dateOptions.push({
            day: first.d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            date: first.d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            dateKey,
            isToday: first.d.toDateString() === today.toDateString(),
          });
        } else {
          dateEntries.forEach(e => {
            const h = parseStartHour(e.eventTime);
            dateOptions.push({
              day: first.d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
              date: first.d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              dateKey,
              isToday: first.d.toDateString() === today.toDateString(),
              timeOfDay: h >= 0 ? classifyTime(h) : undefined,
              hasSameDaySibling: true,
            });
          });
        }
      });

      dateOptions.sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime());
      map.set(venueKey, dateOptions);
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
      <style>{`
        .maplibregl-popup-content:has(.wmv-dark-popup) {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }
        .maplibregl-popup:has(.wmv-dark-popup) .maplibregl-popup-tip {
          display: none !important;
        }
      `}</style>
      {/* Outer wrapper — constrains to 430px like home page, centered on desktop.
          transform: translateZ(0) makes fixed children position relative to this
          container instead of the viewport. */}
      <div className="wmv-phone-frame" style={{
        maxWidth: 430,
        margin: '0 auto',
        height: '100dvh',
        overflow: 'hidden',
        transform: 'translateZ(0)',
        background: '#0a0a14',
      }}>
      <main className="h-full w-full relative overflow-hidden">
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
          onListToggle={() => router.push('/cards')}
          isListView={false}
          onPresetRangeDatesChange={handlePresetRangeDatesChange}
          onHeightChange={setNavHeight}
          darkMode={true}
        />

        {/* Floating category pills — over map, no background */}
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

        {/* Full-screen MapCN Map (dark mode) */}
        <div className="absolute inset-0">
          <MapView
            center={MAPCN_CENTER}
            zoom={MAPCN_ZOOM}
            minZoom={MAPCN_MIN_ZOOM}
            maxZoom={MAPCN_MAX_ZOOM}
            maxBounds={MAPCN_BOUNDS}
            theme="dark"
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
                      dimmed={hasDimming && !isHighlighted && selectedVenue?.venue_id !== venue.venue_id}
                    />
                  </MarkerContent>

                  {showLabels && (
                    <MarkerLabel position="bottom" className="mt-0.5">
                      <span
                        className="text-[10px] font-semibold leading-tight px-1.5 py-0.5 rounded"
                        style={{
                          color: '#1a1a1a',
                          backgroundColor: 'rgba(255,255,255,0.85)',
                          textShadow: '0 0 3px rgba(255,255,255,0.8)',
                        }}
                      >
                        {venue.name}
                      </span>
                    </MarkerLabel>
                  )}
                </MapMarker>
              );
            })}

            {/* Offer banner for highlighted venue */}
            {highlightedVenue && highlightedOffer && (
              <OfferBanner venue={highlightedVenue} offer={highlightedOffer} color={getVenueColor(highlightedVenue)} />
            )}

            <MapControls position="bottom-right" showZoom={false} showCompass={false} />
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
          darkMode={true}
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
      </div>
    </ThemeProvider>
  );
}
