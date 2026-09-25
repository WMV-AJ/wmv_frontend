'use client';

import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { trackEvent } from '@/lib/analytics/track';
import { shortenLocation } from '@/lib/format-location';
import { ShareModal } from '@/components/shared/ShareModal';
import {
  Calendar,
  Clock,
  DollarSign,
  Gift,
  Music,
  Sparkles,
  FileText,
  Star,
  Instagram,
  Phone,
  Share2,
  Navigation,
  ChevronUp,
  X,
  Globe,
  Tag,
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Ticket,
  Mic,
  Building2,
  Navigation2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EventCardData {
  event: {
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
    artist?: string;
    music_genre?: string;
    event_vibe?: string;
    confidence_score?: number;
    analysis_notes?: string;
    website_social?: string;
    event_categories?: Array<{ primary: string; secondary?: string }>;
    deals?: Array<{ type: string; timing?: string | null; description: string }>;
    swipe_link_url?: string | null;
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
    venue_category?: string;
    attributes?: {
      venue?: string[];
      energy?: string[];
      status?: string[];
      timing?: string[];
    };
  };
}

interface DateOption {
  day: string;
  date: string;
  dateKey: string;
  isToday: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  hasSameDaySibling?: boolean;
}

interface MobileEventCardProps {
  card: EventCardData;
  getCategoryColor: (category: string) => { hue: number; saturation: number };
  isExpanded: boolean;
  onToggle: () => void;
  isFullScreen: boolean;
  onFullScreenToggle: () => void;
  onClose: () => void;
  dateOptions?: DateOption[];
  selectedDates?: string[];
  onDateChange?: (dates: string[]) => void;
  isPresetRange?: boolean;
  presetRangeDates?: string[];
  navHeight?: number;
  darkMode?: boolean;
}

import Image from 'next/image';
import { PLACEHOLDER_IMAGE } from '@/lib/media-placeholder';
import EventMedia, { videoThumbUrl } from '@/components/shared/EventMedia';
import { displayFont } from '@/lib/theme/tokens';
import { getCategoryLightBg, mixCategoryTint, getShortDisplayName } from '@/lib/category-mappings';
import { formatDateLabel } from '@/lib/time-utils';
const PLACEHOLDER_IMAGES = [PLACEHOLDER_IMAGE];

function parseToArray(value: unknown): string[] {
  if (!value) return [];

  const extractItems = (arr: unknown[]): string[] =>
    arr
      .map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) return Object.keys(item)[0] || '';
        return String(item);
      })
      .filter(Boolean);

  if (Array.isArray(value)) return extractItems(value);

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return extractItems(parsed);
    } catch { /* not JSON */ }
    // Plain string — split by comma if it contains commas
    if (value.includes(',')) return value.split(',').map(s => s.trim()).filter(Boolean);
    return [value];
  }

  return [String(value)];
}

// ── HOME 4 TYPE PRESETS ───────────────────────────────────────────────
// Copied from src/app/home4/home4.module.css. Two idioms only:
//   display  — Inter Tight, negative tracking, uppercase
//   label    — Inter, uppercase, 9-11px, weight 650-750, positive tracking;
//              editorial eyebrows sit at .16-.18em, interactive at .13-.14em
// The faces come from `font-inter` on each card root (globals.css @font-face).
// NOTE home4 only uppercases h1/h2/h3 in CSS — every other capital there is
// hardcoded in JSX — so each label below carries `uppercase` explicitly.
const H4_LABEL   = 'text-[10px] uppercase font-[650] tracking-[0.16em]'; // .heroFine 10/650/.16em
const H4_CHIP    = 'text-[10px] font-bold uppercase tracking-wide'; // start-of-day chip type, deliberately NOT the Home 4 label idiom

// Offer type → label for the expanded card's Offers cell.
const DEAL_LABELS: Record<string, string> = {
  ladies_night: 'Ladies Night',
  '2for1': 'Buy 1 Get 1',
  happy_hour: 'Happy Hour',
  discount: 'Discount',
  free_entry: 'Free Entry',
  special_offer: 'Special Offer',
};

// "a | b , high_energy" → "a · b · high energy" for the expanded card's
// list cells (vibes arrive as snake_case slugs).
function joinList(value: string, separator: string | RegExp): string {
  return value.split(separator).map((part) => part.replace(/_/g, ' ').trim()).filter(Boolean).join(' · ');
}

