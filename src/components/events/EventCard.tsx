'use client';

import React from 'react';
import { Star, Music, Tag, Clock, MapPin, Instagram, Sparkles } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useTheme } from '@/contexts/ThemeContext';
import type { Venue } from '@/types';

interface EventCardProps {
  venue?: Venue;
  eventName: string;
  venueName: string;
  location: string;
  price: string;
  imageUrl: string;
  badge?: 'Recommended' | 'Selling fast' | 'Best price guaranteed';
  categories?: Array<{ primary: string; secondary?: string }>;
}

const EventCard: React.FC<EventCardProps> = ({ venue }) => {
  const { isDarkMode } = useTheme();

  // Fetch first event for this venue if venue data is provided
  const { events, isLoading } = useEvents({
    venue_id: venue?.venue_id ? Number(venue.venue_id) : undefined,
    limit: 1,
    enabled: !!venue?.venue_id
  });

  const event = events[0];

  if (!venue) {
    return null;
  }

  return (
    <div className={`group flex-shrink-0 w-[340px] md:w-[380px] rounded-3xl overflow-hidden relative transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl
                   ${isDarkMode
                     ? 'bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 border border-gray-700/50 shadow-xl'
                     : 'bg-gradient-to-br from-white/95 via-white/90 to-white/95 border border-gray-200/50 shadow-lg'
                   }`}>

      {/* Main Content */}
      <div className="flex flex-col h-full">

        {/* Header with Venue Info */}
        <div className="p-5 pb-3">
          {/* Venue Name */}
          <h3 className={`text-xl font-bold mb-2 line-clamp-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {venue.name}
          </h3>

          {/* Rating & Category Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Venue Rating */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${isDarkMode ? 'bg-amber-500/20' : 'bg-amber-50'}`}>
              <Star className={`h-3.5 w-3.5 fill-current ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              <span className={`text-sm font-semibold ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                {venue.rating ? venue.rating.toFixed(1) : '4.5'}
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                ({venue.rating_count || '120'})
              </span>
            </div>

            {/* Venue Category */}
            {venue?.category && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${isDarkMode ? 'bg-amber-500/20' : 'bg-amber-50'}`}>
                <MapPin className={`h-3.5 w-3.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                <span className={`text-xs font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                  {venue.category}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className={`mx-5 h-px ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'}`} />

        {/* Event Content */}
        <div className="flex-1 p-5 pt-4">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading event...
              </span>
            </div>
          ) : event ? (
            <div className="space-y-3">
              {/* Event Name */}
              <div>
                <h5 className={`font-bold text-lg leading-snug line-clamp-2 mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {event.artist || event.event_name}
                </h5>
                {event.event_name && event.artist && event.event_name !== event.artist && (
                  <p className={`text-sm line-clamp-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {event.event_name}
                  </p>
                )}
              </div>

              {/* Event Details Grid */}
              <div className="space-y-2">
                {/* Time */}
                {event.event_time && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                    <Clock className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      {event.event_time}
                    </span>
                  </div>
                )}

                {/* Music Genre */}
                {event.music_genre && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-pink-500/10' : 'bg-pink-50'}`}>
                    <Music className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
                    <span className={`text-sm font-medium line-clamp-1 ${isDarkMode ? 'text-pink-300' : 'text-pink-700'}`}>
                      {event.music_genre}
                    </span>
                  </div>
                )}

                {/* Attributes */}
                {event.attributes && (
                  <div className={`flex items-start gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                    <Sparkles className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span className={`text-sm font-medium line-clamp-2 leading-relaxed ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                      {[
                        ...(event.attributes.venue || []),
                        ...(event.attributes.energy || []),
                        ...(event.attributes.timing || []),
                        ...(event.attributes.status || [])
                      ].join(' • ')}
                    </span>
                  </div>
                )}

                {/* Special Offers */}
                {event.special_offers && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
                    <Tag className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={`text-sm font-medium line-clamp-1 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                      {event.special_offers}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <p className="text-sm">No events available</p>
            </div>
          )}
        </div>

        {/* Footer with Instagram */}
        {venue?.final_instagram && (
          <div className={`px-5 py-4 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <a
              href={`https://instagram.com/${venue.final_instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-pink-500/20 to-amber-500/20 hover:from-pink-500/30 hover:to-amber-500/30 border border-pink-500/30'
                  : 'bg-gradient-to-r from-pink-50 to-amber-50 hover:from-pink-100 hover:to-amber-100 border border-pink-200'
              }`}
            >
              <Instagram className={`w-5 h-5 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
              <span className={`text-sm font-semibold ${isDarkMode ? 'text-pink-300' : 'text-pink-700'}`}>
                @{venue.final_instagram}
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
