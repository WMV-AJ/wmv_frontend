'use client';

import { useCallback, useEffect, useState } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { Badge } from '@/components/ui/badge';
import { MapPin, Instagram, Clock } from 'lucide-react';
import type { VenuePinProps } from '@/types';
import { trackEvent } from '@/lib/analytics/track';

const VenuePin: React.FC<VenuePinProps> = ({
  venue,
  hasActiveStories,
  isSelected,
  onClick,
  onHover
}) => {
  console.log('🎯 VenuePin rendering for:', venue.name, 'at', venue.lat, venue.lng);
  
  const [markerRef, setMarkerRef] = useState<google.maps.Marker | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Handle marker load with DROP animation
  const onMarkerLoad = useCallback((marker: google.maps.Marker) => {
    setMarkerRef(marker);
    // Add DROP animation when marker first appears
    if (marker && typeof window !== 'undefined' && window.google?.maps) {
      marker.setAnimation(google.maps.Animation.DROP);
      
      // Stop animation after 1 second
      setTimeout(() => {
        if (marker.getAnimation()) {
          marker.setAnimation(null);
        }
      }, 1000);
    }
  }, []);

  // Handle click with BOUNCE animation
  const handleClick = useCallback(() => {
    console.log('🔥 VENUE PIN CLICKED:', venue.name);

    trackEvent('view_venue', {
      venue_id: venue.venue_id,
      venue_name: venue.name,
      venue_area: venue.area,
      source: 'map_pin',
    });

    // Add bounce animation on click
    if (markerRef && typeof window !== 'undefined' && window.google?.maps) {
      setIsAnimating(true);
      markerRef.setAnimation(google.maps.Animation.BOUNCE);

      // Stop bouncing after 1.5 seconds
      setTimeout(() => {
        if (markerRef.getAnimation()) {
          markerRef.setAnimation(null);
        }
        setIsAnimating(false);
      }, 1500);
    }

    onClick();
  }, [onClick, venue.name, venue.venue_id, venue.area, markerRef]);

  // Add pulsing animation for venues with active stories
  useEffect(() => {
    if (hasActiveStories && markerRef && !isSelected && !isAnimating) {
      const pulseInterval = setInterval(() => {
        if (markerRef && typeof window !== 'undefined' && window.google?.maps) {
          markerRef.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(() => {
            if (markerRef.getAnimation()) {
              markerRef.setAnimation(null);
            }
          }, 600);
        }
      }, 3000); // Pulse every 3 seconds

      return () => clearInterval(pulseInterval);
    }
  }, [hasActiveStories, markerRef, isSelected, isAnimating]);
  
  // Don't render if venue doesn't have coordinates
  if (!venue.lat || !venue.lng) {
    console.log('❌ VenuePin: No coordinates for', venue.name);
    return null;
  }

  const position = {
    lat: venue.lat,
    lng: venue.lng
  };
  
  console.log('🎯 VenuePin position:', position);

  return (
    <>
      <Marker
        position={position}
        onClick={handleClick}
        onLoad={onMarkerLoad}
        zIndex={isSelected ? 1000 : hasActiveStories ? 100 : 1}
        title={venue.name}
        onMouseOver={() => onHover?.(true)}
        onMouseOut={() => onHover?.(false)}
      />
      
      {/* Info window for selected venue */}
      {isSelected && (
        <InfoWindow
          position={position}
          onCloseClick={() => {}}
          options={{
            disableAutoPan: false,
            maxWidth: 280,
            pixelOffset: typeof window !== 'undefined' && window.google?.maps 
              ? new google.maps.Size(0, -30) 
              : undefined
          }}
        >
          <div className="p-2 min-w-0">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-card-foreground truncate">
                  {venue.name}
                </h3>
                
                <div className="flex items-center gap-2 mt-1 mb-2">
                  {venue.category && (
                    <Badge variant="secondary" className="text-xs">
                      {venue.category}
                    </Badge>
                  )}
                  {hasActiveStories && (
                    <Badge className="text-xs bg-primary/20 text-primary">
                      <Instagram className="w-3 h-3 mr-1" />
                      Live Stories
                    </Badge>
                  )}
                </div>
                
                {venue.address && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {venue.address}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      Updated {new Date(venue.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleClick}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export default VenuePin;