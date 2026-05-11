'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Venue, Event } from '@/types';
import { Clock, Calendar, DollarSign, Music, Gift, Instagram, Phone, Share2, Navigation } from 'lucide-react';
import { getCardColor, formatDateDisplay, formatTimeDisplay } from '@/lib/card-color-utils';
import { formatPrice } from '@/config/cities.config';

interface StackedVenueCardProps {
  venue: Venue;
  events: Event[];
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

/**
 * StackedVenueCard Component
 *
 * A glassmorphism card component with:
 * - Dynamic background color based on event category + venue rating
 * - 65%/35% split header layout
 * - Expandable content section with smooth animations
 * - Action buttons footer (Instagram, Call, Share, Directions)
 * - Stacking effect with -30px negative margin
 */
export const StackedVenueCard: React.FC<StackedVenueCardProps> = ({
  venue,
  events,
  index,
  isExpanded,
  onToggleExpand
}) => {
  const firstEvent = events[0];
  const cardColor = getCardColor(venue);

  // Scroll card into view when expanded
  React.useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        const element = document.getElementById(`card-${venue.venue_id}`);
        element?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [isExpanded, venue.venue_id]);

  // Prevent event propagation for action buttons
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  // Action handlers
  const handleInstagramClick = () => {
    if (venue.final_instagram) {
      const instagramUrl = venue.final_instagram.startsWith('http')
        ? venue.final_instagram
        : `https://instagram.com/${venue.final_instagram}`;
      window.open(instagramUrl, '_blank');
    }
  };

  const handleCallClick = () => {
    if (venue.phone) {
      window.location.href = `tel:${venue.phone}`;
    }
  };

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: venue.name,
          text: `Check out ${venue.name} in Dubai!`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled or failed', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleDirectionsClick = () => {
    if (venue.venue_lat && venue.venue_lng) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${venue.venue_lat},${venue.venue_lng}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  // No events state - simplified card
  if (!firstEvent) {
    return (
      <div
        id={`card-${venue.venue_id}`}
        className={`card ${isExpanded ? 'expanded' : ''}`}
        style={{
          background: cardColor,
          zIndex: isExpanded ? 100 : 10 - index
        }}
        onClick={onToggleExpand}
      >
        {/* Header */}
        <div className="card-header">
          <div className="header-left">
            <h2 className="venue-name">{venue.name}</h2>
            {venue.area && (
              <div className="location">
                <span className="location-text">{venue.area}</span>
              </div>
            )}
          </div>

          <div className="header-right">
            {venue.rating && (
              <div className="rating-badge">
                <span className="star-icon">★</span>
                <span className="rating-value">{venue.rating.toFixed(1)}</span>
                <span className="review-count">({venue.rating_count?.toLocaleString() || '0'})</span>
              </div>
            )}
          </div>
        </div>

        <p className="no-events-message">No upcoming events</p>
      </div>
    );
  }

  // Main card with event
  return (
    <div
      id={`card-${venue.venue_id}`}
      className={`card ${isExpanded ? 'expanded' : ''}`}
      style={{
        background: cardColor,
        zIndex: isExpanded ? 100 : 10 - index
      }}
      onClick={onToggleExpand}
    >
      {/* Header: 65%/35% Split */}
      <div className="card-header">
        {/* Left Side: 65% - Venue Name + Event + Time */}
        <div className="header-left">
          {/* Combined Event Title with Bold Venue */}
          <h2 className="event-title-main">
            <span className="venue-bold">{venue.name}</span>
            {' - '}{firstEvent.artist || firstEvent.event_name || 'Event'}
          </h2>

          {/* Time Row */}
          {firstEvent.event_time && (
            <div className="time-row">
              <Clock size={14} className="time-icon" />
              <span className="time-text">{formatTimeDisplay(firstEvent.event_time)}</span>
            </div>
          )}
        </div>

        {/* Right Side: 35% - Rating + Venue Name + Location */}
        <div className="header-right">
          {/* Rating Badge */}
          {venue.rating && (
            <div className="rating-badge">
              <span className="star-icon">★</span>
              <span className="rating-value">{venue.rating.toFixed(1)}</span>
              <span className="review-count">({venue.rating_count?.toLocaleString() || '0'})</span>
            </div>
          )}

          {/* Venue Name (small, top right) */}
          <div className="venue-name-small">{venue.name}</div>

          {/* Location */}
          {venue.area && (
            <div className="location">
              <span className="location-text">{venue.area}</span>
            </div>
          )}
        </div>
      </div>

      {/* Event Subtitle Section (Always Visible) */}
      <div className="event-section">
        <p className="event-subtitle">
          {`${venue.name} - ${firstEvent.artist || firstEvent.event_name || 'Event'}`.toUpperCase()}
        </p>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="card-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Date Section */}
            {firstEvent.event_date && (
              <div className="info-row">
                <div className="info-icon date-icon">
                  <Calendar size={26} />
                </div>
                <div className="info-content">
                  <div className="info-label">DATE</div>
                  <div className="info-value">{formatDateDisplay(firstEvent.event_date)}</div>
                </div>
              </div>
            )}

            {/* Entry/Price Section */}
            {firstEvent.ticket_price && (
              <div className="info-row">
                <div className="info-icon entry-icon">
                  <DollarSign size={26} />
                </div>
                <div className="info-content">
                  <div className="info-label">ENTRY</div>
                  <div className="info-value">{formatPrice(firstEvent.ticket_price as any, (venue as any).city)}</div>
                </div>
              </div>
            )}

            {/* Genre Section */}
            {firstEvent.music_genre && (
              <div className="info-row">
                <div className="info-icon genre-icon">
                  <Music size={26} />
                </div>
                <div className="info-content">
                  <div className="info-label">GENRE</div>
                  <div className="genre-badges">
                    {(Array.isArray(firstEvent.music_genre)
                      ? firstEvent.music_genre
                      : firstEvent.music_genre.split(',')
                    ).map((genre, idx) => (
                      <span key={idx} className="genre-badge">
                        {typeof genre === 'string' ? genre.trim() : genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Special Offers Section */}
            {firstEvent.special_offers && firstEvent.special_offers !== 'No special offers mentioned' && (
              <div className="info-row">
                <div className="info-icon offers-icon">
                  <Gift size={26} />
                </div>
                <div className="info-content">
                  <div className="info-label">OFFERS</div>
                  <div className="offers-pill">
                    {Array.isArray(firstEvent.special_offers)
                      ? firstEvent.special_offers.join(', ')
                      : firstEvent.special_offers}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons Footer (always visible) */}
      <div className="card-footer">
        {/* Instagram */}
        {venue.final_instagram && (
          <button
            className="action-btn"
            onClick={(e) => handleActionClick(e, handleInstagramClick)}
            aria-label="Visit Instagram"
          >
            <Instagram size={26} />
          </button>
        )}

        {/* Call */}
        {venue.phone && (
          <button
            className="action-btn"
            onClick={(e) => handleActionClick(e, handleCallClick)}
            aria-label="Call venue"
          >
            <Phone size={26} />
          </button>
        )}

        {/* Share */}
        <button
          className="action-btn"
          onClick={(e) => handleActionClick(e, handleShareClick)}
          aria-label="Share venue"
        >
          <Share2 size={26} />
        </button>

        {/* Get Directions */}
        {venue.venue_lat && venue.venue_lng && (
          <button
            className="directions-btn"
            onClick={(e) => handleActionClick(e, handleDirectionsClick)}
            aria-label="Get directions"
          >
            <Navigation size={18} />
            <span>Get Directions</span>
          </button>
        )}
      </div>
    </div>
  );
};
