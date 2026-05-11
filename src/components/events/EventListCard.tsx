'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/config/cities.config';
import {
  Calendar,
  Clock,
  ChevronDown,
  MapPin,
  Star,
  Music,
  Tag,
  DollarSign,
  Gift,
  Sparkles,
  Instagram,
  Phone,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import type { Venue, Event } from '@/types';
import { getCategoryColor, getHexColor } from '@/lib/category-mappings';
import { getVenuePrimaryEventCategory } from '@/lib/map/marker-colors';
import { Badge } from '@/components/ui/badge';

interface EventListCardProps {
  venue: Venue;
  event: Event | null;  // First event for collapsed view
  allEvents: Event[];   // All events for expanded view
  isExpanded: boolean;
  onToggleExpand: () => void;
  activeFilterColor: string;  // Hex color from active filter
  hasActiveFilter: boolean;   // Whether any filter is active
}

const EventListCard: React.FC<EventListCardProps> = ({
  venue,
  event,
  allEvents,
  isExpanded,
  onToggleExpand,
  activeFilterColor,
  hasActiveFilter
}) => {
  // Determine card accent color
  const accentColor = useMemo(() => {
    if (hasActiveFilter) {
      return activeFilterColor;
    }
    // Use venue's event category color
    const eventCategory = getVenuePrimaryEventCategory(venue);
    const colorName = getCategoryColor(eventCategory);
    return getHexColor(colorName);
  }, [hasActiveFilter, activeFilterColor, venue]);

  // Format event date
  const formatEventDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd MMM yy');
    } catch {
      return dateString;
    }
  };

  // Handle case where venue has no events
  if (!event && allEvents.length === 0) {
    return (
      <div
        className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-4 mb-4 border-l-4"
        style={{ borderLeftColor: accentColor }}
      >
        <h3 className="text-xl font-bold text-gray-900">{venue.name}</h3>
        <p className="text-sm text-gray-500 mt-2">No events scheduled</p>
      </div>
    );
  }

  const firstEvent = event || allEvents[0];

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border-l-4 mb-4 overflow-hidden hover:shadow-xl transition-shadow"
      style={{ borderLeftColor: accentColor }}
      layoutId={`card-${venue.venue_id}`}
      initial={false}
      animate={{ height: 'auto' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Collapsed Header - Always Visible */}
      <button
        onClick={onToggleExpand}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between">
          {/* Left: Content */}
          <div className="flex-1 space-y-2">
            {/* Venue Name */}
            <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
              {venue.name}
            </h3>

            {/* Event Name */}
            {firstEvent && (
              <p className="text-base text-gray-700 line-clamp-1">
                {firstEvent.artist || firstEvent.event_name}
              </p>
            )}

            {/* Date & Time */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {firstEvent?.event_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatEventDate(firstEvent.event_date)}
                </span>
              )}
              {firstEvent?.event_time && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {firstEvent.event_time}
                </span>
              )}
            </div>
          </div>

          {/* Right: Expand indicator */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="ml-4 flex-shrink-0"
          >
            <ChevronDown className="w-6 h-6 text-gray-400" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200"
          >
            <div className="p-6 space-y-6">
              {/* All Events Section */}
              {allEvents.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    All Events ({allEvents.length})
                  </h4>
                  <div className="grid gap-3">
                    {allEvents.map((evt, index) => (
                      <div key={evt.event_id || index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {evt.artist || evt.event_name}
                            </p>
                            {evt.music_genre && (
                              <p className="text-sm text-gray-600 mt-1">
                                {evt.music_genre}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-600 ml-4">
                            <p>{formatEventDate(evt.event_date)}</p>
                            {evt.event_time && <p className="mt-1">{evt.event_time}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Genres & Vibes */}
              {(venue.music_genre_processed || venue.event_vibe_processed) && (
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Music & Vibes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {venue.music_genre_processed?.primaries?.map(genre => (
                      <Badge
                        key={genre}
                        className="bg-orange-100 text-orange-700 border-orange-300"
                      >
                        {genre}
                      </Badge>
                    ))}
                    {venue.event_vibe_processed?.primaries?.map(vibe => (
                      <Badge
                        key={vibe}
                        className="bg-purple-100 text-purple-700 border-purple-300"
                      >
                        {vibe}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Venue Details */}
              <div>
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Venue Details
                </h4>
                <div className="space-y-2 text-sm">
                  {venue.area && (
                    <p className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4" />
                      {venue.area}
                    </p>
                  )}
                  {venue.category && (
                    <p className="flex items-center gap-2 text-gray-700">
                      <Tag className="w-4 h-4" />
                      {venue.category}
                    </p>
                  )}
                  {venue.rating && (
                    <p className="flex items-center gap-2 text-gray-700">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {Number(venue.rating).toFixed(1)} ({venue.rating_count || 0} reviews)
                    </p>
                  )}
                </div>
              </div>

              {/* Pricing & Offers */}
              {(allEvents.some(e => e.ticket_price) || allEvents.some(e => e.special_offers)) && (
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Pricing & Offers
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {/* Show unique ticket prices */}
                    {Array.from(new Set(
                      allEvents
                        .map(e => e.ticket_price)
                        .filter(Boolean)
                    )).map((price, idx) => (
                      <Badge key={`price-${idx}`} variant="outline" className="bg-blue-50">
                        {formatPrice(price as any, (venue as any).city)}
                      </Badge>
                    ))}

                    {/* Show unique special offers */}
                    {Array.from(new Set(
                      allEvents
                        .map(e => e.special_offers)
                        .filter(Boolean)
                    )).map((offer, idx) => (
                      <Badge key={`offer-${idx}`} className="bg-green-100 text-green-700">
                        <Gift className="w-3 h-3 mr-1" />
                        {offer}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Attributes */}
              {venue.attributes && (
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Atmosphere & Features
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {venue.attributes.venue && venue.attributes.venue.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Venue</p>
                        <div className="flex flex-wrap gap-1.5">
                          {venue.attributes.venue.map(attr => (
                            <Badge key={attr} variant="outline" className="text-xs">
                              {attr}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {venue.attributes.energy && venue.attributes.energy.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Energy</p>
                        <div className="flex flex-wrap gap-1.5">
                          {venue.attributes.energy.map(attr => (
                            <Badge key={attr} variant="outline" className="text-xs">
                              {attr}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {venue.attributes.timing && venue.attributes.timing.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Timing</p>
                        <div className="flex flex-wrap gap-1.5">
                          {venue.attributes.timing.map(attr => (
                            <Badge key={attr} variant="outline" className="text-xs">
                              {attr}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {venue.attributes.status && venue.attributes.status.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Status</p>
                        <div className="flex flex-wrap gap-1.5">
                          {venue.attributes.status.map(attr => (
                            <Badge key={attr} variant="outline" className="text-xs">
                              {attr}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Links */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {venue.final_instagram && (
                  <a
                    href={`https://instagram.com/${venue.final_instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg hover:from-pink-100 hover:to-purple-100 transition-colors border border-pink-200"
                  >
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <span className="text-sm font-medium text-pink-700">
                      @{venue.final_instagram}
                    </span>
                  </a>
                )}

                {venue.phone && (
                  <a
                    href={`tel:${venue.phone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      Call
                    </span>
                  </a>
                )}

                {venue.website && (
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Website
                    </span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EventListCard;
