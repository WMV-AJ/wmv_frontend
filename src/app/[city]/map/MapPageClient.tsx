'use client';

import { useState, useMemo, useCallback, useEffect, useRef, memo, type MutableRefObject } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
import NavPill from '@/components/navigation/NavPill';
import CategoryPills from '@/components/filters/CategoryPills';
import FilterBottomSheet from '@/components/filters/FilterBottomSheet';
import MobileEventList from '@/components/mobile/MobileEventList';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useClientSideVenues } from '@/hooks/useClientSideVenues';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import {
  getCategoryColorForStackedCards,
  transformVenueDataToStackedCards,
} from '@/lib/stacked-card-adapter';
import { getMarkerColorScheme, getVenuePrimaryEventCategory } from '@/lib/map/marker-colors';
import { applyBasemapSimplification } from '@/lib/map/simplify-basemap';
import { getDisplayName } from '@/lib/category-mappings';
import { getVibeDataById } from '@/config/vibes-data';
import { type Venue, type HierarchicalFilterState } from '@/types';
import {
  MAPCN_ZOOM,
  MAPCN_MAX_ZOOM,
  getMapCenter,
} from '@/lib/mapcn-config';
import { getCityConfig } from '@/config/cities.config';
import { getCityDateString } from '@/lib/city-date';

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
      {(isHighlighted || isActive) && (
        <div
          className="absolute rounded-full"
          style={{
            width: glowSize,
            height: glowSize,
            backgroundColor: color,
            opacity: isHighlighted ? 0.25 : 0.2,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}
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
      {isActive && !isHighlighted && (
        <div
          className="absolute rounded-full"
          style={{
            width: size + 14,
            height: size + 14,
            border: `3px solid ${color}`,
            opacity: 1,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}
      {isActive && !isHighlighted && (
        <div
          className="absolute rounded-full"
          style={{
            width: size + 6,
            height: size + 6,
            border: '2px solid white',
            transition: 'opacity 0.3s ease',
          }}
        />
      )}
      {/* Fixed 12px dot scaled via transform: size changes stay on the
          compositor instead of animating width/height (layout) per state
          change while MapLibre is already retransforming the marker. */}
      <div
        className="relative rounded-full"
        style={{
          width: 12,
          height: 12,
          backgroundColor: color,
          boxShadow: (isHighlighted || isActive) ? `0 0 ${isHighlighted ? 14 : 10}px ${color}80` : 'none',
          transform: `scale(${size / 12})`,
          transition: 'transform 0.3s ease',
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
          // Opaque instead of backdrop-blur: MapLibre repositions this popup on
          // every pan frame, and backdrop-filter forces a recomposite per frame.
          background: 'rgba(10,10,26,0.95)',
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

// Two-finger rotation can't be disabled via constructor options alone —
// touchZoomRotate is a combined handler, so rotation is switched off post-init.
// Without this (and with the compass hidden) an accidental two-finger twist
// leaves the map permanently rotated with no way to reset it.
function DisableTouchRotation() {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    map.touchZoomRotate.disableRotation();
  }, [map, isLoaded]);

  return null;
}

// Declutters the Carto basemap (minor roads, road labels, POIs) once loaded,
// and re-applies after any style reload — applyBasemapSimplification is
// idempotent, so the repeated styledata firings are harmless.
function SimplifyBasemap() {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    applyBasemapSimplification(map);
    const reapply = () => applyBasemapSimplification(map);
    map.on('styledata', reapply);
    return () => { map.off('styledata', reapply); };
  }, [map, isLoaded]);

  return null;
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

function PanToVenue({
  venue,
  programmaticPanRef,
}: {
  venue: Venue | null;
  programmaticPanRef: MutableRefObject<boolean>;
}) {
  const { map, isLoaded } = useMap();
  const prevVenueId = useRef<string | null>(null);
  const userDraggingRef = useRef(false);

  // Never fight the user's finger: while a drag gesture is in progress the
  // carousel-driven easeTo is skipped (it would yank the map mid-pan).
  useEffect(() => {
    if (!map || !isLoaded) return;
    const onDragStart = () => { userDraggingRef.current = true; };
    const onDragEnd = () => { userDraggingRef.current = false; };
    map.on('dragstart', onDragStart);
    map.on('dragend', onDragEnd);
    return () => {
      map.off('dragstart', onDragStart);
      map.off('dragend', onDragEnd);
    };
  }, [map, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded || !venue) return;
    const venueIdStr = String(venue.venue_id);
    if (prevVenueId.current === venueIdStr) return;
    prevVenueId.current = venueIdStr;
    if (!venue.lng || !venue.lat) return;
    // 150ms debounce: during a fast carousel flick every intermediate card
    // used to fire its own 350ms easeTo, and each animation frame repositions
    // every DOM marker on the main thread — competing with the carousel's own
    // momentum scroll. Debouncing means one pan to the settled card; a single
    // swipe still feels immediate (150ms is under the follow-perception
    // threshold).
    const t = setTimeout(() => {
      if (userDraggingRef.current) return;
      // Flag the move as programmatic so MapCenterTracker doesn't treat the
      // card-follow pan as a user gesture and re-sort the carousel under the
      // user's finger.
      programmaticPanRef.current = true;
      map.once('moveend', () => { programmaticPanRef.current = false; });
      // padding.bottom keeps the target marker centered in the VISIBLE strip
      // above the card carousel instead of hiding underneath it.
      map.easeTo({
        center: [venue.lng, venue.lat],
        duration: 350,
        padding: { top: 120, bottom: 260, left: 0, right: 0 },
      });
    }, 150);
    return () => clearTimeout(t);
  }, [map, isLoaded, venue, programmaticPanRef]);

  return null;
}

// ── Live-location toggle ─────────────────────────────────────────────
// ON: watchPosition keeps a gold "you are here" dot on the map — but only
// when the fix is inside the current city's bounds; being elsewhere shows a
// brief notice and flips the toggle back off (panning the map to another
// country helps nobody). OFF: watcher cleared, dot removed. The preference
// persists per-browser.
const LOCATION_PREF_KEY = 'wmv_location_on';

function useLiveLocation(city: string) {
  const [enabled, setEnabled] = useState(false);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(null), 3500);
  }, []);

  const stop = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation?.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setPos(null);
    setEnabled(false);
    try { window.localStorage.setItem(LOCATION_PREF_KEY, '0'); } catch { /* ignore */ }
  }, []);

  const start = useCallback(() => {
    // Browsers block geolocation on insecure origins (plain HTTP) — the
    // permission prompt never even appears. Real on the HTTP dev2 preview;
    // production (https) is unaffected.
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      showNotice('Location needs a secure (https) connection — works on the live site');
      return;
    }
    if (!navigator.geolocation) {
      showNotice('Location not supported on this device');
      return;
    }
    const bounds = getCityConfig(city).mapBounds;
    setEnabled(true);
    try { window.localStorage.setItem(LOCATION_PREF_KEY, '1'); } catch { /* ignore */ }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (p) => {
        const { latitude: lat, longitude: lng } = p.coords;
        const inside =
          lng >= bounds.west && lng <= bounds.east && lat >= bounds.south && lat <= bounds.north;
        if (!inside) {
          showNotice(`You're outside ${getCityConfig(city).displayName} — location hidden`);
          stop();
          return;
        }
        setPos({ lat, lng });
      },
      () => {
        showNotice('Location permission denied');
        stop();
      },
      { enableHighAccuracy: false, maximumAge: 30_000, timeout: 15_000 },
    );
  }, [city, showNotice, stop]);

  // Restore the saved preference once per mount.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(LOCATION_PREF_KEY) === '1') start();
    } catch { /* ignore */ }
    return () => {
      if (watchIdRef.current != null) navigator.geolocation?.clearWatch(watchIdRef.current);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const toggle = useCallback(() => {
    if (enabled) stop();
    else start();
  }, [enabled, start, stop]);

  return { enabled, pos, notice, toggle };
}

