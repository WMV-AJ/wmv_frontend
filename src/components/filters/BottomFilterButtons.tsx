'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, MapPin, Sparkles, Gift, ChevronUp, Music } from 'lucide-react';
import type { FilterState } from '@/types';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import { isAllCitySentinel, hasAllCitySentinel } from '@/lib/city-helpers';
import { getCityConfig } from '@/config/cities.config';

interface BottomFilterButtonsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

type FilterType = 'area' | 'vibes' | 'offers' | 'genres' | 'chat' | null;

const BottomFilterButtons: React.FC<BottomFilterButtonsProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const { filterOptions, isLoading, error } = useFilterOptions();
  const params = useParams();
  const currentCity = typeof params?.city === 'string' ? params.city : 'dubai';
  // "All <City>" label for the active city — was hardcoded to 'All Dubai'
  // pre-multi-city; now sourced from the DB-backed city registry.
  const cityDefaultLabel = getCityConfig(currentCity).defaultAreaLabel ?? `All ${getCityConfig(currentCity).displayName}`;

  const toggleArea = (area: string) => {
    const existingAllSentinel = filters.selectedAreas.find(isAllCitySentinel) || cityDefaultLabel;
    if (isAllCitySentinel(area)) {
      onFiltersChange({ ...filters, selectedAreas: [area] });
    } else {
      const currentAreas = filters.selectedAreas.filter(a => !isAllCitySentinel(a));
      const newAreas = currentAreas.includes(area)
        ? currentAreas.filter(a => a !== area)
        : [...currentAreas, area];
      const finalAreas = newAreas.length === 0 ? [existingAllSentinel] : newAreas;
      onFiltersChange({ ...filters, selectedAreas: finalAreas });
    }
  };

  const toggleVibe = (vibe: string) => {
    const newVibes = filters.activeVibes.includes(vibe)
      ? filters.activeVibes.filter(v => v !== vibe)
      : [...filters.activeVibes, vibe];
    onFiltersChange({ ...filters, activeVibes: newVibes });
  };

  const toggleOffer = (offer: string) => {
    const newOffers = filters.activeOffers.includes(offer)
      ? filters.activeOffers.filter(o => o !== offer)
      : [...filters.activeOffers, offer];
    onFiltersChange({ ...filters, activeOffers: newOffers });
  };

  const toggleGenre = (genre: string) => {
    const newGenres = filters.activeGenres.includes(genre)
      ? filters.activeGenres.filter(g => g !== genre)
      : [...filters.activeGenres, genre];
    onFiltersChange({ ...filters, activeGenres: newGenres });
  };

  const toggleFilter = (filterType: FilterType) => {
    setActiveFilter(activeFilter === filterType ? null : filterType);
  };

  const getFilterButtonStyle = (filterType: FilterType, hasActiveFilters: boolean) => {
    const isActive = activeFilter === filterType;
    const baseClasses = "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 min-w-[80px] min-h-[80px] touch-manipulation";
    
    if (isActive) {
      return `${baseClasses} bg-yellow-500 text-black shadow-lg scale-105`;
    } else if (hasActiveFilters) {
      return `${baseClasses} bg-blue-600 text-white shadow-md active:scale-95`;
    } else {
      return `${baseClasses} bg-gray-800 text-white active:bg-gray-700 active:scale-95 shadow-md`;
    }
  };

  return (
    <>
      {/* Mobile Bottom Filter Buttons */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4">
        <div className="flex items-center justify-center space-x-4">
          
          {/* Area Filter Button */}
          <button
            onClick={() => toggleFilter('area')}
            className={getFilterButtonStyle('area', !hasAllCitySentinel(filters.selectedAreas) || filters.selectedAreas.length > 1)}
          >
            <MapPin className="h-6 w-6 mb-1" />
            <span className="text-xs font-bold">Area</span>
            {activeFilter === 'area' && <ChevronUp className="h-4 w-4 mt-1" />}
          </button>

          {/* Vibes Filter Button */}
          <button
            onClick={() => toggleFilter('vibes')}
            className={getFilterButtonStyle('vibes', filters.activeVibes.length > 0)}
          >
            <Sparkles className="h-6 w-6 mb-1" />
            <span className="text-xs font-bold">
              Vibes{filters.activeVibes.length > 0 && ` (${filters.activeVibes.length})`}
            </span>
            {activeFilter === 'vibes' && <ChevronUp className="h-4 w-4 mt-1" />}
          </button>

          {/* Genre Filter Button */}
          <button
            onClick={() => toggleFilter('genres')}
            className={getFilterButtonStyle('genres', filters.activeGenres.length > 0)}
          >
            <Music className="h-6 w-6 mb-1" />
            <span className="text-xs font-bold">
              Genre{filters.activeGenres.length > 0 && ` (${filters.activeGenres.length})`}
            </span>
            {activeFilter === 'genres' && <ChevronUp className="h-4 w-4 mt-1" />}
          </button>

          {/* Offers Filter Button */}
          <button
            onClick={() => toggleFilter('offers')}
            className={getFilterButtonStyle('offers', filters.activeOffers.length > 0)}
          >
            <Gift className="h-6 w-6 mb-1" />
            <span className="text-xs font-bold">
              Offers{filters.activeOffers.length > 0 && ` (${filters.activeOffers.length})`}
            </span>
            {activeFilter === 'offers' && <ChevronUp className="h-4 w-4 mt-1" />}
          </button>

          {/* AI Chat Button */}
          <button
            onClick={() => toggleFilter('chat')}
            className={getFilterButtonStyle('chat', false)}
          >
            <MessageCircle className="h-6 w-6 mb-1" />
            <span className="text-xs font-bold">AI</span>
            {activeFilter === 'chat' && <ChevronUp className="h-4 w-4 mt-1" />}
          </button>

        </div>
      </div>

      {/* Expandable Filter Panels */}
      <AnimatePresence>
        {activeFilter && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-sm px-4"
          >
            <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 overflow-y-auto max-h-[50vh] scrollbar-thin">
              
              {/* Area Filter Panel */}
              {activeFilter === 'area' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6 pb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10">
                      <MapPin className="h-5 w-5 text-yellow-500" />
                    </div>
                    <h3 className="text-white font-semibold text-lg leading-none">Select Area</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-[30vh] overflow-y-auto scrollbar-thin">
                    {(() => {
                      // The "All <City>" sentinel for the current city (read from filters,
                      // falls back to the active city's label sourced from cities.config).
                      const allSentinel = filters.selectedAreas.find(isAllCitySentinel) || cityDefaultLabel;
                      return (
                        <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 cursor-pointer touch-manipulation transition-all duration-200 group">
                          <input
                            type="checkbox"
                            checked={hasAllCitySentinel(filters.selectedAreas)}
                            onChange={() => toggleArea(allSentinel)}
                            className="w-5 h-5 text-yellow-500 focus:ring-yellow-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
                          />
                          <span className="text-white text-sm font-medium leading-none group-hover:text-yellow-100">{allSentinel}</span>
                        </label>
                      );
                    })()}
                    {isLoading ? (
                      <div className="text-center py-4">
                        <span className="text-gray-400 text-sm">Loading areas...</span>
                      </div>
                    ) : error ? (
                      <div className="text-center py-4">
                        <span className="text-red-400 text-sm">Error loading areas</span>
                      </div>
                    ) : (
                      filterOptions.areas.map((area) => (
                        <label key={area} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 cursor-pointer touch-manipulation transition-all duration-200 group">
                          <input
                            type="checkbox"
                            checked={filters.selectedAreas.includes(area)}
                            onChange={() => toggleArea(area)}
                            className="w-5 h-5 text-yellow-500 focus:ring-yellow-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
                          />
                          <span className="text-white text-sm font-medium leading-none group-hover:text-yellow-100">{area}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Vibes Filter Panel */}
              {activeFilter === 'vibes' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6 pb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                    </div>
                    <h3 className="text-white font-semibold text-lg leading-none">Select Vibes</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-[30vh] overflow-y-auto scrollbar-thin">
                    {filterOptions.vibes.map((vibe) => (
                      <label key={vibe} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 cursor-pointer touch-manipulation transition-all duration-200 group">
                        <input
                          type="checkbox"
                          checked={filters.activeVibes.includes(vibe)}
                          onChange={() => toggleVibe(vibe)}
                          className="w-5 h-5 rounded border-gray-500 text-yellow-500 focus:ring-yellow-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
                        />
                        <span className="text-white text-sm font-medium leading-none group-hover:text-yellow-100 flex-1">{vibe}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Genre Filter Panel */}
              {activeFilter === 'genres' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6 pb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10">
                      <Music className="h-5 w-5 text-yellow-500" />
                    </div>
                    <h3 className="text-white font-semibold text-lg leading-none">Select Genres</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-[30vh] overflow-y-auto scrollbar-thin">
                    {filterOptions.genres.map((genre) => (
                      <label key={genre} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 cursor-pointer touch-manipulation transition-all duration-200 group">
                        <input
                          type="checkbox"
                          checked={filters.activeGenres.includes(genre)}
                          onChange={() => toggleGenre(genre)}
                          className="w-5 h-5 rounded border-gray-500 text-yellow-500 focus:ring-yellow-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
                        />
                        <span className="text-white text-sm font-medium leading-none group-hover:text-yellow-100 flex-1">{genre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Offers Filter Panel */}
              {activeFilter === 'offers' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6 pb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10">
                      <Gift className="h-5 w-5 text-yellow-500" />
                    </div>
                    <h3 className="text-white font-semibold text-lg leading-none">Select Offers</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-[30vh] overflow-y-auto scrollbar-thin">
                    {/* Offers coming soon */}
                    <p className="text-gray-400 text-sm text-center py-4">Offer filters coming soon...</p>
                  </div>
                </div>
              )}

              {/* Chat Panel */}
              {activeFilter === 'chat' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6 pb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10">
                      <MessageCircle className="h-5 w-5 text-yellow-500" />
                    </div>
                    <h3 className="text-white font-semibold text-lg leading-none">AI Chat</h3>
                  </div>
                  <div className="text-center space-y-4 py-8">
                    <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="h-8 w-8 text-yellow-500" />
                    </div>
                    <p className="text-white text-lg font-medium">AI Chat Coming Soon!</p>
                    <p className="text-gray-300 text-base leading-relaxed">
                      Chat with AI about Dubai events, venues, and get personalized recommendations.
                    </p>
                  </div>
                </div>
              )}
              
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background overlay to close filters */}
      <AnimatePresence>
        {activeFilter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveFilter(null)}
            className="fixed inset-0 bg-black/20 z-30"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default BottomFilterButtons;