const MobileEventCard: React.FC<MobileEventCardProps> = ({
  card,
  getCategoryColor,
  isExpanded,
  onToggle,
  isFullScreen,
  onFullScreenToggle,
  onClose,
  dateOptions = [],
  selectedDates = [],
  onDateChange,
  isPresetRange = false,
  presetRangeDates = [],
  navHeight = 140,
  darkMode = false,
}) => {
  const { event, venue } = card;

  // Accent colour for the collapsed card. Mirrors getVenuePrimaryEventCategory
  // in @/lib/map/marker-colors — highest-confidence primary first — so the card
  // border, its filter pill and its map marker all resolve to the same hue.
  // event.category is already event_categories[0].primary (stacked-card-adapter),
  // so the fallback costs nothing.
  const accentCategory = (() => {
    const cats = (event.event_categories ?? []) as Array<{ primary?: string; confidence?: number }>;
    const best = cats
      .filter(c => c.primary)
      .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];
    return best?.primary || event.category || '';
  })();
  const accentRgb = getCategoryLightBg(accentCategory).rgb;
  const accentBorder = `rgba(${accentRgb[0]},${accentRgb[1]},${accentRgb[2]},0.55)`;
  const accentSoft = `rgba(${accentRgb[0]},${accentRgb[1]},${accentRgb[2]},0.16)`;
  const accentText = getCategoryLightBg(accentCategory).hex;
  // Thick top + right edge only, per the brief — and loud enough to read at a
  // glance while the carousel is moving, hence full alpha plus an outer glow.
  const accentEdge = `rgba(${accentRgb[0]},${accentRgb[1]},${accentRgb[2]},0.95)`;
  const accentGlow = `rgba(${accentRgb[0]},${accentRgb[1]},${accentRgb[2]},0.30)`;

  const params = useParams();
  const city = (params?.city as string) || 'dubai';
  const expandedRef = useRef<HTMLDivElement>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [fullscreenMediaIdx, setFullscreenMediaIdx] = useState<number | null>(null);
  // Expired/dead media URLs (old Instagram CDN links 403 once their signature
  // lapses) — swap to the placeholder instead of a broken-image glyph.
  const [failedMediaIdx, setFailedMediaIdx] = useState<ReadonlySet<number>>(new Set());

  // Collapsed tile: when the rating block wraps below the venue name, give
  // it its own line and drop the "|" that would otherwise lead that line.
  // CSS cannot detect an inline wrap, so measure the unwrapped layout: if the
  // rating's top sits below the name's last line box, it wrapped. The result
  // is keyed to the content, so a new venue measures afresh; a width change
  // or late font swap resets it to the unwrapped layout to measure again.
  // Measuring only the unwrapped layout avoids a flip-flop where hiding the
  // separator frees just enough room for the rating to fit back on line 1.
  const tileVenueNameRef = useRef<HTMLSpanElement>(null);
  const tileRatingRef = useRef<HTMLSpanElement>(null);
  const ratingWrapKey = `${venue.venue_name}|${venue.venue_rating}|${venue.venue_review_count}`;
  const [ratingWrap, setRatingWrap] = useState<{ key: string; wrapped: boolean } | null>(null);
  const ratingWrapped = ratingWrap?.key === ratingWrapKey && ratingWrap.wrapped;
  const ratingMeasured = ratingWrap?.key === ratingWrapKey;
  useLayoutEffect(() => {
    const name = tileVenueNameRef.current;
    const rating = tileRatingRef.current;
    const row = name?.parentElement;
    if (!name || !rating || !row) return;
    if (!ratingMeasured) {
      const lines = name.getClientRects();
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        setRatingWrap({ key: ratingWrapKey, wrapped: rating.getBoundingClientRect().top > lastLine.top + 2 });
      }
    }
    let width = row.clientWidth;
    const remeasure = (): void => setRatingWrap(null);
    const observer = new ResizeObserver(() => {
      if (row.clientWidth !== width) { width = row.clientWidth; remeasure(); }
    });
    observer.observe(row);
    // A late web-font swap changes line breaks without changing the width.
    document.fonts?.addEventListener('loadingdone', remeasure);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', remeasure);
    };
  }, [ratingWrapKey, ratingMeasured, isExpanded]);
  const markMediaFailed = (idx: number) => setFailedMediaIdx(prev => {
    if (prev.has(idx)) return prev;
    const next = new Set(prev);
    next.add(idx);
    return next;
  });
  // Build media list from real DB media, separating images from videos
  const isVideoUrl = (u: string) => /\.(mp4|mov|webm)$/i.test(u);
  const allMedia: Array<{ url: string; isVideo: boolean }> = [];
  if ((event as any).media_url_1) allMedia.push({ url: (event as any).media_url_1, isVideo: isVideoUrl((event as any).media_url_1) });
  if ((event as any).media_url_2) allMedia.push({ url: (event as any).media_url_2, isVideo: isVideoUrl((event as any).media_url_2) });
  const activeImages = allMedia.length > 0 ? allMedia.map(m => m.url) : PLACEHOLDER_IMAGES;
  const activeMediaTypes = allMedia.length > 0 ? allMedia.map(m => m.isVideo) : PLACEHOLDER_IMAGES.map(() => false);
  // Sibling image in the media pair — the video-thumb API falls back to it if
  // frame extraction fails, instead of a generic placeholder.
  const siblingImage = allMedia.find(m => !m.isVideo)?.url;

  // Lock body scroll when full-screen
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isFullScreen]);

  const handleInstagramClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (venue.venue_instagram) {
      const handle = venue.venue_instagram.replace('@', '').trim();
      trackEvent('click_instagram', {
        instagram_handle: handle,
        source: 'event_card',
      });
      window.open(`https://www.instagram.com/${handle}`, '_blank');
    }
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (venue.venue_phone) {
      window.open(`tel:${venue.venue_phone}`, '_self');
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
      const name = encodeURIComponent(venue.venue_name);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&query=${name}`, '_blank');
    } else if (venue.venue_address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.venue_address)}`, '_blank');
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

  const highlightTags = parseToArray(venue.venue_highlights);
  const atmosphereTags = parseToArray(venue.venue_atmosphere);

  // Collect attribute tags
  const allTags: { label: string; type: string }[] = [];
  if (venue.attributes) {
    venue.attributes.venue?.forEach(t => allTags.push({ label: t, type: 'venue' }));
    venue.attributes.energy?.forEach(t => allTags.push({ label: t, type: 'energy' }));
    venue.attributes.status?.forEach(t => allTags.push({ label: t, type: 'status' }));
    venue.attributes.timing?.forEach(t => allTags.push({ label: t, type: 'timing' }));
  }

  // Format date for date pills
  const formatDatePill = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { day, date };
    } catch {
      return { day: '', date: dateStr };
    }
  };

  const datePill = formatDatePill(event.event_date);

  // "Fri, Sep 25" — short enough for a half-width detail cell.
  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // ── Expanded card: the collapsed tile's type system, laid out in the
  // Home 4 "vibe index" idiom — items between hairline rules, the selected
  // one marked by a top rule in the category colour, icons unboxed and
  // tinted with the category pill's text colour.
  const ruleColor = darkMode ? 'rgba(226,227,225,0.14)' : 'rgba(0,0,0,0.10)';
  const labelCls = `${H4_LABEL} ${darkMode ? 'text-silver-dim' : 'text-gray-500'}`;
  const valueCls = `font-inter font-[550] text-[14px] leading-snug mt-1 ${darkMode ? 'text-pale' : 'text-gray-900'}`;
  const longCls = `text-[12px] leading-relaxed mt-1 ${darkMode ? 'text-silver' : 'text-gray-600'}`;
  const timeLabel = event.event_time_display
    || (event.event_time_start ? `${event.event_time_start}${event.event_time_end ? ` – ${event.event_time_end}` : ''}` : '');

  const renderDetailCell = (key: string, Icon: LucideIcon, label: string, body: React.ReactNode, wide = false) => (
    <div key={key} className={`pt-2.5 pb-3 min-w-0 ${wide ? 'col-span-2' : ''}`} style={{ borderTop: `1px solid ${ruleColor}` }}>
      <div className="flex items-center gap-1.5">
        <Icon aria-hidden className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accentText }} />
        <p className={`${labelCls} truncate`}>{label}</p>
      </div>
      {body}
    </div>
  );

  // Selected: 1px border + 1px inset shadow in the accent = a 2px rule with
  // no layout shift against the 1px rules beside it. In-range: same, faded.
  const renderDateItem = (
    key: string,
    day: string,
    date: string,
    state: 'selected' | 'range' | 'idle',
    onSelect?: () => void,
  ) => {
    const mark = state === 'selected' ? accentText
      : state === 'range' ? `rgba(${accentRgb[0]},${accentRgb[1]},${accentRgb[2]},0.45)`
      : null;
    return (
      <button
        key={key}
        type="button"
        onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
        className="flex flex-col items-start min-w-[64px] px-0.5 pt-2 pb-2 flex-shrink-0 text-left whitespace-nowrap transition-colors duration-200"
        style={{
          borderTop: `1px solid ${mark ?? ruleColor}`,
          boxShadow: mark ? `inset 0 1px 0 ${mark}` : undefined,
          borderBottom: `1px solid ${ruleColor}`,
        }}
      >
        <span
          className={`${H4_LABEL} ${state === 'selected' ? '' : darkMode ? 'text-silver-dim' : 'text-gray-500'}`}
          style={state === 'selected' ? { color: accentText } : undefined}
        >
          {day}
        </span>
        <span className={`font-inter font-[550] text-[14px] leading-tight mt-0.5 ${state === 'selected'
          ? (darkMode ? 'text-pale' : 'text-gray-900')
          : (darkMode ? 'text-silver' : 'text-gray-600')}`}
        >
          {date}
        </span>
      </button>
    );
  };

  // =============================================
  // FULL-SCREEN EXPANDED VIEW
  // =============================================
  if (isFullScreen) {
    return (
      <>
      <div
        className="fixed z-[60] flex flex-col rounded-2xl overflow-hidden font-inter antialiased"
        style={darkMode ? {
          background: 'rgba(12, 12, 28, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          top: `${navHeight + 8}px`,
          left: '6px',
          right: '6px',
          bottom: '12px',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        } : {
          background: 'rgba(255, 255, 255, 0.99)',
          top: `${navHeight + 8}px`,
          left: '6px',
          right: '6px',
          bottom: '12px',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + Close Button */}
        <div className="flex items-start px-4 pt-5 pb-2 flex-shrink-0">
          <div className="flex-1 min-w-0">
            {/* The tile's face (Inter 600 caps), sized up for a header. */}
            <h2 className={`font-inter font-semibold uppercase text-[19px] leading-tight tracking-[-0.01em] ${darkMode ? 'text-pale' : 'text-gray-900'}`}>
              {event.event_name}
            </h2>
          </div>
          <button
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ml-3"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>

        {/* Venue: name with the category pill right-aligned on the same row,
            then rating and address — the collapsed tile's type and icons. */}
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Building2 aria-hidden className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accentText }} />
            <p
              className={`min-w-0 truncate text-[15px] ${darkMode ? 'font-inter font-[550] text-pale' : 'font-semibold'}`}
              style={darkMode ? undefined : { fontFamily: displayFont, color: '#8a6d0b', letterSpacing: '-0.01em' }}
            >
              {venue.venue_name}
            </p>
            {accentCategory && (
              <span
                className={`ml-auto flex-shrink-0 ${H4_CHIP} px-2.5 py-1 rounded-full whitespace-nowrap`}
                style={{ background: accentSoft, color: accentText, border: `1px solid ${accentBorder}` }}
              >
                {getShortDisplayName(accentCategory)}
              </span>
            )}
          </div>
          <div className={`flex items-center gap-1 mt-1 min-w-0 text-[12px] ${darkMode ? 'text-silver' : 'text-gray-500'}`}>
            <Star className={`w-3.5 h-3.5 flex-shrink-0 ${darkMode ? 'text-silver fill-silver' : 'text-amber-500 fill-amber-500'}`} />
            <span className={`text-[13px] font-bold tabular-nums ${darkMode ? 'text-silver' : 'text-amber-500'}`}>{venue.venue_rating}</span>
            <span className={`text-[11px] tabular-nums ${darkMode ? 'text-silver-dim' : 'text-gray-400'}`}>({venue.venue_review_count?.toLocaleString()})</span>
            <span className={`mx-1.5 ${darkMode ? 'text-silver-dim/50' : 'text-gray-300'}`}>|</span>
            <Navigation2 aria-hidden className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accentText }} />
            <span className="truncate min-w-0">{shortenLocation(venue.venue_location)}</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto px-4 pb-4"
          style={{ scrollbarWidth: 'thin' }}
        >
          {/* Date picker sits directly above the media, per the brief. */}
          {/* Dates — ruled items, no boxes (see renderDateItem). */}
          <div className="pb-4 pt-1">
            <div
              className="flex items-stretch gap-3 overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {dateOptions.length > 0
                ? dateOptions.map((opt) => {
                    const isClicked = selectedDates.includes(opt.dateKey);
                    const isInRange = presetRangeDates.includes(opt.dateKey);
                    const isFullSelected = isClicked && (!isInRange || selectedDates.length < presetRangeDates.length);
                    return renderDateItem(
                      opt.dateKey,
                      opt.day,
                      opt.date,
                      isFullSelected ? 'selected' : isInRange ? 'range' : 'idle',
                      onDateChange ? () => onDateChange([opt.dateKey]) : undefined,
                    );
                  })
                : renderDateItem('event-date', datePill.day, datePill.date, 'selected')}
            </div>
          </div>

          {/* Divider + Images side by side */}
          <div style={{ borderTop: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0, 0, 0, 0.06)' }} />
          <div className="my-3">
            <div
              className="flex gap-1.5 rounded-2xl overflow-hidden"
              style={{ border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0, 0, 0, 0.08)' }}
            >
              {activeImages.map((src, idx) => (
                <div key={idx} className="relative flex-1 min-w-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); setFullscreenMediaIdx(idx); }}>
                  {failedMediaIdx.has(idx) ? (
                    <Image
                      src={PLACEHOLDER_IMAGE}
                      alt={`${venue.venue_name} ${idx + 1}`}
                      width={640}
                      height={800}
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="w-full h-auto block"
                      style={{ width: '100%', height: 'auto' }}
                      draggable={false}
                    />
                  ) : activeMediaTypes[idx] ? (
                    <video
                      src={src}
                      className="w-full h-auto block"
                      muted
                      playsInline
                      autoPlay
                      loop
                      preload="metadata"
                      poster={videoThumbUrl(src, siblingImage)}
                      onError={() => markMediaFailed(idx)}
                    />
                  ) : (
                    <Image
                      src={src}
                      alt={`${venue.venue_name} ${idx + 1}`}
                      width={640}
                      height={800}
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="w-full h-auto block"
                      style={{ width: '100%', height: 'auto' }}
                      draggable={false}
                      onError={() => markMediaFailed(idx)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Detail grid — ruled cells, two columns for short facts; offers
              and notes run full width. An odd last short cell also spans
              both columns so the grid never ends on a hole. */}
          {(() => {
            const shortCells: Array<[string, LucideIcon, string, React.ReactNode]> = [
              ['date', Calendar, 'Date & Time', (
                <React.Fragment key="v">
                  <p className={valueCls}>{formatShortDate(event.event_date) || 'TBA'}</p>
                  {timeLabel && <p className={longCls}>{timeLabel}</p>}
                </React.Fragment>
              )],
              ['entry', DollarSign, 'Entry', <p key="v" className={valueCls}>{event.event_entry_price || 'TBA'}</p>],
            ];
            if (event.event_categories && event.event_categories.length > 0) {
              shortCells.push(['type', Tag, event.event_categories.map((cat) => cat.primary).join(', '), (
                <p key="v" className={valueCls}>{event.event_categories.map((cat) => cat.secondary).filter(Boolean).join(', ') || '—'}</p>
              )]);
            }
            if (event.event_vibe) shortCells.push(['vibes', Sparkles, 'Vibes', <p key="v" className={valueCls}>{joinList(event.event_vibe, '|')}</p>]);
            if (event.music_genre) shortCells.push(['music', Music, 'Music', <p key="v" className={valueCls}>{joinList(event.music_genre, ',')}</p>]);
            if (event.artist) shortCells.push(['artists', Mic, 'Artists', <p key="v" className={valueCls}>{joinList(event.artist, /[|,]/)}</p>]);

            const hasDeals = !!event.deals && event.deals.length > 0;
            const hasOfferText = !!event.event_offers && !event.event_offers.toLowerCase().includes('no special offers');

            return (
              <div className="grid grid-cols-2 gap-x-4" style={{ borderBottom: `1px solid ${ruleColor}` }}>
                {shortCells.map(([key, Icon, label, body], idx) =>
                  renderDetailCell(key, Icon, label, body, shortCells.length % 2 === 1 && idx === shortCells.length - 1))}

                {hasDeals ? renderDetailCell('offers', Gift, 'Offers', (
                  <div className="mt-1 space-y-2">
                    {event.deals!.map((deal, idx) => (
                      <div key={idx}>
                        <p className="flex items-baseline gap-2 flex-wrap">
                          <span className={`${H4_LABEL} ${darkMode ? 'text-pale' : 'text-gray-900'}`}>{DEAL_LABELS[deal.type] ?? DEAL_LABELS.special_offer}</span>
                          {deal.timing && <span className={`text-[11px] ${darkMode ? 'text-silver-dim' : 'text-gray-500'}`}>{deal.timing}</span>}
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
                      <button
                        className={`${H4_LABEL} mt-1.5 transition-colors ${darkMode ? 'text-silver' : 'text-gray-600'}`}
                        onClick={(e) => { e.stopPropagation(); setIsDetailsExpanded(prev => !prev); }}
                      >
                        {isDetailsExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </>
                ), true)}
              </div>
            );
          })()}

          {/* Venue Details — same ruled rows, full width. */}
          {(() => {
            const rowText = `text-[13px] leading-snug ${darkMode ? 'text-silver' : 'text-gray-700'}`;
            const rows: Array<[string, LucideIcon, React.ReactNode]> = [];
            if (venue.venue_category) rows.push(['category', Tag, <span key="v" className={rowText}>{parseToArray(venue.venue_category).join(', ')}</span>]);
            if (highlightTags.length > 0) rows.push(['highlights', Star, <span key="v" className={rowText}>{highlightTags.join(', ')}</span>]);
            if (atmosphereTags.length > 0) rows.push(['atmosphere', Sparkles, <span key="v" className={rowText}>{atmosphereTags.join(', ')}</span>]);
            if (venue.venue_phone) rows.push(['phone', Phone, <span key="v" className={rowText}>{venue.venue_phone}</span>]);
            if (venue.venue_address) rows.push(['address', Navigation2, <span key="v" className={rowText}>{venue.venue_address}</span>]);
            if (venue.venue_website) {
              rows.push(['website', Globe, (
                <a
                  key="v"
                  href={venue.venue_website.startsWith('http') ? venue.venue_website : `https://${venue.venue_website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-[13px] font-medium truncate underline underline-offset-2 ${darkMode ? 'text-pale decoration-silver-dim' : 'text-gray-900 decoration-gray-400'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {venue.venue_website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              )]);
            }
            if (rows.length === 0) return null;
            return (
              <div className="mt-5">
                <p className={`${labelCls} mb-1.5`}>Venue Details</p>
                <div style={{ borderBottom: `1px solid ${ruleColor}` }}>
                  {rows.map(([key, Icon, body]) => (
                    <div key={key} className="flex items-start gap-2.5 py-2 min-w-0" style={{ borderTop: `1px solid ${ruleColor}` }}>
                      <Icon aria-hidden className="w-3.5 h-3.5 flex-shrink-0 mt-[3px]" style={{ color: accentText }} />
                      {body}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Fixed Action Buttons at bottom */}
        <div
          className="flex-shrink-0 px-4 py-3 flex items-center gap-3 rounded-b-2xl"
          style={darkMode ? {
            background: 'rgba(8, 8, 22, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          } : {
            background: 'rgba(255, 255, 255, 0.98)',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Icon buttons left, Get Directions right */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {venue.venue_instagram && (
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{ background: 'rgba(90, 90, 90, 0.75)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' }}
                  onClick={handleInstagramClick}
                >
                  <Instagram className="w-[18px] h-[18px]" style={{ color: '#E1306C' }} />
                </button>
              )}
              {venue.venue_phone && (
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{ background: 'rgba(90, 90, 90, 0.75)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' }}
                  onClick={handleCallClick}
                >
                  <Phone className="w-[18px] h-[18px]" style={{ color: '#4ADE80' }} />
                </button>
              )}
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'rgba(90, 90, 90, 0.75)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' }}
                onClick={handleShareClick}
              >
                <Share2 className="w-[18px] h-[18px]" style={{ color: '#ffffff' }} />
              </button>
            </div>

            {/* Book + Directions pill buttons */}
            <div className="flex items-center gap-2">
              {event.swipe_link_url && (
                <button
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[13px] font-semibold transition-all active:scale-95"
                  style={{
                    background: 'rgba(90, 90, 90, 0.75)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                    color: '#ffffff',
                  }}
                  onClick={handleBookClick}
                >
                  <Ticket className="w-4 h-4" style={{ color: '#E1306C' }} />
                  <span>Book</span>
                </button>
              )}
              <button
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[13px] font-semibold transition-all active:scale-95"
                style={{
                  background: 'rgba(90, 90, 90, 0.75)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                  color: '#ffffff',
                }}
                onClick={handleDirectionsClick}
              >
                <Navigation className="w-4 h-4" style={{ color: '#4ADE80' }} />
                <span>Directions</span>
              </button>
            </div>
          </div>
        </div>

        {/* Fullscreen Media Viewer */}
        {fullscreenMediaIdx !== null && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: 'rgba(0, 0, 0, 0.95)' }}
            onClick={(e) => { e.stopPropagation(); setFullscreenMediaIdx(null); }}
          >
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255, 255, 255, 0.15)' }}
              onClick={(e) => { e.stopPropagation(); setFullscreenMediaIdx(null); }}
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {/* Left arrow */}
            {activeImages.length > 1 && (
              <button
                className="absolute left-3 z-10 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.15)', top: '50%', transform: 'translateY(-50%)' }}
                onClick={(e) => { e.stopPropagation(); setFullscreenMediaIdx((fullscreenMediaIdx - 1 + activeImages.length) % activeImages.length); }}
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            )}
            {/* Right arrow */}
            {activeImages.length > 1 && (
              <button
                className="absolute right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.15)', top: '50%', transform: 'translateY(-50%)' }}
                onClick={(e) => { e.stopPropagation(); setFullscreenMediaIdx((fullscreenMediaIdx + 1) % activeImages.length); }}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            )}
            <div className="max-w-full max-h-full p-4" onClick={(e) => e.stopPropagation()}>
              {failedMediaIdx.has(fullscreenMediaIdx) ? (
                <Image
                  src={PLACEHOLDER_IMAGE}
                  alt={`${venue.venue_name} ${fullscreenMediaIdx + 1}`}
                  width={1080}
                  height={1350}
                  sizes="100vw"
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                  style={{ width: 'auto', height: 'auto' }}
                />
              ) : activeMediaTypes[fullscreenMediaIdx] ? (
                <video
                  src={activeImages[fullscreenMediaIdx]}
                  className="max-w-full max-h-[85vh] rounded-lg"
                  controls
                  autoPlay
                  loop
                  playsInline
                  poster={videoThumbUrl(activeImages[fullscreenMediaIdx], siblingImage)}
                  onError={() => markMediaFailed(fullscreenMediaIdx)}
                />
              ) : (
                <Image
                  src={activeImages[fullscreenMediaIdx]}
                  alt={`${venue.venue_name} ${fullscreenMediaIdx + 1}`}
                  width={1080}
                  height={1350}
                  sizes="100vw"
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                  style={{ width: 'auto', height: 'auto' }}
                  onError={() => markMediaFailed(fullscreenMediaIdx)}
                />
              )}
            </div>
            {/* Counter */}
            {activeImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                {fullscreenMediaIdx + 1} / {activeImages.length}
              </div>
            )}
          </div>
        )}
      </div>
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
  }

  // =============================================
  // COLLAPSED PREVIEW CARD (shown in bottom panel)
  // =============================================
  if (!isExpanded) return null; // Only show when selected

  return (
    <>
    <div
      ref={expandedRef}
      className="relative rounded-2xl overflow-hidden cursor-pointer w-full flex flex-col font-inter antialiased"
      style={darkMode ? {
        // Opaque instead of backdrop-blur: the carousel slides these cards
        // over the live map canvas, and backdrop-filter forces a recomposite
        // on every scroll frame (same fix as OfferBanner). The category tint
        // is pre-mixed into this flat fill for the same reason.
        // Explicit floor rather than letting content decide: the carousel
        // already forces a uniform height, and pinning it keeps the measured
        // panel height — and the nav pill derived from it — stable.
        minHeight: 184,   // trimmed a further 10%
        background: mixCategoryTint(accentCategory, [12, 12, 28], 0.06),
        // Category colour is a single line across the top edge only.
        borderTop: `3px solid ${accentEdge}`,
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: `0 2px 20px rgba(0, 0, 0, 0.5), 0 0 16px ${accentGlow}`,
      } : {
        background: 'rgba(255, 255, 255, 0.97)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.12)',
      }}
      onClick={onToggle}
    >
      {/* Two columns: all copy on the left, a 9:16 still on the right.
          Reading order is event -> when -> what kind -> where. */}
      {/* Expand / close — anchored to the card's bottom-right corner. It sat
          on the still before, which put it over photo content. */}
      <button
        className="absolute bottom-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
        style={{
          // Dark scrim, not a light tint: the card's bottom-right corner
          // overlaps the still, so the control has to read over a photo.
          background: isFullScreen ? 'rgba(120, 20, 20, 0.78)' : 'rgba(10, 10, 20, 0.72)',
          border: `1px solid ${isFullScreen ? 'rgba(239, 68, 68, 0.45)' : 'rgba(255, 255, 255, 0.28)'}`,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isFullScreen) { onClose(); } else { onFullScreenToggle(); }
        }}
        aria-label={isFullScreen ? 'Close' : 'Expand'}
      >
        {isFullScreen
          ? <X className="w-4 h-4 text-white" />
          : <ChevronUp className="w-4 h-4 text-white" />}
      </button>

      {/* flex-1 so the row absorbs the stretch, items-center so what is left
          of it splits evenly above and below rather than pooling under the
          address. The carousel stretches every card to the tallest, and the
          tallest is whichever event name wraps to two lines — so a one-line
          card carries ~20px of slack no matter what. Centred, that reads as
          padding; top-aligned it read as a dead band. */}
      {/* Copy left, 30% still right. items-start so text always begins at
          the top of the tile — the carousel stretches every card to the
          tallest, and centring made shorter cards float mid-tile. */}
      <div className="flex gap-3 p-2.5 pb-2 flex-1 min-h-0 items-start">

        {/* ── Left: the copy column ───────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* 1. Event name */}
          {/* Inter at 600 — the venue name's face, not the condensed Inter
              Tight, which was too narrow to read in caps at this size. Caps
              and the extra 50 weight keep it a rank above the venue. */}
          <h3 className={`font-inter font-semibold uppercase text-[15px] leading-tight tracking-[-0.01em] line-clamp-2 ${darkMode ? 'text-pale' : 'text-gray-900'}`}>
            {event.event_name}
          </h3>

          {/* 2. Time / date — always rendered so cards keep a steady height */}
          {/* Same label type as the tags line (H4_LABEL). */}
          <span className={`${H4_LABEL} flex items-center gap-1.5 mt-1 ${darkMode ? 'text-silver' : 'text-gray-500'}`}>
            {/* Tile icons (clock, building, arrow) take the category pill's
                text colour; the rating star keeps its own. */}
            <Clock className="w-3 h-3 flex-shrink-0" style={{ color: accentText }} />
            {event.event_time_display
              || (event.event_time_start
                    ? `${event.event_time_start}${event.event_time_end ? ` – ${event.event_time_end}` : ''}`
                    : formatDateLabel(event.event_date))}
          </span>

          {/* 3. Category, on its own line */}
          {accentCategory && (
            <span
              className={`self-start mt-1 ${H4_CHIP} px-2.5 py-1 rounded-full whitespace-nowrap`}
              style={{ background: accentSoft, color: accentText, border: `1px solid ${accentBorder}` }}
            >
              {getShortDisplayName(accentCategory)}
            </span>
          )}

          {/* 4. Tags — the event's own subtitle, on the next line */}
          {event.event_subtitle && event.event_subtitle !== event.event_name && (
            <span className={`${H4_LABEL} truncate min-w-0 mt-1 ${darkMode ? 'text-silver-dim' : 'text-gray-500'}`}>
              {event.event_subtitle}
            </span>
          )}

          {/* 5 + 6. Venue name and rating share one flow: the name wraps
                 and the rating follows it, the pair capped at two lines. */}
          {/* Rule separating the event from the venue it is at. */}
          <div
            aria-hidden
            className="mt-1.5"
            style={{ borderTop: darkMode ? '1px solid rgba(226,227,225,0.14)' : '1px solid rgba(0,0,0,0.10)' }}
          />

          <div className="mt-1 line-clamp-2 text-[14px] leading-snug">
            <Building2
              aria-hidden
              className="w-3.5 h-3.5 inline align-[-2px] mr-1.5"
              style={{ color: accentText }}
            />
            {/* Inter at 550, home4's `.faqItems summary strong` register —
                the one place that system uses Inter above body size at a mid
                weight. The event name above shares the face; its caps and
                600 weight keep it a rank above the venue. */}
            <span
              ref={tileVenueNameRef}
              className={`${darkMode ? 'font-inter font-[550] text-pale' : 'font-semibold'}`}
              style={darkMode ? undefined : { fontFamily: displayFont, color: '#8a6d0b', letterSpacing: '-0.01em' }}
            >
              {venue.venue_name}
            </span>
            {/* Break opportunity. JSX strips the newline between these two
                spans, so there is NO whitespace where the name ends and the
                nowrap rating block begins — which makes the name's last word
                and the entire rating one unbreakable unit. "JB Arena (Just
                BLR)" then broke after "Just", pushing "BLR)" onto line 2
                beside the stars even though the name fits a single line with
                90px to spare. <wbr> restores the break without adding a space;
                the rule already carries its own margin. */}
            <wbr />
            {/* Wrapped: own line, no separator (see ratingWrap above). */}
            <span ref={tileRatingRef} className={ratingWrapped ? 'block whitespace-nowrap' : 'whitespace-nowrap'}>
              {!ratingWrapped && (
                <span className={`mx-2 ${darkMode ? 'text-silver-dim/50' : 'text-gray-300'}`}>|</span>
              )}
              <Star className={`w-3.5 h-3.5 inline align-text-bottom ${darkMode ? 'text-silver fill-silver' : 'text-amber-500 fill-amber-500'}`} />
              <span className={`text-[13px] font-bold ml-1 tabular-nums ${darkMode ? 'text-silver' : 'text-amber-500'}`}>{venue.venue_rating}</span>
              <span className={`text-[11px] ml-1 tabular-nums ${darkMode ? 'text-silver-dim' : 'text-gray-400'}`}>({venue.venue_review_count?.toLocaleString()})</span>
            </span>
          </div>

          {/* 7. Address — same rule as the expanded card's header line,
                 allowed to run to two lines in this narrower column. */}
          {/* Address, with the pin back on its own line. Two rows. */}
          <span className={`flex items-start gap-1.5 mt-0.5 text-[12px] leading-snug ${darkMode ? 'text-silver' : 'text-gray-500'}`}>
            <Navigation2 aria-hidden className="w-3.5 h-3.5 flex-shrink-0 mt-px" style={{ color: accentText }} />
            <span className="line-clamp-2 min-w-0">{shortenLocation(venue.venue_location)}</span>
          </span>
        </div>

        {/* ── Right: 9:16 still, 30% of the tile ──────────────────── */}
        <div className="flex-shrink-0 w-[30%] self-start">
          <div
            className="relative w-full rounded-xl overflow-hidden"
            style={{
              // Width-driven: the column is 30% and the height falls out of
              // the ratio. Height-driven aspect-ratio on a stretched flex
              // item is the patchier of the two across browsers.
              aspectRatio: '9 / 16',
              border: darkMode ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const u1 = (event as any).media_url_1 as string | undefined;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const u2 = (event as any).media_url_2 as string | undefined;
              const isVid = (u: string) => /\.(mp4|mov|webm)$/i.test(u);
              // url_1 wins, url_2 is the fallback. If the primary is a video
              // and the sibling is an image, the sibling is the poster frame.
              const primary = u1 || u2;
              const sibling = primary === u1 ? u2 : undefined;
              return (
                <EventMedia
                  src={primary}
                  alt={venue.venue_name}
                  sizes="(max-width: 430px) 30vw, 100px"
                  fill
                  poster={sibling && !isVid(sibling) ? sibling : null}
                />
              );
            })()}
          </div>
        </div>
      </div>


    </div>

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

// Memoized: the carousel re-renders on focus/scroll state changes; each card
// only needs to re-render when its own props change.
export default React.memo(MobileEventCard);