// Fly to the user's position once when it first appears.
function FlyToUser({
  pos,
  programmaticPanRef,
}: {
  pos: { lat: number; lng: number } | null;
  programmaticPanRef: MutableRefObject<boolean>;
}) {
  const { map, isLoaded } = useMap();
  const flownRef = useRef(false);

  useEffect(() => {
    if (!map || !isLoaded || !pos) { if (!pos) flownRef.current = false; return; }
    if (flownRef.current) return;
    flownRef.current = true;
    programmaticPanRef.current = true;
    map.once('moveend', () => { programmaticPanRef.current = false; });
    map.easeTo({
      center: [pos.lng, pos.lat],
      zoom: Math.max(map.getZoom(), 13),
      duration: 800,
      padding: { top: 120, bottom: 260, left: 0, right: 0 },
    });
  }, [map, isLoaded, pos, programmaticPanRef]);

  return null;
}

// Feeds user pans/zooms back into card ordering: once a USER-initiated map
// move settles, the carousel re-sorts by distance from the new map center
// ("show me what's here"). Programmatic moves (card-follow easeTo, fly-to-
// user) are excluded via the shared ref — checking e.originalEvent instead
// would misclassify drag-inertia frames, which fire without one.
function MapCenterTracker({
  programmaticPanRef,
  onUserCenterChange,
}: {
  programmaticPanRef: MutableRefObject<boolean>;
  onUserCenterChange: (center: [number, number]) => void;
}) {
  const { map, isLoaded } = useMap();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!map || !isLoaded) return;
    const onMoveEnd = () => {
      if (programmaticPanRef.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const c = map.getCenter();
        onUserCenterChange([c.lng, c.lat]);
      }, 300);
    };
    map.on('moveend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [map, isLoaded, programmaticPanRef, onUserCenterChange]);

  return null;
}

