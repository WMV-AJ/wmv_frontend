'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { trackEvent } from '@/lib/analytics/track';
import { ShareModal } from '@/components/shared/ShareModal';
import { shortenLocation } from '@/lib/format-location';
import { formatDateLabel } from '@/lib/time-utils';
import { getShortDisplayName } from '@/lib/category-mappings';
import EventMedia from '@/components/shared/EventMedia';
import {
  H4_LABEL,
  H4_CHIP,
  TILE_RULE,
  DEAL_LABELS,
  joinList,
  resolveAccentCategory,
  getCardAccent,
  useRatingWrap,
} from '@/components/shared/card-style';
import {
  Clock,
  Building2,
  Navigation2,
  Star,
  Calendar,
  DollarSign,
  Tag,
  Sparkles,
  Music,
  Mic,
  Gift,
  FileText,
  MapPin,
  Link as LinkIcon,
  Instagram,
  Phone,
  Share2,
  Ticket,
  Navigation,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './StackedEventCards.css';

// ===========================================
// TYPE DEFINITIONS
// ===========================================

interface Venue {
  id: string;
  venue_name: string;
  venue_rating: number;
  venue_review_count: number;
  venue_location: string;
  venue_instagram?: string;
  venue_phone?: string;
  venue_coordinates?: { lat: number; lng: number };

  // New fields
  venue_website?: string;
  venue_address?: string;
  venue_highlights?: string;
  venue_atmosphere?: string;
  attributes?: any;
}

interface Event {
  id: string;
  venue_id: string;
  event_name: string;
  event_subtitle: string;
  event_time_start: string;
  event_time_end: string;
  event_time_display?: string;
  event_date: string;
  event_entry_price: string;
  event_offers: string;
  category: string;

  // New fields
  artist?: string;
  music_genre?: string;
  event_vibe?: string;
  confidence_score?: number;
  analysis_notes?: string;
  website_social?: string;
  event_categories?: Array<{ primary: string; secondary?: string; confidence?: number }>;
  deals?: Array<{ type: string; timing?: string | null; description: string }>;
  media_url_1?: string;
  media_type_1?: string;
  media_url_2?: string;
  media_type_2?: string;
  swipe_link_url?: string | null;
}

interface EventCardData {
  event: Event;
  venue: Venue;
}

interface StackedEventCardsProps {
  cards: EventCardData[];
  /** @deprecated Cards now take their colour from the category accent
   *  (card-style.getCardAccent); kept optional so callers need no change. */
  getCategoryColor?: (category: string) => { hue: number; saturation: number };
}

interface EventCardProps {
  event: Event;
  venue: Venue;
  index: number;
  isExpanded: boolean;
  onCardClick: (id: string) => void;
  contentRef: React.RefObject<HTMLDivElement | null> | null;
  contentHeight: number;
}

// ===========================================
// SUBTITLE UTILITY
// ===========================================

function generateSmartSubtitle(
  eventName: string,
  venueName: string,
  subtitle: string
): string {
  if (!subtitle || !eventName || !venueName) return '';
  if (!subtitle.trim()) return '';

  const normalize = (str: string) =>
    str.toLowerCase().trim().replace(/[^\w\s]/g, '');

  const normalizedEvent = normalize(eventName);
  const normalizedVenue = normalize(venueName);
  const normalizedSubtitle = normalize(subtitle);

  const isRedundant =
    normalizedSubtitle.includes(normalizedVenue) &&
    normalizedSubtitle.includes(normalizedEvent) &&
    normalizedSubtitle.length < normalizedVenue.length + normalizedEvent.length + 10;

  return isRedundant ? '' : subtitle;
}

// ===========================================
// EVENT CARD COMPONENT
// ===========================================

const EventCard: React.FC<EventCardProps> = ({
  event,
  venue,
  index,
  isExpanded,
  onCardClick,
  contentRef,
  contentHeight,
}) => {
  // Same accent, type and icons as the map tile (MobileEventCard) — see
  // @/components/shared/card-style.
  const accentCategory = resolveAccentCategory(event);
  const accent = getCardAccent(accentCategory);
  const {
    nameRef: venueNameRef,
    ratingRef,
    wrapped: ratingWrapped,
  } = useRatingWrap(`${venue.venue_name}|${venue.venue_rating}|${venue.venue_review_count}`);
  const timeLabel = event.event_time_display
    || (event.event_time_start ? `${event.event_time_start}${event.event_time_end ? ` – ${event.event_time_end}` : ''}` : '');
  // The list can span several dates, so unlike the map tile the date always
  // leads the time line.
  const dateTimeLabel = [formatDateLabel(event.event_date), timeLabel].filter(Boolean).join(' · ');
  const params = useParams();
  const city = (params?.city as string) || 'dubai';

  const [showShareModal, setShowShareModal] = useState(false);
  // Tap on the thumbnail opens the media fullscreen instead of toggling
  // the card expansion.
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; isVideo: boolean } | null>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const handleDetailsToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDetailsExpanded) {
      trackEvent('expand_event_card', {
        event_id: event.id,
        venue_id: venue.id,
        event_name: event.event_name,
        source: 'details_toggle',
      });
    }
    setIsDetailsExpanded(!isDetailsExpanded);
  };

  const handleInstagramClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (venue.venue_instagram) {
      const handle = venue.venue_instagram.startsWith('http')
        ? venue.venue_instagram
        : venue.venue_instagram.replace('@', '');
      trackEvent('click_instagram', {
        instagram_handle: handle,
        source: 'stacked_card',
      });
      if (venue.venue_instagram.startsWith('http')) {
        window.open(venue.venue_instagram, '_blank');
      } else {
        window.open(`https://instagram.com/${handle}`, '_blank');
      }
    }
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (venue.venue_phone) {
      window.location.href = `tel:${venue.venue_phone}`;
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleDirectionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (venue.venue_coordinates) {
      const { lat, lng } = venue.venue_coordinates;
      const venueName = venue.venue_name ? encodeURIComponent(venue.venue_name) : '';
      const url = venueName
        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&query=${venueName}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    } else if (venue.venue_address) {
      const address = encodeURIComponent(venue.venue_address);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
    }
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event.swipe_link_url) return;
    const url = event.swipe_link_url.startsWith('http')
      ? event.swipe_link_url
      : `https://${event.swipe_link_url}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const labelCls = `${H4_LABEL} text-silver-dim`;
  const valueCls = 'font-inter font-[550] text-[14px] leading-snug mt-1 text-pale';
  const longCls = 'text-[12px] leading-relaxed mt-1 text-silver';

  // "Fri, Sep 26" — short enough for a half-width detail cell.
  const shortDate = (() => {
    const d = new Date(event.event_date);
    return isNaN(d.getTime())
      ? event.event_date
      : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  })();

  const renderDetailCell = (key: string, Icon: LucideIcon, label: string, body: React.ReactNode, wide = false) => (
    <div key={key} className={`pt-2.5 pb-3 min-w-0 ${wide ? 'col-span-2' : ''}`} style={{ borderTop: `1px solid ${TILE_RULE}` }}>
      <div className="flex items-center gap-1.5">
        <Icon aria-hidden className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accent.text }} />
        <p className={`${labelCls} truncate`}>{label}</p>
      </div>
      {body}
    </div>
  );

  const shortCells: Array<{ key: string; icon: LucideIcon; label: string; body: React.ReactNode }> = [
    {
      key: 'date', icon: Calendar, label: 'Date & Time', body: (
        <>
          <p className={valueCls}>{shortDate || 'TBA'}</p>
          {timeLabel && <p className={longCls}>{timeLabel}</p>}
        </>
      ),
    },
    { key: 'entry', icon: DollarSign, label: 'Entry', body: <p className={valueCls}>{event.event_entry_price || 'TBA'}</p> },
  ];
  if (event.event_categories && event.event_categories.length > 0) {
    shortCells.push({
      key: 'type', icon: Tag,
      label: event.event_categories.map((cat) => cat.primary).join(', '),
      body: <p className={valueCls}>{event.event_categories.map((cat) => cat.secondary).filter(Boolean).join(', ') || '—'}</p>,
    });
  }
  if (event.event_vibe) shortCells.push({ key: 'vibes', icon: Sparkles, label: 'Vibes', body: <p className={valueCls}>{joinList(event.event_vibe, '|')}</p> });
  if (event.music_genre) shortCells.push({ key: 'music', icon: Music, label: 'Music', body: <p className={valueCls}>{joinList(event.music_genre, ',')}</p> });
  if (event.artist) shortCells.push({ key: 'artists', icon: Mic, label: 'Artists', body: <p className={valueCls}>{joinList(event.artist, /[|,]/)}</p> });

  const hasDeals = !!event.deals && event.deals.length > 0;
  const hasOfferText = !!event.event_offers && !event.event_offers.toLowerCase().includes('no special offers');

  // Venue highlights / atmosphere arrive as JSON arrays of single-key objects
  // or as plain strings.
  const parseKeys = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Array.isArray(parsed) ? parsed.map((obj: any) => Object.keys(obj)[0]).join(', ') : value;
    } catch {
      return value;
    }
  };

  const mediaUrl = event.media_url_1 || event.media_url_2;
  const mediaType = event.media_url_1 ? event.media_type_1 : event.media_type_2;
  const siblingUrl = mediaUrl === event.media_url_1 ? event.media_url_2 : undefined;
  const isVideoUrl = (u: string) => /\.(mp4|mov|webm)(\?.*)?$/i.test(u);

  return (
    <>
    <div
      id={`card-${event.id}`}
      className={`stacked-card font-inter antialiased ${isExpanded ? 'expanded' : ''}`}
      style={{
        // The map tile's flat, category-tinted fill and 3px accent top edge.
        // In the stack each card's top edge stays visible, so it doubles as
        // a category stripe.
        background: accent.tileBg,
        borderTop: `3px solid ${accent.edge}`,
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: `0 2px 20px rgba(0, 0, 0, 0.5), 0 0 16px ${accent.glow}`,
        zIndex: isExpanded ? 9999 : index + 1,
        '--content-height': `${contentHeight}px`,
      } as React.CSSProperties}
      onClick={() => onCardClick(event.id)}
    >
      {/* HEADER — the map tile's copy column + 25% 9:16 still */}
      <div className="stacked-card-header">
        <div className="flex-1 min-w-0 flex flex-col">
          <h2 className="font-inter font-semibold uppercase text-[15px] leading-tight tracking-[-0.01em] line-clamp-2 text-pale">
            {event.event_name}
          </h2>

          <span className={`${H4_LABEL} flex items-center gap-1.5 mt-1 text-silver`}>
            <Clock aria-hidden className="w-3 h-3 flex-shrink-0" style={{ color: accent.text }} />
            <span className="truncate">{dateTimeLabel}</span>
          </span>

          {accentCategory && (
            <span
              className={`self-start mt-1 ${H4_CHIP} px-2.5 py-1 rounded-full whitespace-nowrap`}
              style={{ background: accent.soft, color: accent.text, border: `1px solid ${accent.border}` }}
            >
              {getShortDisplayName(accentCategory)}
            </span>
          )}

          {(() => {
            const smartSubtitle = generateSmartSubtitle(event.event_name, venue.venue_name, event.event_subtitle);
            if (!smartSubtitle) return null;
            return (
              <span className={`${H4_LABEL} truncate min-w-0 mt-1 text-silver-dim`}>
                {smartSubtitle}
              </span>
            );
          })()}

          <div aria-hidden className="mt-1.5" style={{ borderTop: `1px solid ${TILE_RULE}` }} />

          <div className="mt-1 line-clamp-2 text-[14px] leading-snug">
            <Building2
              aria-hidden
              className="w-3.5 h-3.5 inline align-[-2px] mr-1.5"
              style={{ color: accent.text }}
            />
            <span ref={venueNameRef} className="font-inter font-[550] text-pale">
              {venue.venue_name}
            </span>
            {/* Break opportunity between the name and the nowrap rating. */}
            <wbr />
            <span ref={ratingRef} className={ratingWrapped ? 'block whitespace-nowrap' : 'whitespace-nowrap'}>
              {!ratingWrapped && <span className="mx-2 text-silver-dim/50">|</span>}
              <Star className="w-3.5 h-3.5 inline align-text-bottom text-silver fill-silver" />
              <span className="text-[13px] font-bold ml-1 tabular-nums text-silver">{venue.venue_rating}</span>
              <span className="text-[11px] ml-1 tabular-nums text-silver-dim">({venue.venue_review_count?.toLocaleString()})</span>
            </span>
          </div>

          <span className="flex items-start gap-1.5 mt-0.5 text-[12px] leading-snug text-silver">
            <Navigation2 aria-hidden className="w-3.5 h-3.5 flex-shrink-0 mt-px" style={{ color: accent.text }} />
            <span className="line-clamp-2 min-w-0">{shortenLocation(venue.venue_location)}</span>
          </span>
        </div>

        <div
          className="flex-shrink-0 w-[25%] self-start cursor-pointer"
          onClick={(e) => {
            if (!mediaUrl) return; // no media — let the tap toggle the card
            e.stopPropagation();
            setFullscreenMedia({ url: mediaUrl, isVideo: mediaType === 'video' || isVideoUrl(mediaUrl) });
          }}
        >
          <div
            className="relative w-full rounded-xl overflow-hidden"
            style={{ aspectRatio: '9 / 16', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <EventMedia
              src={mediaUrl}
              mediaType={mediaType}
              alt={event.event_name}
              sizes="(max-width: 430px) 30vw, 100px"
              fill
              // Only the top card is the LCP candidate.
              priority={index === 0}
              poster={siblingUrl && !isVideoUrl(siblingUrl) ? siblingUrl : null}
            />
          </div>
        </div>
      </div>

      {/* EXPANDABLE CONTENT — the map card's ruled 2-column detail grid */}
      <div
        ref={isExpanded ? contentRef : null}
        className="stacked-card-content"
      >
        <div className="grid grid-cols-2 gap-x-4" style={{ borderBottom: `1px solid ${TILE_RULE}` }}>
          {shortCells.map((cell, idx) =>
            renderDetailCell(cell.key, cell.icon, cell.label, cell.body, shortCells.length % 2 === 1 && idx === shortCells.length - 1))}

          {hasDeals ? renderDetailCell('offers', Gift, 'Offers', (
            <div className="mt-1 space-y-2">
              {event.deals!.map((deal, idx) => (
                <div key={idx}>
                  <p className="flex items-baseline gap-2 flex-wrap">
                    <span className={`${H4_LABEL} text-pale`}>{DEAL_LABELS[deal.type] ?? DEAL_LABELS.special_offer}</span>
                    {deal.timing && <span className="text-[11px] text-silver-dim">{deal.timing}</span>}
                  </p>
                  <p className={longCls}>{deal.description}</p>
                </div>
              ))}
            </div>
          ), true) : hasOfferText ? renderDetailCell('offers', Gift, 'Offers', <p className={longCls}>{event.event_offers}</p>, true) : null}

          {event.analysis_notes && renderDetailCell('details', FileText, 'Details', (
            <>
              <p
                className={longCls}
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: isDetailsExpanded ? 'unset' : 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: isDetailsExpanded ? 'visible' : 'hidden',
                }}
              >
                {event.analysis_notes}
              </p>
              {event.analysis_notes.length > 120 && (
                <button className={`${H4_LABEL} mt-1.5 text-silver`} onClick={handleDetailsToggle}>
                  {isDetailsExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </>
          ), true)}
        </div>

        {/* Venue Details keeps its layout (as on the map card); only the
            heading and icons follow the new type. */}
        <div className="stacked-card-venue-details">
          <p className="text-[11px] uppercase font-extrabold tracking-[0.18em] text-pale">Venue Details</p>

          {venue.venue_address && (
            <div className="stacked-card-venue-detail-row">
              <MapPin />
              <span>{venue.venue_address}</span>
            </div>
          )}

          {venue.venue_highlights && (
            <div className="stacked-card-venue-detail-row">
              <Star />
              <span>{parseKeys(venue.venue_highlights)}</span>
            </div>
          )}

          {venue.venue_atmosphere && (
            <div className="stacked-card-venue-detail-row">
              <Sparkles />
              <span>{parseKeys(venue.venue_atmosphere)}</span>
            </div>
          )}

          {event.website_social && (
            <div className="stacked-card-venue-detail-row">
              <LinkIcon />
              <span>{event.website_social}</span>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER — same buttons as the map card's action bar */}
      <div className="stacked-card-footer">
        <div className="stacked-card-action-buttons">
          <button
            className="stacked-card-action-btn"
            onClick={handleInstagramClick}
            aria-label="Instagram"
          >
            <Instagram className="w-[18px] h-[18px]" style={{ color: '#E1306C' }} />
          </button>
          <button
            className="stacked-card-action-btn"
            onClick={handleCallClick}
            aria-label="Call"
          >
            <Phone className="w-[18px] h-[18px]" style={{ color: '#4ADE80' }} />
          </button>
          <button
            className="stacked-card-action-btn"
            onClick={handleShareClick}
            aria-label="Share"
          >
            <Share2 className="w-[18px] h-[18px]" style={{ color: '#ffffff' }} />
          </button>
        </div>
        {event.swipe_link_url && (
          <button
            className="stacked-card-book-btn"
            onClick={handleBookClick}
          >
            <Ticket className="w-4 h-4" style={{ color: '#E1306C' }} />
            <span>Book</span>
          </button>
        )}
        <button
          className="stacked-card-directions-btn"
          onClick={handleDirectionsClick}
        >
          <Navigation className="w-4 h-4" style={{ color: '#4ADE80' }} />
          <span>Directions</span>
        </button>
      </div>

    </div>

    {/* Fullscreen media viewer (thumbnail tap) */}
    {fullscreenMedia && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'rgba(0, 0, 0, 0.95)' }}
        onClick={(e) => { e.stopPropagation(); setFullscreenMedia(null); }}
      >
        <button
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255, 255, 255, 0.15)', top: 'max(16px, env(safe-area-inset-top))' }}
          onClick={(e) => { e.stopPropagation(); setFullscreenMedia(null); }}
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <div className="max-w-full max-h-full p-4" onClick={(e) => e.stopPropagation()}>
          {fullscreenMedia.isVideo ? (
            <video
              src={fullscreenMedia.url}
              className="max-w-full max-h-[85vh] rounded-lg"
              controls
              autoPlay
              loop
              playsInline
              poster={`/api/video-thumb?src=${encodeURIComponent(fullscreenMedia.url)}`}
            />
          ) : (
            <Image
              src={fullscreenMedia.url}
              alt={event.event_name}
              width={1080}
              height={1350}
              sizes="100vw"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              style={{ width: 'auto', height: 'auto' }}
            />
          )}
        </div>
      </div>
    )}

    <ShareModal
      isOpen={showShareModal}
      onClose={() => setShowShareModal(false)}
      shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/${city}/${event.id}` : `/${city}/${event.id}`}
      eventName={event.event_name}
      venueName={venue.venue_name}
      dateLabel={[
        event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '',
        event.event_time_start ? `at ${event.event_time_start}` : '',
        event.event_time_end ? `- ${event.event_time_end}` : '',
      ].filter(Boolean).join(' ')}
    />
    </>
  );
};

