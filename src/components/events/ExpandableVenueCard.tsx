'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { Venue, Event } from '@/types';
import { MapPin, Clock, Calendar, DollarSign, Music, Gift } from 'lucide-react';
import { formatPrice } from '@/config/cities.config';

interface ExpandableVenueCardProps {
  venue: Venue;
  events: Event[];
  gradientClass: string;
}

// Helper function to format event dates
const formatEventDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
};

export const ExpandableVenueCard: React.FC<ExpandableVenueCardProps> = ({
  venue,
  events,
  gradientClass
}) => {
  const firstEvent = events[0];

  // No events state - simplified
  if (!firstEvent) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`${gradientClass} rounded-3xl p-6 shadow-xl`}
      >
        <div className="flex justify-between items-start gap-3">
          <h1 style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: '22px',
            fontWeight: 700,
            color: '#1a1a1a',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            {venue.name}
          </h1>

          {venue.area && (
            <div style={{
              fontSize: '12px',
              color: '#8a857d',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0
            }}>
              <MapPin size={12} />
              {venue.area}
            </div>
          )}
        </div>
        <p className="mt-4 text-sm" style={{ color: '#8a857d' }}>
          No upcoming events
        </p>
      </motion.div>
    );
  }

  // Main card with event
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${gradientClass} rounded-3xl p-6 shadow-xl`}
    >
      {/* Header: Venue Name + Rating/Area */}
      <div className="flex justify-between items-start mb-4 gap-3">
        <div className="flex-1 min-w-0">
          <h1 style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: '22px',
            fontWeight: 700,
            color: '#1a1a1a',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            {venue.name}
          </h1>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* Rating Badge */}
          {venue.rating && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'linear-gradient(135deg, #fef9e7 0%, #fdf3d0 100%)',
              padding: '6px 10px',
              borderRadius: '20px',
              border: '1px solid #f5e6b8'
            }}>
              <span style={{ color: '#e5a100', fontSize: '14px' }}>★</span>
              <span style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '14px' }}>
                {venue.rating.toFixed(1)}
              </span>
              <span style={{ fontSize: '12px', color: '#8a857d' }}>
                ({venue.rating_count?.toLocaleString() || '0'})
              </span>
            </div>
          )}

          {/* Area */}
          {venue.area && (
            <div style={{
              fontSize: '12px',
              color: '#8a857d',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <MapPin size={12} />
              {venue.area}
            </div>
          )}
        </div>
      </div>

      {/* Time Section */}
      {firstEvent.event_time && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
          }}>
            <Clock size={16} color="#43a047" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#b8b3aa',
              fontWeight: 600,
              marginBottom: '2px'
            }}>
              TIME
            </div>
            <div style={{ fontSize: '14px', color: '#3d3a36', fontWeight: 500 }}>
              {firstEvent.event_time}
            </div>
          </div>
        </div>
      )}

      {/* Event Title */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: '16px',
          fontWeight: 700,
          color: '#1a1a1a',
          margin: '0 0 4px',
          lineHeight: 1.3
        }}>
          {firstEvent.artist || firstEvent.event_name || 'Event at ' + venue.name}
        </h2>
        {firstEvent.event_name && firstEvent.artist !== firstEvent.event_name && (
          <span style={{
            fontSize: '11px',
            color: '#8a857d',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {firstEvent.event_name}
          </span>
        )}
      </div>

      {/* Date Section */}
      {firstEvent.event_date && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
          }}>
            <Calendar size={16} color="#1976d2" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#b8b3aa',
              fontWeight: 600,
              marginBottom: '2px'
            }}>
              DATE
            </div>
            <div style={{ fontSize: '14px', color: '#3d3a36', fontWeight: 500 }}>
              {formatEventDate(firstEvent.event_date)}
            </div>
          </div>
        </div>
      )}

      {/* Entry/Price Section */}
      {firstEvent.ticket_price && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)'
          }}>
            <DollarSign size={16} color="#7b1fa2" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#b8b3aa',
              fontWeight: 600,
              marginBottom: '2px'
            }}>
              ENTRY
            </div>
            <div style={{ fontSize: '14px', color: '#3d3a36', fontWeight: 500 }}>
              {formatPrice(firstEvent.ticket_price as any, (venue as any).city)}
            </div>
          </div>
        </div>
      )}

      {/* Genre Section */}
      {firstEvent.music_genre && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)'
          }}>
            <Music size={16} color="#e65100" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#b8b3aa',
              fontWeight: 600,
              marginBottom: '6px'
            }}>
              GENRE
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(Array.isArray(firstEvent.music_genre)
                ? firstEvent.music_genre
                : firstEvent.music_genre.split(',')
              ).map((genre, idx) => (
                <div key={idx} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  color: '#3d3a36'
                }}>
                  {typeof genre === 'string' ? genre.trim() : genre}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Special Offers Section */}
      {firstEvent.special_offers && firstEvent.special_offers !== 'No special offers mentioned' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)'
          }}>
            <Gift size={16} color="#c2185b" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#b8b3aa',
              fontWeight: 600,
              marginBottom: '6px'
            }}>
              OFFERS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(Array.isArray(firstEvent.special_offers)
                ? firstEvent.special_offers
                : firstEvent.special_offers.split(',')
              ).map((offer, idx) => (
                <div key={idx} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  color: '#3d3a36'
                }}>
                  {typeof offer === 'string' ? offer.trim() : offer}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
