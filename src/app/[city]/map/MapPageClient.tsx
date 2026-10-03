'use client';

import { Gift } from 'lucide-react';
import { useState, useMemo, useCallback, useEffect, useRef, memo, type MutableRefObject, type RefObject } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Map as MapView,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MapControls,
  useMap,
} from '@/components/ui/map';
import TopNav from '@/components/navigation/TopNav';
import NavPill from '@/components/navigation/NavPill';
import CategoryPills from '@/components/filters/CategoryPills';
import FilterBottomSheet from '@/components/filters/FilterBottomSheet';
import MobileEventList from '@/components/mobile/MobileEventList';
import { useClientSideVenues } from '@/hooks/useClientSideVenues';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import {
  getCategoryColorForStackedCards,
  transformVenueDataToStackedCards,
} from '@/lib/stacked-card-adapter';
import { getMarkerColorScheme, getVenuePrimaryEventCategory } from '@/lib/map/marker-colors';
import { applyBasemapSimplification } from '@/lib/map/simplify-basemap';
import { useTheme } from '@/contexts/ThemeContext';
import { getDisplayName } from '@/lib/category-mappings';
import { getCategoryIcon } from '@/lib/category-icons';
import { getCardAccent } from '@/components/shared/card-style';
import { getVibeDataById } from '@/config/vibes-data';
import { type Venue, type HierarchicalFilterState } from '@/types';
import {
  MAPCN_ZOOM,
  MAPCN_MAX_ZOOM,
  getMapCenter,
} from '@/lib/mapcn-config';
import { getCityConfig } from '@/config/cities.config';
import { getCityDateString } from '@/lib/city-date';
import { FRAME_MAX_WIDTH } from '@/lib/theme/tokens';

type MapPadding = { top: number; bottom: number; left: number; right: number };

function getVenueColor(venue: Venue): string {
  return getMarkerColorScheme(venue).svgColor;
}

