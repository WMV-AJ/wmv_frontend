'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MobileEventCard from './MobileEventCard';

interface EventCardData {
  event: {
    id: string;
    venue_id: string;
    event_name: string;
    event_subtitle: string;
    event_time_start: string;
    event_time_end: string;
    event_date: string;
    event_entry_price: string;
    event_offers: string;
    category: string;
    artist?: string;
    music_genre?: string;
    event_vibe?: string;
    confidence_score?: number;
    analysis_notes?: string;
    website_social?: string;
    event_categories?: Array<{ primary: string; secondary?: string }>;
  };
  venue: {
    id: string;
    venue_name: string;
    venue_rating: number;
    venue_review_count: number;
    venue_location: string;
    venue_instagram?: string;
    venue_phone?: string;
    venue_coordinates?: { lat: number; lng: number };
    venue_website?: string;
    venue_address?: string;
    venue_highlights?: string;
    venue_atmosphere?: string;
    attributes?: {
      venue?: string[];
      energy?: string[];
      status?: string[];
      timing?: string[];
    };
  };
  // Present only on a card that mergeSameVenueDayCards folded together: every
  // event this venue runs on this date, the first of which is this card.
  sameDayCards?: EventCardData[];
}

interface DateOption {
  day: string;
  date: string;
  dateKey: string;
  isToday: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  hasSameDaySibling?: boolean;
}

interface MobileEventListProps {
  cards: EventCardData[];
  allCards?: EventCardData[];
  getCategoryColor: (category: string) => { hue: number; saturation: number };
  activeDates?: string[];
  selectedVenueId?: number | null;
  venueDateMap?: Map<string, DateOption[]>;
  selectedDates?: string[];
  onDateChange?: (dates: string[]) => void;
  dismissSignal?: number;
  onActiveCardChange?: (venueId: string | null) => void;
  onActiveOfferChange?: (offer: string | null) => void;
  presetRangeDates?: string[];
  navHeight?: number;
  darkMode?: boolean;
}

// Two modes: 'list' shows all cards, 'marker' shows single venue card
type PanelMode = 'list' | 'marker';

const EMPTY_DATE_OPTIONS: DateOption[] = [];

// Memoized carousel slot: without it, every activeCardIndex change re-rendered
// EVERY card in the strip (fresh closures per parent render). With stable
// callbacks, an index change re-renders only the two slots whose isFocused
// flag flipped.
interface CarouselSlotProps {
  card: EventCardData;
  displayCard: EventCardData;
  sameDayCards?: EventCardData[];
  onSameDayEventSelect: (primaryEventId: string, picked: EventCardData) => void;
  displayDates: string[];
  overrideDates: string[] | null;
  dateOptions: DateOption[];
  isSingle: boolean;
  isFocused: boolean;
  darkMode: boolean;
  isPresetRange: boolean;
  presetRangeDates: string[];
  getCategoryColor: (category: string) => { hue: number; saturation: number };
  onExpand: (card: EventCardData, displayCard: EventCardData, overrideDates: string[] | null) => void;
  onClose: () => void;
  onMiniDateChange: (venueId: string, dates: string[]) => void;
  registerRef: (eventId: string, el: HTMLDivElement | null) => void;
}

const CarouselSlot = React.memo<CarouselSlotProps>(function CarouselSlot({
  card,
  displayCard,
  sameDayCards,
  onSameDayEventSelect,
  displayDates,
  overrideDates,
  dateOptions,
  isSingle,
  isFocused,
  darkMode,
  isPresetRange,
  presetRangeDates,
  getCategoryColor,
  onExpand,
  onClose,
  onMiniDateChange,
  registerRef,
}) {
  const handleExpand = () => onExpand(card, displayCard, overrideDates);
  return (
    <div
      ref={(el) => registerRef(card.event.id, el)}
      className="flex-shrink-0 flex"
      style={{
        width: isSingle ? '92%' : '85%',
        scrollSnapAlign: 'center',
      }}
    >
      <MobileEventCard
        card={displayCard}
        sameDayCards={sameDayCards}
        onSameDayEventSelect={(picked) => onSameDayEventSelect(card.event.id, picked)}
        getCategoryColor={getCategoryColor}
        isExpanded={true}
        onToggle={handleExpand}
        isFullScreen={false}
        onFullScreenToggle={handleExpand}
        onClose={onClose}
        dateOptions={dateOptions}
        selectedDates={displayDates}
        onDateChange={(dates) => onMiniDateChange(card.venue.id, dates)}
        isPresetRange={isPresetRange}
        presetRangeDates={presetRangeDates}
        isFocused={isFocused}
        darkMode={darkMode}
      />
    </div>
  );
});