// ===========================================
// MAIN STACKED CARDS COMPONENT
// ===========================================

// Render-batching: only paint this many cards initially, load more on scroll.
const INITIAL_BATCH = 15;
const BATCH_INCREMENT = 15;
const LOAD_TRIGGER_MARGIN = '400px'; // start loading next batch 400px before sentinel

const StackedEventCards: React.FC<StackedEventCardsProps> = ({
  cards,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    cards.length > 0 ? cards[cards.length - 1].event.id : null
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExpandedId(null);
    setContentHeight(0);
    setVisibleCount(INITIAL_BATCH);
  }, [cards]);

  useEffect(() => {
    if (visibleCount >= cards.length) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const root = document.getElementById('cards-scroll-container');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount(c => Math.min(c + BATCH_INCREMENT, cards.length));
        }
      },
      { root, rootMargin: LOAD_TRIGGER_MARGIN, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, cards.length]);

  useLayoutEffect(() => {
    if (expandedId && contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [expandedId]);

  useEffect(() => {
    if (expandedId && contentRef.current) {
      const timer = setTimeout(() => {
        if (contentRef.current) {
          const height = contentRef.current.scrollHeight;
          setContentHeight(height);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [expandedId]);

  const handleCardClick = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setContentHeight(0);
      return;
    }
    const cardData = cards.find(c => c.event.id === id);
    if (cardData) {
      trackEvent('expand_event_card', {
        event_id: cardData.event.id,
        venue_id: cardData.venue.id,
        event_name: cardData.event.event_name,
        source: 'card_click',
      });
    }
    setExpandedId(id);
    setTimeout(() => {
      const card = document.getElementById(`card-${id}`);
      if (!card) return;

      const namedContainer = document.getElementById('cards-scroll-container');
      const container: HTMLElement | null = namedContainer ?? (() => {
        let p: HTMLElement | null = card.parentElement;
        while (p) {
          const ov = window.getComputedStyle(p).overflowY;
          if (ov === 'auto' || ov === 'scroll') return p;
          p = p.parentElement;
        }
        return null;
      })();

      if (container) {
        const cardRect = card.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        container.scrollTop = container.scrollTop + (cardRect.top - containerRect.top);
      } else {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 450);
  };

  const visibleCards = cards.slice(0, visibleCount);

  return (
    <div className="stacked-cards-container">
      <div className="stacked-cards-stack">
        {visibleCards.map((cardData, index) => {
          const isExpanded = expandedId === cardData.event.id;
          return (
            <div key={cardData.event.id} data-card-id={cardData.event.id}>
              <EventCard
                event={cardData.event}
                venue={cardData.venue}
                index={index}
                isExpanded={isExpanded}
                onCardClick={handleCardClick}
                contentRef={isExpanded ? contentRef : null}
                contentHeight={contentHeight}
              />
            </div>
          );
        })}
        {visibleCount < cards.length && (
          <div ref={sentinelRef} style={{ height: 1, width: '100%' }} aria-hidden />
        )}
      </div>
    </div>
  );
};

export default StackedEventCards;

export type { Venue, Event, EventCardData, StackedEventCardsProps };
