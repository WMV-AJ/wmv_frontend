'use client';

import React from 'react';
import { FilterState } from '@/types';

interface GenreFilterTilesProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableGenres: string[];
}

const GenreFilterTiles: React.FC<GenreFilterTilesProps> = ({
  filters,
  onFiltersChange,
  availableGenres
}) => {
  const handleGenreClick = (genre: string) => {
    const currentGenres = filters.activeGenres || [];
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];

    onFiltersChange({
      ...filters,
      activeGenres: newGenres
    });
  };

  const getCategoryColor = (category: string) => {
    const lowerCategory = category.toLowerCase();

    if (lowerCategory.includes('bar') && (lowerCategory.includes('sports') || lowerCategory.includes('pub'))) {
      return '#FF8C00';
    } else if (lowerCategory.includes('lounge')) {
      return '#9370DB';
    } else if (lowerCategory.includes('bar')) {
      return '#FF69B4';
    } else if (lowerCategory.includes('beach') || lowerCategory.includes('club')) {
      return '#1E90FF';
    } else if (lowerCategory.includes('restaurant') || lowerCategory.includes('cafe')) {
      return '#32CD32';
    } else if (lowerCategory.includes('hotel')) {
      return '#FFD700';
    } else {
      return '#DC143C';
    }
  };

  // Show all available genres based on current filters
  const displayGenres = availableGenres;

  // Debug: Log the number of genres
  console.log('🎵 GenreFilterTiles - Total genres available:', displayGenres.length);
  console.log('🎵 GenreFilterTiles - Genres list:', displayGenres);

  return (
    <div className="fixed top-[92px] left-0 right-0 z-40 px-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {displayGenres.map((genre) => {
          const isSelected = filters.activeGenres?.includes(genre);
          const categoryColor = getCategoryColor(genre);
          return (
            <button
              key={genre}
              onClick={() => handleGenreClick(genre)}
              className={`
                px-3 py-1 text-xs font-medium rounded-full
                backdrop-blur-lg border-2
                transition-all duration-200 whitespace-nowrap flex-shrink-0
                relative
                ${isSelected
                  ? 'text-white border-white/90'
                  : 'text-white/90 border-white/60 hover:border-white/80'
                }
              `}
              style={{
                backgroundColor: isSelected ? categoryColor : `${categoryColor}CC`
              }}
            >
              {genre}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GenreFilterTiles;