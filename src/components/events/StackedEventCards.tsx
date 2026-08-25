'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { trackEvent } from '@/lib/analytics/track';
import { ShareModal } from '@/components/shared/ShareModal';
import { shortenLocation } from '@/lib/format-location';
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
  event_categories?: any[];
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
  getCategoryColor: (category: string) => { hue: number; saturation: number };
}

interface EventCardProps {
  event: Event;
  venue: Venue;
  index: number;
  isExpanded: boolean;
  onCardClick: (id: string) => void;
  getCardColor: (category: string, rating: number) => string;
  contentRef: React.RefObject<HTMLDivElement | null> | null;
  contentHeight: number;
}

// ===========================================
// COLOR UTILITY FUNCTION
// ===========================================

function generateCardColor(
  categoryColor: { hue: number; saturation: number },
  venueRating: number
): string {
  const clampedRating = Math.max(1.0, Math.min(5.0, venueRating));
  const normalized = (clampedRating - 1.0) / 4.0;
  const lightness = 85 - (normalized * 15);
  const opacity = 0.20 + (normalized * 0.15);
  return `hsla(${categoryColor.hue}, ${categoryColor.saturation}%, ${lightness}%, ${opacity})`;
}

// ===========================================
// DATE/TIME FORMATTING UTILITIES
// ===========================================