// Flattens marker styling while the map is moving: MapLibre retransforms
// every DOM marker each animation frame during a pan, and box-shadow /
// animate-ping / text-shadow force expensive repaints per frame. The
// .wmv-map-moving class (see globals.css) strips those effects for the
// duration of the gesture — imperceptible visually, big win on mid-range
// phones.
function MapMoveClassToggler() {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    const container = map.getContainer();
    const onMoveStart = () => container.classList.add('wmv-map-moving');
    const onMoveEnd = () => container.classList.remove('wmv-map-moving');
    map.on('movestart', onMoveStart);
    map.on('moveend', onMoveEnd);
    return () => {
      map.off('movestart', onMoveStart);
      map.off('moveend', onMoveEnd);
      container.classList.remove('wmv-map-moving');
    };
  }, [map, isLoaded]);

  return null;
}

// Memoized per-venue marker: during a card swipe only the outgoing and
// incoming highlighted venues change props, so a highlight change re-renders
// 2 markers instead of every marker on the map.
const VenueMarkerItem = memo(function VenueMarkerItem({
  venue,
  color,
  isHighlighted,
  isActive,
  dimmed,
  showLabel,
  onSelect,
}: {
  venue: Venue;
  color: string;
  isHighlighted: boolean;
  isActive: boolean;
  dimmed: boolean;
  showLabel: boolean;
  onSelect: (venue: Venue) => void;
}) {
  return (
    <MapMarker
      longitude={venue.lng}
      latitude={venue.lat}
      onClick={() => onSelect(venue)}
    >
      <MarkerContent className="flex flex-col items-center">
        <GlowingMarker
          color={color}
          isHighlighted={isHighlighted}
          isActive={isActive}
          dimmed={dimmed}
        />
      </MarkerContent>

      {showLabel && (
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
});

export default function CityMapPage() {
  const params = useParams();
  const city = (params?.city as string) || 'dubai';

  const searchParams = useSearchParams();
  const liveLocation = useLiveLocation(city);

  const [filters, setFilters] = useState<HierarchicalFilterState>(() => {
    // Deep-link seeds (initializer-only — the URL seeds state, it is not
    // two-way-bound): ?cat=Club+Night (repeatable), ?area=Dubai+Marina,
    // ?date=today|tomorrow|YYYY-MM-DD, ?vibe=brunch (vibes-data categories).
    const catParams = searchParams?.getAll('cat') ?? [];
    const vibeParam = searchParams?.get('vibe');
    const areaParam = searchParams?.get('area');
    const dateParam = searchParams?.get('date');

    const seededCategories = [...catParams];
    if (vibeParam) {
      const vibe = getVibeDataById(vibeParam);
      if (vibe) seededCategories.push(...vibe.categories);
    }

    // "Today" is the CITY's today, not the viewer's. Building the entry via
    // `new Date('YYYY-MM-DD')` (UTC midnight) matches how event dates are
    // parsed for comparison, so the toDateString values line up in any
    // viewer timezone. (Viewer-local `new Date()` made an IST viewer's map
    // show zero Dubai events between IST- and Dubai-midnight.)
    const cityTodayEntry = (offsetDays = 0) => {
      const d = new Date(`${getCityDateString(city)}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + offsetDays);
      return d.toDateString();
    };
    let seededDates = [cityTodayEntry(0)]; // Default: the city's today
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
      selectedAreas: [areaParam || getCityConfig(city).defaultAreaLabel],
      activeDates: seededDates,
      activeOffers: [],
      searchQuery: '',
    };
  });

  const { allVenues, filteredVenues, isLoading, error } = useClientSideVenues(filters);

  // Card ordering is localized to the map: distance from this center, which
  // follows USER pans/zooms only (card-follow easeTo pans are flagged
  // programmatic and ignored, so the order never shifts mid-swipe).
  const [sortCenter, setSortCenter] = useState<[number, number]>(() => getMapCenter(city));
  const programmaticPanRef = useRef(false);

  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => setIsReady(true), 50);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

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

    const rawMap = new Map<string, Array<{ dateKey: string; d: Date; eventTime: string }>>();
    allVenues.forEach((venue) => {
      if (!venue.event_date || !venue.venue_id) return;
      const venueKey = String(venue.venue_id);
      const eventTime = venue.event_time || '';
      try {
        const d = new Date(venue.event_date);
        if (isNaN(d.getTime()) || d < today) return;
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
        dateOptions.push({
          day: first.d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
          date: first.d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dateKey,
          isToday: first.d.toDateString() === today.toDateString(),
        });
      });

      dateOptions.sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime());
      map.set(venueKey, dateOptions);
    });

    return map;
  }, [allVenues]);

  const cards = useMemo(() => {
    const rawCards = transformVenueDataToStackedCards(filteredVenues);
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
    // Nearest-to-the-map-center first ("what's around here"), replacing the
    // old date-ascending order that felt random relative to the viewport.
    // Squared equirectangular distance — monotonic, so no sqrt needed.
    const [cLng, cLat] = sortCenter;
    const latScale = Math.cos((cLat * Math.PI) / 180);
    const distSq = (card: (typeof result)[0]): number => {
      const coords = card.venue.venue_coordinates;
      if (!coords) return Number.POSITIVE_INFINITY; // no coords → last
      const dLng = (coords.lng - cLng) * latScale;
      const dLat = coords.lat - cLat;
      return dLng * dLng + dLat * dLat;
    };
    return result.sort((a, b) => distSq(a) - distSq(b));
  }, [filteredVenues, filters.activeDates, sortCenter]);

  const allCards = useMemo(() => {
    const rawCards = transformVenueDataToStackedCards(allVenues);
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

  // For pill counts: future events only (past excluded), no category filter applied.
  // This keeps pill counts accurate and stable regardless of which category is selected.
  const countVenues = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return dateFilteredVenues.filter((v) => {
      if (!v.event_date) return true;
      try {
        const d = new Date(v.event_date);
        return isNaN(d.getTime()) || d >= todayStart;
      } catch { return true; }
    });
  }, [dateFilteredVenues]);

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

  // Stable references: MobileEventList is memoized, so its props must not be
  // recreated when unrelated state (e.g. highlightedVenueId) changes.
  const handleDateChange = useCallback((dates: string[]) => {
    setFilters((prev) => ({ ...prev, activeDates: dates }));
  }, []);

  const handlePresetRangeDatesChange = useCallback((dates: string[]) => {
    setPresetRangeDates(dates);
  }, []);

  const handleVenueSelect = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
  }, []);

  const handleFiltersChange = useCallback((newFilters: HierarchicalFilterState) => {
    setFilters(newFilters);
  }, []);

  const handleUserCenterChange = useCallback((center: [number, number]) => {
    setSortCenter(center);
  }, []);

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
      <div className="wmv-phone-frame" style={{
        maxWidth: 430,
        margin: '0 auto',
        height: '100dvh',
        overflow: 'hidden',
        transform: 'translateZ(0)',
        background: '#0a0a14',
        opacity: isReady ? 1 : 0,
        transition: isReady ? 'opacity 0.3s ease' : 'none',
      }}>
      <main className="h-full w-full relative overflow-hidden">
        <h1 className="sr-only">{getCityConfig(city).displayName} Event Discovery - Map</h1>

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
          onPresetRangeDatesChange={handlePresetRangeDatesChange}
          onHeightChange={setNavHeight}
          darkMode={true}
        />

        <div
          className="fixed left-0 right-0 z-30 px-2"
          style={{ top: navHeight + 6 }}
        >
          <CategoryPills
            filters={filters}
            onFiltersChange={handleFiltersChange}
            venues={countVenues}
            inlineMode={true}
            variant="outlined"
            wrapPills={true}
            darkMode={true}
          />
        </div>

        <div className="absolute inset-0">
          <MapView
            // Force-remount when the resolved city coords change. MapLibre's
            // init runs once with `[]` deps inside the wrapper, so on a
            // dynamic city like Mumbai (not in the static SSR fallback) the
            // map would otherwise stay pinned at Dubai's center even after
            // CitiesProvider populates Mumbai's real config.
            key={getMapCenter(city).join(',')}
            center={getMapCenter(city)}
            zoom={MAPCN_ZOOM}
            // Free-flowing map (Google-Maps-style): no hard bounds clamp —
            // the old per-city maxBounds rubber-banded every pan, which made
            // it impossible to drag the area hidden behind the bottom cards
            // up into view. minZoom 3 allows zooming out; the city center/
            // zoom props still start each city in the right place.
            minZoom={3}
            maxZoom={MAPCN_MAX_ZOOM}
            theme="dark"
            className="w-full h-full"
            dragRotate={false}
            pitchWithRotate={false}
            touchPitch={false}
          >
            <DisableTouchRotation />
            <MapMoveClassToggler />
            <SimplifyBasemap />
            <ZoomTracker onZoomChange={handleZoomChange} />
            <PanToVenue venue={highlightedVenue} programmaticPanRef={programmaticPanRef} />
            <MapCenterTracker
              programmaticPanRef={programmaticPanRef}
              onUserCenterChange={handleUserCenterChange}
            />

            {venues.map((venue) => {
              const venueIdStr = String(venue.venue_id);
              const isHighlighted = highlightedVenueId === venueIdStr;
              const isActive = selectedVenue?.venue_id === venue.venue_id;
              return (
                <VenueMarkerItem
                  key={venue.venue_id}
                  venue={venue}
                  color={getVenueColor(venue)}
                  isHighlighted={isHighlighted}
                  isActive={isActive}
                  dimmed={!!highlightedVenueId && !isHighlighted && !isActive}
                  showLabel={showLabels}
                  onSelect={handleVenueSelect}
                />
              );
            })}

            {highlightedVenue && highlightedOffer && (
              <OfferBanner venue={highlightedVenue} offer={highlightedOffer} color={getVenueColor(highlightedVenue)} />
            )}

            {/* Live "you are here" marker (only inside city bounds).
                A navigation ARROW, not a dot — every venue marker on this map
                is a circle, so any circular shape here reads as a venue. */}
            {liveLocation.pos && (
              <MapMarker longitude={liveLocation.pos.lng} latitude={liveLocation.pos.lat}>
                <MarkerContent>
                  <div style={{
                    width: 30, height: 30,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'wmv-loc-bob 2s ease-in-out infinite',
                  }}>
                    <svg width="26" height="26" viewBox="0 0 24 24"
                      fill="#4285f4" stroke="#fff" strokeWidth="1.6"
                      strokeLinejoin="round"
                      style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.55))' }}
                    >
                      <path d="M3 11l19-9-9 19-2-8-8-2z" />
                    </svg>
                  </div>
                  <style>{`@keyframes wmv-loc-bob { 0%,100% { transform: scale(1) } 50% { transform: scale(1.15) } }`}</style>
                </MarkerContent>
              </MapMarker>
            )}
            <FlyToUser pos={liveLocation.pos} programmaticPanRef={programmaticPanRef} />

            <MapControls position="bottom-right" showZoom={false} showCompass={false} />
          </MapView>

          {process.env.NODE_ENV === 'development' && (
            <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-md px-3 py-1.5 text-xs text-gray-600 border border-gray-200 shadow-sm z-10">
              MapCN (MapLibre) · {venues.length} venues
            </div>
          )}

          {/* Location on/off toggle — above the card carousel */}
          <button
            onClick={liveLocation.toggle}
            aria-label={liveLocation.enabled ? 'Turn location off' : 'Turn location on'}
            className="absolute z-20 flex items-center justify-center"
            style={{
              right: 12,
              bottom: 232,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: liveLocation.enabled ? '#4285f4' : 'rgba(20,20,31,0.9)',
              border: `1px solid ${liveLocation.enabled ? '#4285f4' : 'rgba(255,255,255,0.14)'}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={liveLocation.enabled ? '#fff' : '#f5f2ed'} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <circle cx="12" cy="12" r="8" />
            </svg>
          </button>

          {/* Location notice toast */}
          {liveLocation.notice && (
            <div
              className="absolute z-30"
              style={{
                left: '50%', transform: 'translateX(-50%)', bottom: 288,
                padding: '10px 18px', borderRadius: 999, maxWidth: '85%',
                background: 'rgba(20,20,31,0.95)', border: '1px solid rgba(255,255,255,0.14)',
                color: '#f5f2ed', fontSize: 12, fontWeight: 600, textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              {liveLocation.notice}
            </div>
          )}
        </div>

        <NavPill city={city} active="map" bottomOffset={236} />

        <MobileEventList
          cards={cards}
          allCards={allCards}
          getCategoryColor={getCategoryColorForStackedCards}
          activeDates={filters.activeDates}
          selectedVenueId={selectedVenue ? Number(selectedVenue.venue_id) : null}
          venueDateMap={venueDateMap}
          selectedDates={filters.activeDates}
          onDateChange={handleDateChange}
          onActiveCardChange={setHighlightedVenueId}
          onActiveOfferChange={setHighlightedOffer}
          presetRangeDates={presetRangeDates}
          navHeight={navHeight}
          darkMode={true}
        />

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