const MobileEventList: React.FC<MobileEventListProps> = ({
  cards,
  allCards = [],
  getCategoryColor,
  activeDates,
  selectedVenueId,
  venueDateMap = new Map(),
  selectedDates = [],
  onDateChange,
  dismissSignal = 0,
  onActiveCardChange,
  onActiveOfferChange,
  presetRangeDates = [],
  navHeight = 140,
  darkMode = false,
}) => {
  const [mode, setMode] = useState<PanelMode>('list');
  const [markerVenueId, setMarkerVenueId] = useState<string | null>(null);
  const [markerFullScreen, setMarkerFullScreen] = useState(false);
  const [listFullScreenVenueId, setListFullScreenVenueId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevSelectedVenueIdRef = useRef<number | null | undefined>(selectedVenueId);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [expandedCardOverride, setExpandedCardOverride] = useState<EventCardData | null>(null);
  const [expandedLocalDates, setExpandedLocalDates] = useState<string[]>([]);
  const [miniCardOverrides, setMiniCardOverrides] = useState<Map<string, { card: EventCardData; dates: string[] }>>(new Map());
  // Which of a merged card's same-day events the viewer picked in the switcher,
  // keyed by the merged card's own event id. Held here rather than inside the
  // card so that expanding it, sharing it, and opening its event page all use
  // the event on screen — the card is rendered from whatever this resolves to.
  const [sameDayPicks, setSameDayPicks] = useState<Map<string, EventCardData>>(new Map());
  const lastExpandedEventIdRef = useRef<string | null>(null);

  // Filter cards: when specific dates are active, only show cards for venues
  // that actually have events on those dates (using venueDateMap as source of truth)
  const displayCards = useMemo(() => {
    if (!activeDates || activeDates.length === 0) return cards;
    return cards.filter(card => {
      const dates = venueDateMap.get(card.venue.id);
      if (!dates || dates.length === 0) return false;
      return dates.some(d => activeDates.includes(d.dateKey));
    });
  }, [cards, activeDates, venueDateMap]);

  const displayCardsRef = useRef(displayCards);
  const hasCards = displayCards.length > 0;

  // Layout-read cache: children's offsetLeft/offsetWidth were read in a loop
  // on EVERY scroll event (layout thrash). Centers only change when the card
  // set changes or the container resizes — precompute them then.
  const childCentersRef = useRef<number[]>([]);
  const halfViewportRef = useRef(0);
  const scrollTickingRef = useRef(false);

  // While the strip is actively scrolling, the focused card's auto-scrolling
  // pills (their own per-frame rAF loop) are paused — two rAF writers plus
  // the map easing is exactly the recipe for dropped frames on mid-range
  // phones. Cleared 180ms after the last scroll event.
  const [isCarouselScrolling, setIsCarouselScrolling] = useState(false);
  const scrollingRef = useRef(false);
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
  }, []);

  const measureCarousel = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    halfViewportRef.current = el.offsetWidth / 2;
    const centers: number[] = [];
    const children = el.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      centers.push(child.offsetLeft + child.offsetWidth / 2);
    }
    childCentersRef.current = centers;
  }, []);

  useEffect(() => {
    measureCarousel();
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measureCarousel);
    ro.observe(el);
    return () => ro.disconnect();
  }, [displayCards, measureCarousel]);

  // Track active card via scroll position — rAF-throttled; reads only
  // scrollLeft (cheap) against the precomputed centers. setActiveCardIndex
  // only re-renders when the NEAREST CARD actually changes (a few times per
  // swipe, not per frame), so the marker highlight + pan can follow it
  // immediately — a settle delay here read as "the marker lags my swipe".
  const handleCarouselScroll = useCallback(() => {
    if (!scrollingRef.current) {
      scrollingRef.current = true;
      setIsCarouselScrolling(true);
    }
    if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    scrollIdleTimerRef.current = setTimeout(() => {
      scrollingRef.current = false;
      setIsCarouselScrolling(false);
    }, 180);

    if (scrollTickingRef.current) return;
    scrollTickingRef.current = true;
    requestAnimationFrame(() => {
      scrollTickingRef.current = false;
      const el = scrollRef.current;
      if (!el) return;
      const viewportCenter = el.scrollLeft + halfViewportRef.current;
      const centers = childCentersRef.current;
      let closestIndex = 0;
      let closestDist = Infinity;
      for (let i = 0; i < centers.length; i++) {
        const dist = Math.abs(centers[i] - viewportCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = i;
        }
      }
      setActiveCardIndex(Math.min(closestIndex, displayCards.length - 1));
    });
  }, [displayCards.length]);

  // Reset carousel position AND immediately highlight first card when cards/filters change
  // When All Dates (activeDates=[]), auto-scroll to today's first card (or nearest future)
  useEffect(() => {
    let startIndex = 0;

    if ((!activeDates || activeDates.length === 0) && displayCards.length > 0) {
      // All Dates mode — find first card with today's date
      const todayStr = new Date().toDateString();
      const todayTime = new Date().setHours(0, 0, 0, 0);
      const todayIndex = displayCards.findIndex(card => {
        try {
          return new Date(card.event.event_date).toDateString() === todayStr;
        } catch { return false; }
      });
      if (todayIndex >= 0) {
        startIndex = todayIndex;
      } else {
        // No events today — find first card with nearest future date
        const futureIndex = displayCards.findIndex(card => {
          try {
            return new Date(card.event.event_date).getTime() >= todayTime;
          } catch { return false; }
        });
        if (futureIndex >= 0) startIndex = futureIndex;
      }
    }

    setActiveCardIndex(startIndex);

    // Scroll to the target card after render
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      if (startIndex === 0) {
        scrollRef.current.scrollLeft = 0;
      } else {
        // Look up the card element by event ID (unique per card)
        const targetEventId = displayCards[startIndex]?.event.id;
        const targetEl = targetEventId ? cardRefs.current.get(targetEventId) : null;
        // Manual scroll for Safari compatibility (scrollIntoView options not fully supported)
        const container = scrollRef.current;
        if (container && targetEl) {
          container.scrollLeft = targetEl.offsetLeft - container.offsetLeft;
        }
      }
    });

    // Immediately notify parent of active card's venue
    const activeCard = displayCards[startIndex];
    if (onActiveCardChange && activeCard) {
      onActiveCardChange(activeCard.venue.id);
      const offer = activeCard.event.event_offers;
      onActiveOfferChange?.(offer && !offer.toLowerCase().includes('no special offer') ? offer : null);
    } else if (onActiveCardChange) {
      onActiveCardChange(null);
      onActiveOfferChange?.(null);
    }

    // Mark that this effect handled the displayCards change (prevents Effect 2 from overwriting with stale index)
    displayCardsRef.current = displayCards;
  }, [activeDates, displayCards, onActiveCardChange, onActiveOfferChange]);

  // Notify parent of active card's venue ID on scroll/mode changes
  useEffect(() => {
    // Skip if displayCards just changed — the reset effect above already notified with the correct index
    if (displayCardsRef.current !== displayCards) {
      displayCardsRef.current = displayCards;
      return;
    }

    if (mode === 'list' && hasCards && !isDismissed && onActiveCardChange) {
      const activeCard = displayCards[activeCardIndex];
      onActiveCardChange(activeCard?.venue.id || null);
      const offer = activeCard?.event.event_offers;
      onActiveOfferChange?.(offer && !offer.toLowerCase().includes('no special offer') ? offer : null);
    } else if (mode === 'marker' && markerVenueId && onActiveCardChange) {
      onActiveCardChange(markerVenueId);
      // For marker mode, find the card to get the correct offer
      const markerCard = displayCards.find(c => c.venue.id === markerVenueId);
      const offer = markerCard?.event.event_offers;
      onActiveOfferChange?.(offer && !offer.toLowerCase().includes('no special offer') ? offer : null);
    } else if (onActiveCardChange && (isDismissed || !hasCards)) {
      onActiveCardChange(null);
      onActiveOfferChange?.(null);
    }
  }, [activeCardIndex, mode, markerVenueId, hasCards, isDismissed, onActiveCardChange, onActiveOfferChange, displayCards]);

  // Dismiss when parent signals (e.g. map click)
  useEffect(() => {
    if (dismissSignal > 0) {
      setIsDismissed(true);
      setMarkerFullScreen(false);
      setListFullScreenVenueId(null);
      setMarkerVenueId(null);
    }
  }, [dismissSignal]);

  // Trigger slide-up animation when content exists (and not dismissed)
  const hasContent = mode === 'list' ? hasCards : markerVenueId !== null;
  useEffect(() => {
    if (hasContent && !isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [hasContent, isDismissed]);

  // Date change → switch to list mode, collapse expanded card, show panel
  useEffect(() => {
    setIsDismissed(false);
    setMode('list');
    setMarkerVenueId(null);
    setMarkerFullScreen(false);
    setListFullScreenVenueId(null);
    setExpandedCardOverride(null);
    setExpandedLocalDates([]);
    setMiniCardOverrides(new Map());
  }, [activeDates]);

  // Cards changed (filter/category change) → collapse expanded card and restore panel
  useEffect(() => {
    setListFullScreenVenueId(null);
    setMarkerFullScreen(false);
    setExpandedCardOverride(null);
    setExpandedLocalDates([]);
    setMiniCardOverrides(new Map());
    // Reset to list mode so filtered cards are visible — marker mode would show
    // nothing if the selected venue was filtered out by the new category filter
    setMode('list');
    setMarkerVenueId(null);
    setIsDismissed(false);
  }, [displayCards]);

  // Map marker click → switch to marker mode with single card
  useEffect(() => {
    const venueChanged = prevSelectedVenueIdRef.current !== selectedVenueId;
    prevSelectedVenueIdRef.current = selectedVenueId;

    if (selectedVenueId != null && venueChanged) {
      const venueIdStr = selectedVenueId.toString();
      const matchingCard = displayCards.find(c => c.venue.id === venueIdStr);
      if (matchingCard) {
        setMode('marker');
        setMarkerVenueId(venueIdStr);
        setMarkerFullScreen(false);
        setIsDismissed(false);
      }
    }
  }, [selectedVenueId, displayCards]);

  // Scroll carousel back to the card that was just collapsed from full-screen
  useEffect(() => {
    if (!listFullScreenVenueId && lastExpandedEventIdRef.current) {
      const eventId = lastExpandedEventIdRef.current;
      lastExpandedEventIdRef.current = null;
      const idx = displayCards.findIndex(c => c.event.id === eventId);
      if (idx >= 0) {
        setActiveCardIndex(idx);
        requestAnimationFrame(() => {
          const targetEl = cardRefs.current.get(eventId);
          if (targetEl && scrollRef.current) {
            scrollRef.current.scrollLeft = targetEl.offsetLeft - scrollRef.current.offsetLeft;
          }
        });
      }
    }
  }, [listFullScreenVenueId, displayCards]);

  // --- List mode handlers ---
  const handleListFullScreenToggle = useCallback((venueId: string, eventId?: string) => {
    setListFullScreenVenueId(prev => {
      if (prev === venueId) {
        lastExpandedEventIdRef.current = eventId || null;
        setExpandedCardOverride(null);
        setExpandedLocalDates([]);
        return null;
      }
      return venueId;
    });
  }, []);

  const handleListDismiss = useCallback(() => {
    setIsDismissed(true);
    setListFullScreenVenueId(null);
  }, []);

  // Stable callbacks for the memoized CarouselSlot
  const handleSlotExpand = useCallback((card: EventCardData, displayCard: EventCardData, overrideDates: string[] | null) => {
    // Always carry the displayed card into expanded view
    setExpandedCardOverride(displayCard);
    if (overrideDates) setExpandedLocalDates(overrideDates);
    handleListFullScreenToggle(card.venue.id, card.event.id);
  }, [handleListFullScreenToggle]);

  const handleSameDayEventSelect = useCallback((primaryEventId: string, picked: EventCardData) => {
    setSameDayPicks(prev => {
      const next = new Map(prev);
      next.set(primaryEventId, picked);
      return next;
    });
  }, []);

  // Resolve a card to the same-day event the viewer picked, if any. The pick is
  // only honoured when it still belongs to this card's group — a date change
  // swaps the card underneath and its events are different ones.
  const withSameDayPick = useCallback((primaryEventId: string, base: EventCardData): EventCardData => {
    const picked = sameDayPicks.get(primaryEventId);
    if (!picked) return base;
    return base.sameDayCards?.some(c => c.event.id === picked.event.id) ? picked : base;
  }, [sameDayPicks]);

  const registerCardRef = useCallback((eventId: string, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(eventId, el);
  }, []);

  // --- Marker mode handlers ---
  const handleMarkerFullScreenToggle = useCallback(() => {
    setMarkerFullScreen(prev => !prev);
  }, []);

  const handleMarkerClose = useCallback(() => {
    setMarkerVenueId(null);
    setMarkerFullScreen(false);
    setIsDismissed(true);
  }, []);

  // Local date change for minicards — switches card data without changing global filter
  // Only allows switching to dates within the active date range (or any date if All Dates)
  const handleMiniCardDateChange = useCallback((venueId: string, dates: string[]) => {
    const dateKey = dates[0];
    if (!dateKey) return;

    // If specific dates are active, only allow switching within that range
    if (activeDates && activeDates.length > 0 && !activeDates.includes(dateKey)) {
      return;
    }

    const matchingCard = allCards.find(c => {
      if (c.venue.id !== venueId) return false;
      try {
        return new Date(c.event.event_date).toDateString() === dateKey;
      } catch { return false; }
    });
    if (matchingCard) {
      setMiniCardOverrides(prev => {
        const next = new Map(prev);
        next.set(venueId, { card: matchingCard, dates });
        return next;
      });
    }
  }, [allCards, activeDates]);

  // Local date change for expanded cards — switches card data without changing global filter
  const handleExpandedDateChange = useCallback((venueId: string, dates: string[]) => {
    const dateKey = dates[0];
    if (!dateKey) return;
    setExpandedLocalDates(dates);
    // Find matching card for this venue on the new date from allCards
    const matchingCard = allCards.find(c => {
      if (c.venue.id !== venueId) return false;
      try {
        const cardDateKey = new Date(c.event.event_date).toDateString();
        return cardDateKey === dateKey;
      } catch { return false; }
    });
    if (matchingCard) {
      setExpandedCardOverride(matchingCard);
    }
  }, [allCards]);

  // Preset range = dropdown has a range preset active (e.g., "This Week")
  const isPresetRange = presetRangeDates.length > 0;

  // Find card data for marker mode
  const markerCard = markerVenueId
    ? displayCards.find(c => c.venue.id === markerVenueId)
    : null;

  // Tapping a marker opens the same merged card, so it gets the same switcher —
  // and the full-screen view follows the pick rather than snapping back to the
  // venue's first event.
  const markerDisplayCard = markerCard ? withSameDayPick(markerCard.event.id, markerCard) : null;

  // Find card data for list full-screen (use override if user changed date inside card)
  const listFullScreenCard = listFullScreenVenueId
    ? (expandedCardOverride && expandedCardOverride.venue.id === listFullScreenVenueId
        ? expandedCardOverride
        : displayCards.find(c => c.venue.id === listFullScreenVenueId))
    : null;

  // Effective selected dates for expanded card (local override or global)
  const expandedSelectedDates = expandedLocalDates.length > 0 ? expandedLocalDates : selectedDates;

  return (
    <>
      {/* ============================================= */}
      {/* MARKER MODE: Single card for map marker click */}
      {/* ============================================= */}
      {mode === 'marker' && markerCard && (
        <>
          {/* Full-screen overlay (marker) */}
          {markerFullScreen && (
            <MobileEventCard
              card={markerDisplayCard!}
              getCategoryColor={getCategoryColor}
              isExpanded={true}
              onToggle={() => setMarkerFullScreen(false)}
              isFullScreen={true}
              onFullScreenToggle={() => setMarkerFullScreen(false)}
              onClose={() => setMarkerFullScreen(false)}
              dateOptions={venueDateMap.get(markerCard.venue.id) || []}
              selectedDates={selectedDates}
              onDateChange={onDateChange}
              isPresetRange={isPresetRange}
              presetRangeDates={presetRangeDates}
              navHeight={navHeight}
              darkMode={darkMode}
            />
          )}

          {/* Bottom slide-up single card (marker) */}
          {!markerFullScreen && (
            <div
              className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto px-3"
              style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            >
              <MobileEventCard
                card={markerDisplayCard!}
                sameDayCards={markerCard.sameDayCards}
                onSameDayEventSelect={(picked) => handleSameDayEventSelect(markerCard.event.id, picked)}
                getCategoryColor={getCategoryColor}
                isExpanded={true}
                onToggle={handleMarkerFullScreenToggle}
                isFullScreen={false}
                onFullScreenToggle={handleMarkerFullScreenToggle}
                onClose={handleMarkerClose}
                dateOptions={venueDateMap.get(markerCard.venue.id) || []}
                selectedDates={selectedDates}
                onDateChange={onDateChange}
                isPresetRange={isPresetRange}
                presetRangeDates={presetRangeDates}
                darkMode={darkMode}
              />
            </div>
          )}
        </>
      )}

      {/* ============================================= */}
      {/* LIST MODE: Scrollable list on date change     */}
      {/* ============================================= */}
      {mode === 'list' && (
        <>
          {/* Full-screen overlay (list) */}
          {listFullScreenCard && (
            <MobileEventCard
              card={listFullScreenCard}
              getCategoryColor={getCategoryColor}
              isExpanded={true}
              onToggle={() => { lastExpandedEventIdRef.current = listFullScreenCard.event.id; setListFullScreenVenueId(null); setExpandedCardOverride(null); setExpandedLocalDates([]); }}
              isFullScreen={true}
              onFullScreenToggle={() => { lastExpandedEventIdRef.current = listFullScreenCard.event.id; setListFullScreenVenueId(null); setExpandedCardOverride(null); setExpandedLocalDates([]); }}
              onClose={() => { lastExpandedEventIdRef.current = listFullScreenCard.event.id; setListFullScreenVenueId(null); setExpandedCardOverride(null); setExpandedLocalDates([]); }}
              dateOptions={venueDateMap.get(listFullScreenCard.venue.id) || []}
              selectedDates={expandedSelectedDates}
              onDateChange={(dates) => handleExpandedDateChange(listFullScreenCard.venue.id, dates)}
              isPresetRange={isPresetRange}
              presetRangeDates={presetRangeDates}
              navHeight={navHeight}
              darkMode={darkMode}
            />
          )}

          {/* Bottom slide-up carousel */}
          {hasCards && !listFullScreenVenueId && (
            <div
              className="absolute bottom-0 left-0 right-0 z-20 flex flex-col pointer-events-auto"
              style={{
                transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            >
              {/* Horizontal carousel */}
              <div
                ref={scrollRef}
                className={`flex overflow-x-auto items-stretch ${displayCards.length === 1 ? 'justify-center' : ''}`}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitScrollSnapType: 'x mandatory',
                  scrollSnapType: 'x mandatory',
                  gap: '12px',
                  padding: '0 12px env(safe-area-inset-bottom, 0px) 12px',
                  // Own horizontal touch outright — stops gesture-direction
                  // contention with the map behind it.
                  touchAction: 'pan-x',
                } as React.CSSProperties}
                onScroll={handleCarouselScroll}
              >
                {displayCards.map((card, cardIndex) => {
                  const override = miniCardOverrides.get(card.venue.id);
                  // Only use override if its date falls within the active date range
                  const isOverrideValid = override && (
                    !activeDates || activeDates.length === 0 ||
                    override.dates.some(d => activeDates.includes(d))
                  );
                  const base = isOverrideValid ? override.card : card;
                  return (
                    <CarouselSlot
                      key={`${card.venue.id}-${card.event.id}`}
                      card={card}
                      displayCard={withSameDayPick(card.event.id, base)}
                      sameDayCards={base.sameDayCards}
                      onSameDayEventSelect={handleSameDayEventSelect}
                      displayDates={isOverrideValid ? override.dates : selectedDates}
                      overrideDates={isOverrideValid ? override.dates : null}
                      dateOptions={venueDateMap.get(card.venue.id) || EMPTY_DATE_OPTIONS}
                      isSingle={displayCards.length === 1}
                      isFocused={cardIndex === activeCardIndex && !isCarouselScrolling}
                      darkMode={darkMode}
                      isPresetRange={isPresetRange}
                      presetRangeDates={presetRangeDates}
                      getCategoryColor={getCategoryColor}
                      onExpand={handleSlotExpand}
                      onClose={handleListDismiss}
                      onMiniDateChange={handleMiniCardDateChange}
                      registerRef={registerCardRef}
                    />
                  );
                })}
              </div>

              {/* Dot indicators */}
              {displayCards.length > 1 && (
                <div className="flex justify-center gap-1.5 pt-1 pb-0.5">
                  {displayCards.map((_, index) => (
                    <div
                      key={index}
                      // transition-colors only: animating width is a layout
                      // operation per index change — the width jump is instant.
                      className="rounded-full transition-colors duration-150"
                      style={{
                        width: index === activeCardIndex ? '16px' : '6px',
                        height: '6px',
                        background: index === activeCardIndex
                          ? (darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0, 0, 0, 0.6)')
                          : (darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0, 0, 0, 0.2)'),
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

// Memoized: the map page re-renders on every swipe (highlight change), and
// all props passed to this list are referentially stable across that change.
export default React.memo(MobileEventList);