function formatTime(time: string): string {
  if (!time) return '';
  const timeRegex = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i;
  const match = time.trim().match(timeRegex);
  if (!match) return '';
  const [_, hour, minute, period] = match;
  return `${hour}:${minute} ${period.toUpperCase()}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  return `${day} ${month} ${year}`;
}

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
// SVG ICON COMPONENTS
// ===========================================

const ClockIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const CalendarIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const DollarIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor" stroke="none">$</text>
  </svg>
);

const GiftIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="8" width="18" height="12" rx="2"/>
    <path d="M12 8v12"/>
    <path d="M8 8V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/>
    <path d="M16 8V6a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v2"/>
  </svg>
);

const InstagramIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const PhoneIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const ShareIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const NavigationIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);

const TicketIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z"/>
    <path d="M13 5v2"/>
    <path d="M13 17v2"/>
    <path d="M13 11v2"/>
  </svg>
);

const MusicIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const SparklesIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </svg>
);

const FileTextIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const MapPinIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const StarIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const LinkIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

// ===========================================
// EVENT CARD COMPONENT
// ===========================================

const EventCard: React.FC<EventCardProps> = ({
  event,
  venue,
  index,
  isExpanded,
  onCardClick,
  getCardColor,
  contentRef,
  contentHeight,
}) => {
  const cardColor = getCardColor(event.category, venue.venue_rating);
  const dateDisplay = formatDate(event.event_date);
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

  return (
    <>
    <div
      id={`card-${event.id}`}
      className={`stacked-card ${isExpanded ? 'expanded' : ''}`}
      style={{
        backgroundColor: cardColor,
        zIndex: isExpanded ? 9999 : index + 1,
        '--content-height': `${contentHeight}px`,
      } as React.CSSProperties}
      onClick={() => onCardClick(event.id)}
    >
      {/* HEADER */}
      <div className="stacked-card-header" style={{ alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Line 1 — Event name */}
          <h2 className="stacked-card-event-title">
            {event.event_name}
          </h2>

          {/* Line 2 — Date & Time. Each chunk is nowrap so a tight column
              can only break BETWEEN date and time, never inside "14 Aug 26"
              or between "6:00" and "PM". */}
          <div className="stacked-card-time-row" style={{ marginTop: '5px', flexWrap: 'wrap', rowGap: '2px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', marginRight: '6px' }}>
              <CalendarIcon />
              {dateDisplay}
            </span>
            {(() => {
              const startT = formatTime(event.event_time_start);
              const endT = formatTime(event.event_time_end);
              if (!startT && !endT) return null;
              return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'rgba(144,238,144,0.4)' }}>·</span>
                  <ClockIcon />
                  <span>
                    {startT || endT}
                    {startT && endT && ` - ${endT}`}
                  </span>
                </span>
              );
            })()}
          </div>

          {/* Line 3 — Venue name */}
          <span className="stacked-card-venue-name" style={{ display: 'block', marginTop: '5px' }}>{venue.venue_name}</span>

          {/* Line 4 — Rating + Area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span className="stacked-card-star">★</span>
            <span className="stacked-card-rating-value">{venue.venue_rating}</span>
            <span className="stacked-card-review-count">({venue.venue_review_count.toLocaleString()})</span>
            <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 2px' }}>|</span>
            <span style={{ color: 'rgba(200, 200, 220, 0.7)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortenLocation(venue.venue_location)}</span>
          </div>

          {/* Line 5 — Smart subtitle (category tags / attributes) */}
          {(() => {
            const smartSubtitle = generateSmartSubtitle(
              event.event_name,
              venue.venue_name,
              event.event_subtitle
            );
            if (!smartSubtitle) return null;
            return (
              <p className="stacked-card-event-subtitle" style={{ marginTop: '6px' }}>
                {smartSubtitle.toUpperCase()}
              </p>
            );
          })()}
        </div>

        <div
          style={{ flexShrink: 0, display: 'flex', alignItems: 'stretch', cursor: 'pointer' }}
          onClick={(e) => {
            const url = event.media_url_1 || event.media_url_2;
            if (!url) return; // no media — let the tap toggle the card
            e.stopPropagation();
            const type = event.media_url_1 ? event.media_type_1 : event.media_type_2;
            const isVideo = type === 'video' || /\.(mp4|mov|webm)(\?.*)?$/i.test(url);
            setFullscreenMedia({ url, isVideo });
          }}
        >
          {(() => {
            const url = event.media_url_1 || event.media_url_2;
            const type = event.media_url_1 ? event.media_type_1 : event.media_type_2;
            const thumbStyle: React.CSSProperties = {
              borderRadius: '12px',
              objectFit: 'cover',
              border: '1.5px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
            };
            if (!url) {
              return <div className="stacked-card-thumb" style={{ ...thumbStyle, height: '110px' }} />;
            }
            if (type === 'video' || /\.(mp4|mov|webm)(\?.*)?$/i.test(url)) {
              return (
                <img
                  // Real server-extracted frame (~20KB) instead of pulling video bytes.
                  src={`/api/video-thumb?src=${encodeURIComponent(url)}`}
                  alt=""
                  className="stacked-card-thumb"
                  style={thumbStyle}
                  loading="lazy"
                />
              );
            }
            return (
              <Image
                src={url}
                alt={event.event_name}
                width={200}
                height={250}
                quality={50}
                className="stacked-card-thumb"
                style={thumbStyle}
                // Only the top card (index 0) is the LCP candidate; lazy-load
                // the rest so they don't compete for download bandwidth on
                // the initial paint.
                loading={index === 0 ? 'eager' : 'lazy'}
                priority={index === 0}
                sizes="(max-width: 500px) 96px, 128px"
                onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
              />
            );
          })()}
        </div>
      </div>

      {/* ARTISTS SECTION */}
      {/* EXPANDABLE CONTENT */}
      <div
        ref={isExpanded ? contentRef : null}
        className="stacked-card-content"
      >
        {event.artist && (
          <div className="stacked-card-info-row">
            <div className="stacked-card-info-icon stacked-card-genre-icon">
              <MusicIcon />
            </div>
            <div className="stacked-card-info-content">
              <span className="stacked-card-info-label">ARTISTS</span>
              <div className="stacked-card-artists-badges">
                {event.artist.split(',').map((artist, idx) => (
                  <span key={idx} className="stacked-card-artist-badge">
                    {artist.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="stacked-card-info-row">
          <div className="stacked-card-info-icon stacked-card-entry-icon">
            <DollarIcon />
          </div>
          <div className="stacked-card-info-content">
            <span className="stacked-card-info-label">ENTRY</span>
            <span className="stacked-card-info-value">{event.event_entry_price}</span>
          </div>
        </div>

        <div className="stacked-card-info-row">
          <div className="stacked-card-info-icon stacked-card-offers-icon">
            <GiftIcon />
          </div>
          <div className="stacked-card-info-content">
            <span className="stacked-card-info-label">OFFERS</span>
            <span className="stacked-card-offers-text">{event.event_offers}</span>
          </div>
        </div>

        {event.music_genre && (
          <div className="stacked-card-info-row">
            <div className="stacked-card-info-icon stacked-card-genre-icon">
              <MusicIcon />
            </div>
            <div className="stacked-card-info-content">
              <span className="stacked-card-info-label">MUSIC GENRES</span>
              <div className="stacked-card-genre-badges">
                {event.music_genre.split(',').map((genre, idx) => (
                  <span key={idx} className="stacked-card-genre-badge">
                    {genre.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {event.event_vibe && (
          <div className="stacked-card-info-row">
            <div className="stacked-card-info-icon stacked-card-vibe-icon">
              <SparklesIcon />
            </div>
            <div className="stacked-card-info-content">
              <span className="stacked-card-info-label">VIBES</span>
              <div className="stacked-card-vibe-badges">
                {event.event_vibe.split('|').map((vibe, idx) => (
                  <span key={idx} className="stacked-card-vibe-badge">
                    {vibe.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {event.analysis_notes && (
          <div className="stacked-card-info-row">
            <div className="stacked-card-info-icon stacked-card-notes-icon">
              <FileTextIcon />
            </div>
            <div className="stacked-card-info-content">
              <span className="stacked-card-info-label">DETAILS</span>
              <p
                className={`stacked-card-analysis-notes ${
                  isDetailsExpanded ? 'expanded' : 'collapsed'
                }`}
              >
                {event.analysis_notes}
              </p>
              {event.analysis_notes.length > 150 && (
                <span
                  className="stacked-card-details-toggle"
                  onClick={handleDetailsToggle}
                >
                  <strong>{isDetailsExpanded ? 'Show less' : 'Show more'}</strong>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="stacked-card-venue-details">
          <span className="stacked-card-info-label">VENUE DETAILS</span>

          {venue.venue_address && (
            <div className="stacked-card-venue-detail-row">
              <MapPinIcon />
              <span>{venue.venue_address}</span>
            </div>
          )}

          {venue.venue_highlights && (() => {
            try {
              const parsed = JSON.parse(venue.venue_highlights);
              const keys = Array.isArray(parsed)
                ? parsed.map((obj: any) => Object.keys(obj)[0]).join(', ')
                : venue.venue_highlights;
              return (
                <div className="stacked-card-venue-detail-row">
                  <StarIcon />
                  <span>{keys}</span>
                </div>
              );
            } catch {
              return (
                <div className="stacked-card-venue-detail-row">
                  <StarIcon />
                  <span>{venue.venue_highlights}</span>
                </div>
              );
            }
          })()}

          {venue.venue_atmosphere && (() => {
            try {
              const parsed = JSON.parse(venue.venue_atmosphere);
              const keys = Array.isArray(parsed)
                ? parsed.map((obj: any) => Object.keys(obj)[0]).join(', ')
                : venue.venue_atmosphere;
              return (
                <div className="stacked-card-venue-detail-row">
                  <SparklesIcon />
                  <span>{keys}</span>
                </div>
              );
            } catch {
              return (
                <div className="stacked-card-venue-detail-row">
                  <SparklesIcon />
                  <span>{venue.venue_atmosphere}</span>
                </div>
              );
            }
          })()}

          {event.website_social && (
            <div className="stacked-card-venue-detail-row">
              <LinkIcon />
              <span>{event.website_social}</span>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="stacked-card-footer">
        <div className="stacked-card-action-buttons">
          <button
            className="stacked-card-action-btn stacked-card-instagram"
            onClick={handleInstagramClick}
          >
            <InstagramIcon />
          </button>
          <button
            className="stacked-card-action-btn stacked-card-call"
            onClick={handleCallClick}
          >
            <PhoneIcon />
          </button>
          <button
            className="stacked-card-action-btn stacked-card-share"
            onClick={handleShareClick}
          >
            <ShareIcon />
          </button>
        </div>
        {event.swipe_link_url && (
          <button
            className="stacked-card-book-btn"
            onClick={handleBookClick}
          >
            <TicketIcon />
            <span>Book</span>
          </button>
        )}
        <button
          className="stacked-card-directions-btn"
          onClick={handleDirectionsClick}
        >
          <NavigationIcon />
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
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
  getCategoryColor,
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

  const getCardColor = (category: string, rating: number): string => {
    const categoryColor = getCategoryColor(category);
    return generateCardColor(categoryColor, rating);
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
                getCardColor={getCardColor}
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
