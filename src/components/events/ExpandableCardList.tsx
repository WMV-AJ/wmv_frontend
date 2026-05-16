'use client';

import React, { useState } from 'react';
import type { Venue, Event } from '@/types';
import { StackedVenueCard } from './StackedVenueCard';

interface ExpandableCardListProps {
  venues: Venue[];
  eventsByVenue: Record<number, Event[]>;
}

export const ExpandableCardList: React.FC<ExpandableCardListProps> = ({
  venues,
  eventsByVenue
}) => {
  // State to manage which card is expanded (only one at a time)
  const [expandedCardId, setExpandedCardId] = useState<number | string | null>(null);

  // Debug logging
  console.log('🎴 ExpandableCardList - Venues received:', venues.length);
  console.log('🎴 ExpandableCardList - EventsByVenue keys:', Object.keys(eventsByVenue).length);
  console.log('🎴 ExpandableCardList - First 3 venue IDs:', venues.slice(0, 3).map(v => v.venue_id));
  console.log('🎴 ExpandableCardList - First 3 eventsByVenue keys:', Object.keys(eventsByVenue).slice(0, 3));

  // Handle card toggle - only one card can be expanded at a time
  const handleCardToggle = (venueId: number | string) => {
    setExpandedCardId(prev => prev === venueId ? null : venueId);
  };

  // Show all venues - don't filter based on events
  // The StackedVenueCard will handle "no events" state internally
  const venuesWithEvents = venues;

  if (venuesWithEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-xl font-semibold text-gray-900 mb-2">
          No venues available
        </p>
        <p className="text-gray-600 text-center mb-4">
          Try adjusting your filters or check back later
        </p>
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs font-geist text-left">
            <p>Debug Info:</p>
            <p>Venues received: {venues.length}</p>
            <p>EventsByVenue keys: {Object.keys(eventsByVenue).length}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="card-stack">
        {venuesWithEvents.map((venue, index) => {
          const venueEvents = eventsByVenue[Number(venue.venue_id)] || [];
          const isExpanded = expandedCardId === venue.venue_id;

          return (
            <StackedVenueCard
              key={venue.venue_id}
              venue={venue}
              events={venueEvents}
              index={index}
              isExpanded={isExpanded}
              onToggleExpand={() => handleCardToggle(venue.venue_id)}
            />
          );
        })}
      </div>
    </div>
  );
};
