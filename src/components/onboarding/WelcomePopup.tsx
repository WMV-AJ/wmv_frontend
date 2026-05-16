'use client';

import React from 'react';
import { X, MapPin, Filter, PartyPopper } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VenueTypeInfo {
  color: string;
  bgColor: string;
  icon: string;
  name: string;
  description: string;
  examples: string[];
}

const venueTypes: VenueTypeInfo[] = [
  {
    color: '#9333ea',
    bgColor: 'bg-purple-500',
    icon: '🍸',
    name: 'Bars & Lounges',
    description: 'Cocktails & nightlife',
    examples: ['Cocktail bars', 'Rooftop lounges']
  },
  {
    color: '#3b82f6',
    bgColor: 'bg-blue-500',
    icon: '🏖️',
    name: 'Beach & Pool',
    description: 'Pool parties & beach vibes',
    examples: ['Beach clubs', 'Pool parties']
  },
  {
    color: '#10b981',
    bgColor: 'bg-green-500',
    icon: '🍽️',
    name: 'Restaurants',
    description: 'Dining experiences',
    examples: ['Fine dining', 'Casual cafes']
  },
  {
    color: '#f59e0b',
    bgColor: 'bg-orange-500',
    icon: '🏈',
    name: 'Sports Bars',
    description: 'Live sports & pub vibes',
    examples: ['Sports viewing', 'Pub games']
  }
];

const WelcomePopup: React.FC<WelcomePopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Main popup with enhanced design */}
      <div className="relative w-full max-w-sm mx-auto">
        <Card className="glassmorphism-popup border-white/20 shadow-2xl animate-popup-in bg-slate-900/80 backdrop-blur-xl">
          <CardContent className="p-6 relative">
            {/* Close button */}
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors duration-200 border-0"
            >
              <X className="w-4 h-4 text-white" />
            </Button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="mb-4">
                {/* Animated GIF logo — `unoptimized` so Next/Image serves it as-is and the GIF actually animates */}
                <Image
                  src="/wmv-logo.gif"
                  alt="WMV Logo"
                  width={120}
                  height={120}
                  unoptimized
                  className="object-contain mx-auto rounded-full"
                />
                <h1 className="font-geist text-sm font-bold text-white mt-2 tracking-wide">
                  Where&apos;s My Vibe?
                </h1>
              </div>

              <p className="font-geist text-sm text-gray-200 leading-relaxed">
                Here we will help you discover all the events happening around you. Scraped from Instagram, Web and all sources to get you a curated but exhaustive list of places, to match your <span className="font-semibold text-purple-300">VIBE</span>
              </p>
            </div>

            {/* CTA */}
            <div className="text-center mb-6">
              <Button
                onClick={onClose}
                size="lg"
                className="w-full font-geist font-medium bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 hover:from-orange-600 hover:via-pink-600 hover:to-red-600 text-white rounded-full transition-all duration-300 shadow-lg border-0 transform hover:scale-105 active:scale-95 animate-pulse hover:animate-none"
              >
                Start Exploring
              </Button>

              <p className="font-geist text-gray-400 text-xs mt-3 tracking-wide">
                Default date to today
              </p>
            </div>

            {/* Quick instructions */}
            <div className="mb-6">
              <div className="grid grid-cols-3 gap-3 text-center">
                <Card className="p-3 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-200">
                  <CardContent className="p-0">
                    <MapPin className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                    <p className="font-geist text-white text-xs font-medium tracking-wide">
                      Tap markers
                    </p>
                  </CardContent>
                </Card>
                <Card className="p-3 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-200">
                  <CardContent className="p-0">
                    <Filter className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                    <p className="font-geist text-white text-xs font-medium tracking-wide">
                      Use filters
                    </p>
                  </CardContent>
                </Card>
                <Card className="p-3 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-200">
                  <CardContent className="p-0">
                    <PartyPopper className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                    <p className="font-geist text-white text-xs font-medium tracking-wide">
                      Find events
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Color coding legend */}
            <div>
              <h2 className="font-geist text-base font-semibold text-white mb-4 text-center tracking-wide">
                Venue Types
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {venueTypes.map((venue, index) => (
                  <Card
                    key={index}
                    className="p-3 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-200"
                  >
                    <CardContent className="p-0 flex items-center space-x-3">
                      {/* Marker indicator */}
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <MapPin
                            className="w-4 h-4 text-white"
                            fill={venue.color}
                            style={{ color: venue.color }}
                          />
                        </div>
                        <span className="text-sm">{venue.icon}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-geist font-medium text-white text-xs leading-tight truncate">
                          {venue.name}
                        </h3>
                        <p className="font-geist text-gray-400 text-xs truncate">
                          {venue.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WelcomePopup;