// Category icon goes dark on the pale hues (Oat, Cream, Sage, Peach tints)
// so it stays visible inside the filled circle.
function isLightHex(hex: string): boolean {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return false;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

const SELECTED_SIZE = 34;

function GlowingMarker({
  color,
  category,
  isHighlighted,
  isActive,
  dimmed,
}: {
  color: string;
  category: string;
  isHighlighted: boolean;
  isActive: boolean;
  dimmed: boolean;
}) {
  const selected = isHighlighted || isActive;
  const box = selected ? SELECTED_SIZE + 22 : 24;
  const Icon = getCategoryIcon(category);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: box,
        height: box,
        opacity: dimmed ? 0.55 : 1,
        zIndex: isHighlighted ? 999 : isActive ? 998 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      {selected && (
        <div
          className="absolute rounded-full"
          style={{ width: box, height: box, backgroundColor: color, opacity: 0.22 }}
        />
      )}
      {isHighlighted && (
        <div
          className="absolute rounded-full animate-ping"
          style={{
            width: SELECTED_SIZE + 10,
            height: SELECTED_SIZE + 10,
            border: `2px solid ${color}`,
            opacity: 0.45,
            animationDuration: '1.5s',
          }}
        />
      )}
      {selected ? (
        // Selected: a filled category circle with its icon inside.
        <div
          className="relative rounded-full flex items-center justify-center"
          style={{
            width: SELECTED_SIZE,
            height: SELECTED_SIZE,
            backgroundColor: color,
            border: '2px solid #ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <Icon
            className="w-4 h-4"
            strokeWidth={2.4}
            style={{ color: isLightHex(color) ? '#161513' : '#ffffff' }}
          />
        </div>
      ) : (
        // Idle: a small dot; the white ring keeps it readable on the grey map.
        <div
          className="relative rounded-full"
          style={{
            width: 12,
            height: 12,
            backgroundColor: color,
            border: '1.5px solid #ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      )}
    </div>
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
// The basemap is always the dusk-slate dark-matter (see the <MapView theme>
// and applyLandTint in ui/map.tsx), so simplification runs in dark mode.
function SimplifyBasemap() {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    applyBasemapSimplification(map, true);
    const reapply = () => applyBasemapSimplification(map, true);
    map.on('styledata', reapply);
    return () => { map.off('styledata', reapply); };
  }, [map, isLoaded]);

  return null;
}

// Google-Maps-style name labels: a few of the best-rated venues are named
// when zoomed out, more appear as you zoom in. On every settled move, venues
// in view are ranked by rating × log(review count) and placed greedily,
// skipping any label that would overlap one already placed, up to a
// per-zoom budget. Re-placed while zooming/panning (throttled) so names
// appear and drop out as the zoom changes, like Google Maps.
const LABEL_BUDGET: Array<[minZoom: number, max: number]> = [
  [15, Infinity], [14, 60], [13, 30], [12, 14], [11, 8], [0, 5],
];
const LABEL_H = 24;
const LABEL_PAD = 3;

// Map labels use the venue's short name: "Café De Paris - French Restaurant
// | Cafe" → "Café De Paris", "Nikki Beach Dubai (Beach Club…)" → "Nikki
// Beach Dubai", capped at 22 chars.
function shortVenueName(name: string): string {
  const base = (name.split(/\s+[-|–—]\s+|\s*\(/)[0] || name).trim();
  return base.length > 22 ? `${base.slice(0, 21).trimEnd()}…` : base;
}

// Deal text inside the selected pill: first clause, capped at 28 chars.
function shortOffer(offer: string): string {
  const base = (offer.split(/[.;\n]/)[0] || offer).trim();
  return base.length > 28 ? `${base.slice(0, 27).trimEnd()}…` : base;
}

// Name pills sit ABOVE the marker. `text` is everything shown in the pill;
// `above` = distance from the marker centre to the pill's bottom edge.
function labelBox(x: number, y: number, text: string, above: number): [number, number, number, number] {
  const width = text.length * 7 + 24;
  return [
    x - width / 2 - LABEL_PAD, y - above - LABEL_H - LABEL_PAD,
    x + width / 2 + LABEL_PAD, y - above + LABEL_PAD,
  ];
}

function venueScore(venue: Venue): number {
  const rating = venue.rating ?? 0;
  return rating * Math.log10((venue.rating_count ?? 0) + 1);
}

function LabelPlacer({
  venues,
  selectedVenue,
  selectedOffer,
  mapPaddingRef,
  pillsRef,
  onChange,
}: {
  venues: Venue[];
  /** Highlighted/active venue: its marker + label are reserved first. */
  selectedVenue: Venue | null;
  /** Deal shown inside the selected venue's pill (widens its box). */
  selectedOffer: string | null;
  /** Areas covered by the top nav and bottom cards — no labels there. */
  mapPaddingRef: MutableRefObject<MapPadding>;
  /** Category pill rows overlaying the top of the map. */
  pillsRef: RefObject<HTMLDivElement | null>;
  onChange: (ids: Set<string>) => void;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    const ranked = [...venues].sort((a, b) => venueScore(b) - venueScore(a));
    const place = () => {
      const zoom = map.getZoom();
      const budget = LABEL_BUDGET.find(([z]) => zoom >= z)?.[1] ?? 4;
      const { clientWidth: w, clientHeight: h } = map.getContainer();
      const pad = mapPaddingRef.current;
      const mapTop = map.getContainer().getBoundingClientRect().top;
      const pillsBottom = pillsRef.current
        ? pillsRef.current.getBoundingClientRect().bottom - mapTop + 4
        : 0;
      const topLimit = Math.max(pad.top, pillsBottom);
      const boxes: Array<[number, number, number, number]> = [];
      const ids = new Set<string>();
      if (selectedVenue) {
        // The selected circle (56px with halo) and its name label.
        const p = map.project([selectedVenue.lng, selectedVenue.lat]);
        boxes.push([p.x - 30, p.y - 30, p.x + 30, p.y + 30]);
        // "   " stands in for the divider + gift icon width.
        const text = shortVenueName(selectedVenue.name ?? '') + (selectedOffer ? `   ${shortOffer(selectedOffer)}` : '');
        // +8: the pill's tail.
        boxes.push(labelBox(p.x, p.y, text, 38));
      }
      for (const venue of ranked) {
        if (ids.size >= budget) break;
        if (selectedVenue && venue.venue_id === selectedVenue.venue_id) continue;
        const p = map.project([venue.lng, venue.lat]);
        if (p.y > h - pad.bottom) continue;
        // Label sits on top of the 24px idle marker box; it must fit fully
        // inside the visible map (not under the nav pills or off an edge).
        const box = labelBox(p.x, p.y, shortVenueName(venue.name ?? ''), 14);
        if (box[0] < 0 || box[2] > w || box[1] < topLimit) continue;
        const hit = boxes.some((o) => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1]);
        if (hit) continue;
        boxes.push(box);
        ids.add(String(venue.venue_id));
      }
      onChange(ids);
    };
    let last = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const throttled = () => {
      const wait = 150 - (Date.now() - last);
      if (wait <= 0) { last = Date.now(); place(); return; }
      if (!timer) timer = setTimeout(() => { timer = null; last = Date.now(); place(); }, wait);
    };
    place();
    map.on('move', throttled);
    map.on('moveend', place);
    return () => {
      map.off('move', throttled);
      map.off('moveend', place);
      if (timer) clearTimeout(timer);
    };
  }, [map, isLoaded, venues, selectedVenue, selectedOffer, mapPaddingRef, pillsRef, onChange]);

  return null;
}

function PanToVenue({
  venue,
  programmaticPanRef,
  mapPaddingRef,
}: {
  venue: Venue | null;
  programmaticPanRef: MutableRefObject<boolean>;
  mapPaddingRef: MutableRefObject<MapPadding>;
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
        padding: mapPaddingRef.current,
      });
    }, 150);
    return () => clearTimeout(t);
  }, [map, isLoaded, venue, programmaticPanRef, mapPaddingRef]);

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
  mapPaddingRef,
}: {
  pos: { lat: number; lng: number } | null;
  programmaticPanRef: MutableRefObject<boolean>;
  mapPaddingRef: MutableRefObject<MapPadding>;
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
      padding: mapPaddingRef.current,
    });
  }, [map, isLoaded, pos, programmaticPanRef, mapPaddingRef]);

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
  category,
  isHighlighted,
  isActive,
  dimmed,
  showLabel,
  offer,
  onSelect,
}: {
  venue: Venue;
  color: string;
  category: string;
  isHighlighted: boolean;
  isActive: boolean;
  dimmed: boolean;
  showLabel: boolean;
  /** Deal for the selected venue — shown inside its pill. */
  offer: string | null;
  onSelect: (venue: Venue) => void;
}) {
  const selected = isHighlighted || isActive;
  return (
    <MapMarker
      longitude={venue.lng}
      latitude={venue.lat}
      onClick={() => onSelect(venue)}
    >
      <MarkerContent className="flex flex-col items-center">
        <GlowingMarker
          color={color}
          category={category}
          isHighlighted={isHighlighted}
          isActive={isActive}
          dimmed={dimmed}
        />
        {/* Inside MarkerContent: only its portal reaches the marker element. */}
        {showLabel && (
          <MarkerLabel position="top" className={selected ? 'mb-2' : 'mb-0.5'}>
            {/* One pill system (Airbnb-style): dark pills for names; the
                selected venue's pill inverts to white and carries its deal. */}
            <span
              className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 leading-tight whitespace-nowrap ${selected ? 'text-[13px] font-bold' : 'text-[12px] font-semibold'}`}
              style={selected ? {
                color: '#161513',
                backgroundColor: '#ffffff',
                boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
                maxWidth: 260,
              } : {
                color: '#f5f5f5',
                backgroundColor: 'rgba(22,22,22,0.92)',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              <span className="truncate">{shortVenueName(venue.name ?? '')}</span>
              {selected && offer && (
                <>
                  <span aria-hidden className="self-stretch w-px" style={{ background: 'rgba(22,21,19,0.18)' }} />
                  <Gift aria-hidden className="w-3.5 h-3.5 flex-shrink-0" style={{ color: getCardAccent(category).text }} />
                  <span className="truncate text-[12px] font-semibold">{shortOffer(offer)}</span>
                </>
              )}
              {selected && (
                <span
                  aria-hidden
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    top: '100%',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid #ffffff',
                  }}
                />
              )}
            </span>
          </MarkerLabel>
        )}
      </MarkerContent>
    </MapMarker>
  );
});

export default function CityMapPage() {
  const params = useParams();
  const { isDarkMode } = useTheme();
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
    // The CITY's today (see useClientSideVenues): a viewer-local midnight
    // dropped the city's current-day dates every evening for IST viewers,
    // which emptied the carousel and the pill counts.
    const cityToday = getCityDateString(city);
    const todayKey = new Date(`${cityToday}T00:00:00Z`).toDateString();

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
        if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) < cityToday) return;
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
          isToday: first.d.toDateString() === todayKey,
        });
      });

      dateOptions.sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime());
      map.set(venueKey, dateOptions);
    });

    return map;
  }, [allVenues, city]);

  const cards = useMemo(() => {
    const rawCards = transformVenueDataToStackedCards(filteredVenues);
    const todayTime = new Date(`${getCityDateString(city)}T00:00:00Z`).getTime();
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
  }, [filteredVenues, filters.activeDates, sortCenter, city]);

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
    const cityToday = getCityDateString(city);
    return dateFilteredVenues.filter((v) => {
      if (!v.event_date) return true;
      try {
        const d = new Date(v.event_date);
        return isNaN(d.getTime()) || d.toISOString().slice(0, 10) >= cityToday;
      } catch { return true; }
    });
  }, [dateFilteredVenues, city]);

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
  // Category pill rows under the nav — map name labels stay below them.
  const pillsRef = useRef<HTMLDivElement>(null);

  // ── Bottom chrome geometry ──────────────────────────────────────────
  // The card panel is `absolute bottom-0` with a content-driven height, so
  // everything that has to sit above it used to be a hand-tuned constant
  // (228 / 232 / 288 / 260). They drifted apart the moment the panel changed
  // height. Measure the panel once and derive the rest.
  const [panelHeight, setPanelHeight] = useState(0);
  const handlePanelHeight = useCallback(
    (h: number) => setPanelHeight(prev => (Math.abs(prev - h) < 1 ? prev : Math.round(h))),
    [],
  );

  const NAV_PILL_H = 48;   // 38px buttons + 2x4 padding + 2x1 border (NavPill)
  const LOCATE_H = 40;     // the round locate-me button
  const GAP = 10;          // the only tunable: clearance above the panel

  const navPillBottom = Math.max(panelHeight + GAP, 16);
  const locateBottom = navPillBottom + (NAV_PILL_H - LOCATE_H) / 2;
  const toastBottom = navPillBottom + NAV_PILL_H + 8;

  const mapPaddingRef = useRef<MapPadding>({ top: 120, bottom: 260, left: 0, right: 0 });
  useEffect(() => {
    mapPaddingRef.current = {
      top: navHeight + 12,
      bottom: navPillBottom + NAV_PILL_H + 12,
      left: 0,
      right: 0,
    };
  }, [navHeight, navPillBottom]);

  const [labelledVenueIds, setLabelledVenueIds] = useState<Set<string>>(() => new Set());

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
    <>
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
        maxWidth: FRAME_MAX_WIDTH,
        margin: '0 auto',
        height: '100dvh',
        overflow: 'hidden',
        transform: 'translateZ(0)',
        background: 'var(--wmv-bg)',
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
          darkMode={isDarkMode}
        />

        <div
          ref={pillsRef}
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
            darkMode={isDarkMode}
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
            // Always the dusk-slate basemap (applyLandTint in ui/map.tsx).
            theme="dark"
            className="w-full h-full"
            dragRotate={false}
            pitchWithRotate={false}
            touchPitch={false}
          >
            <DisableTouchRotation />
            <MapMoveClassToggler />
            <SimplifyBasemap />
            <LabelPlacer
              venues={venues}
              selectedVenue={highlightedVenue ?? selectedVenue}
              selectedOffer={highlightedVenue ? highlightedOffer : null}
              mapPaddingRef={mapPaddingRef}
              pillsRef={pillsRef}
              onChange={setLabelledVenueIds}
            />
            <PanToVenue venue={highlightedVenue} programmaticPanRef={programmaticPanRef} mapPaddingRef={mapPaddingRef} />
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
                  category={getVenuePrimaryEventCategory(venue)}
                  isHighlighted={isHighlighted}
                  isActive={isActive}
                  dimmed={!!highlightedVenueId && !isHighlighted && !isActive}
                  showLabel={isHighlighted || isActive || labelledVenueIds.has(venueIdStr)}
                  offer={isHighlighted ? highlightedOffer : null}
                  onSelect={handleVenueSelect}
                />
              );
            })}

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
            <FlyToUser pos={liveLocation.pos} programmaticPanRef={programmaticPanRef} mapPaddingRef={mapPaddingRef} />

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
              bottom: locateBottom,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: liveLocation.enabled ? '#4285f4' : 'var(--wmv-chrome)',
              border: `1px solid ${liveLocation.enabled ? '#4285f4' : 'var(--wmv-line)'}`,
              boxShadow: '0 4px 16px var(--wmv-shadow)',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              style={{ stroke: liveLocation.enabled ? '#fff' : 'var(--wmv-ink)' }} strokeWidth="2"
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
                left: '50%', transform: 'translateX(-50%)', bottom: toastBottom,
                padding: '10px 18px', borderRadius: 999, maxWidth: '85%',
                background: 'var(--wmv-chrome)', border: '1px solid var(--wmv-line)',
                color: 'var(--wmv-ink)', fontSize: 12, fontWeight: 600, textAlign: 'center',
                boxShadow: '0 8px 24px var(--wmv-shadow)',
              }}
            >
              {liveLocation.notice}
            </div>
          )}
        </div>

        {/* bottomOffset is measured from the card panel, which already pays
            the safe-area inset in its own padding — hence safeAreaAware={false},
            otherwise notched iPhones would add the inset a second time. */}
        <NavPill
          city={city}
          active="map"
          bottomOffset={navPillBottom}
          safeAreaAware={false}
          hidden={isFilterSheetOpen}
        />

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
          darkMode={isDarkMode}
          onPanelHeightChange={handlePanelHeight}
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
    </>
  );
}
