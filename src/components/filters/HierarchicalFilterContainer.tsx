'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HierarchicalFilterState, FilterOptions } from '@/types';

interface HierarchicalFilterContainerProps {
  filters: HierarchicalFilterState;
  onFiltersChange: (filters: HierarchicalFilterState) => void;
  filterOptions: FilterOptions;
}

const HierarchicalFilterContainer: React.FC<HierarchicalFilterContainerProps> = ({
  filters,
  onFiltersChange,
  filterOptions
}) => {
  console.log('🎯 HIERARCHICAL CONTAINER - Rendering with filters:', filters);
  console.log('🎯 HIERARCHICAL CONTAINER - Filter options:', filterOptions);

  // Handle primary category selection
  const handlePrimaryClick = (type: 'genres' | 'vibes', category: string) => {
    console.log('🔘 PRIMARY CLICK - Type:', type, 'Category:', category);
    const currentPrimaries = filters.selectedPrimaries[type];
    const currentExpanded = filters.expandedPrimaries[type];

    if (currentPrimaries.includes(category)) {
      // If already selected, remove it and collapse
      onFiltersChange({
        ...filters,
        selectedPrimaries: {
          ...filters.selectedPrimaries,
          [type]: currentPrimaries.filter(c => c !== category)
        },
        expandedPrimaries: {
          ...filters.expandedPrimaries,
          [type]: currentExpanded.filter(c => c !== category)
        },
        selectedSecondaries: {
          ...filters.selectedSecondaries,
          [type]: Object.fromEntries(
            Object.entries(filters.selectedSecondaries[type]).filter(([key]) => key !== category)
          )
        }
      });
    } else {
      // If not selected, add it and expand
      onFiltersChange({
        ...filters,
        selectedPrimaries: {
          ...filters.selectedPrimaries,
          [type]: [...currentPrimaries, category]
        },
        expandedPrimaries: {
          ...filters.expandedPrimaries,
          [type]: [...currentExpanded, category]
        }
      });
    }
  };

  // Handle secondary category selection
  const handleSecondaryClick = (type: 'genres' | 'vibes', primary: string, secondary: string) => {
    console.log(`🎯 SECONDARY CLICK - Type: ${type} 🏷️ Primary: ${primary} 🎵 Secondary: ${secondary}`);
    console.log('🔍 FULL FILTER STATE:', JSON.stringify(filters, null, 2));
    const currentSecondaries = filters.selectedSecondaries[type][primary] || [];
    console.log('📦 Current secondaries:', currentSecondaries);
    console.log('❓ Is selected?', currentSecondaries.includes(secondary));

    const isCurrentlySelected = currentSecondaries.includes(secondary);
    const newSecondaries = isCurrentlySelected
      ? currentSecondaries.filter(s => s !== secondary)
      : [...currentSecondaries, secondary];

    console.log(isCurrentlySelected ? '➖ REMOVING from selection' : '➕ ADDING to selection');
    console.log('📝 New secondaries after toggle:', newSecondaries);

    // If removing the last secondary, keep the primary but remove secondaries
    // This will revert back to showing all items in that primary category
    if (newSecondaries.length === 0 && isCurrentlySelected) {
      console.log('🔄 No secondaries left - keeping primary but removing secondaries');
      onFiltersChange({
        ...filters,
        selectedSecondaries: {
          ...filters.selectedSecondaries,
          [type]: Object.fromEntries(
            Object.entries(filters.selectedSecondaries[type]).filter(([key]) => key !== primary)
          )
        }
      });
      return;
    }

    // Ensure primary is in selectedPrimaries and expandedPrimaries when working with secondaries
    const primaryIsSelected = filters.selectedPrimaries[type].includes(primary);
    const primaryIsExpanded = filters.expandedPrimaries[type].includes(primary);

    const newFilters = {
      ...filters,
      selectedPrimaries: {
        ...filters.selectedPrimaries,
        [type]: primaryIsSelected
          ? filters.selectedPrimaries[type]
          : [...filters.selectedPrimaries[type], primary]
      },
      expandedPrimaries: {
        ...filters.expandedPrimaries,
        [type]: primaryIsExpanded
          ? filters.expandedPrimaries[type]
          : [...filters.expandedPrimaries[type], primary]
      },
      selectedSecondaries: {
        ...filters.selectedSecondaries,
        [type]: {
          ...filters.selectedSecondaries[type],
          [primary]: newSecondaries
        }
      }
    };

    console.log('✅ NEW FILTER STATE (about to send):', JSON.stringify(newFilters, null, 2));
    console.log(`🎯 NEW secondaries for ${primary}:`, newFilters.selectedSecondaries[type][primary]);
    onFiltersChange(newFilters);
  };

  // Get color for category
  const getCategoryColor = (type: 'genres' | 'vibes', category: string): string => {
    const hierarchical = type === 'genres' ? filterOptions.hierarchicalGenres : filterOptions.hierarchicalVibes;
    return hierarchical[category]?.color || 'gray';
  };

  // Get hex color from color name
  const getHexColor = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      purple: '#9333EA',
      blue: '#3B82F6',
      green: '#10B981',
      orange: '#F97316',
      teal: '#14B8A6',
      pink: '#EC4899',
      indigo: '#6366F1',
      gray: '#6B7280'
    };
    return colorMap[colorName] || '#6B7280';
  };

  // Render primary pill
  const renderPrimaryPill = (type: 'genres' | 'vibes', category: string) => {
    const isSelected = filters.selectedPrimaries[type].includes(category);
    const isExpanded = filters.expandedPrimaries[type].includes(category);
    const colorName = getCategoryColor(type, category);
    const hexColor = getHexColor(colorName);

    return (
      <button
        key={`${type}-${category}`}
        onClick={() => handlePrimaryClick(type, category)}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-full
          backdrop-blur-lg border-2
          transition-all duration-200 whitespace-nowrap flex-shrink-0
          ${isSelected
            ? 'text-white border-white/90 shadow-lg'
            : 'text-white/90 border-white/60 hover:border-white/80'
          }
        `}
        style={{
          backgroundColor: isSelected ? hexColor : `${hexColor}CC`
        }}
      >
        {category}
        {isExpanded && ' ↓'}
      </button>
    );
  };

  // Render secondary pill
  const renderSecondaryPill = (type: 'genres' | 'vibes', primary: string, secondary: string) => {
    const isSelected = filters.selectedSecondaries[type][primary]?.includes(secondary) || false;
    const colorName = getCategoryColor(type, primary);
    const hexColor = getHexColor(colorName);

    // Removed verbose render logging

    return (
      <button
        key={`${type}-${primary}-${secondary}`}
        onClick={() => handleSecondaryClick(type, primary, secondary)}
        className={`
          px-2 py-1 text-xs font-medium rounded-full
          backdrop-blur-lg border-2
          transition-all duration-200 whitespace-nowrap flex-shrink-0
          ${isSelected
            ? 'text-white border-white shadow-lg scale-105'
            : 'text-white/70 border-white/30 hover:border-white/50 hover:text-white/90'
          }
        `}
        style={{
          backgroundColor: isSelected ? hexColor : `${hexColor}80`
        }}
      >
        {secondary}
      </button>
    );
  };

  // Get all expanded secondaries for display
  const getExpandedSecondaries = () => {
    const secondaries: Array<{ type: 'genres' | 'vibes', primary: string, secondary: string }> = [];

    // Add genre secondaries
    filters.expandedPrimaries.genres.forEach(primary => {
      const subcategories = filterOptions.hierarchicalGenres[primary]?.subcategories || [];
      subcategories.forEach(secondary => {
        secondaries.push({ type: 'genres', primary, secondary });
      });
    });

    // Add vibe secondaries
    filters.expandedPrimaries.vibes.forEach(primary => {
      const subcategories = filterOptions.hierarchicalVibes[primary]?.subcategories || [];
      subcategories.forEach(secondary => {
        secondaries.push({ type: 'vibes', primary, secondary });
      });
    });

    return secondaries;
  };

  const expandedSecondaries = getExpandedSecondaries();

  // Safety check for undefined filter options
  if (!filterOptions.hierarchicalGenres || !filterOptions.hierarchicalVibes) {
    return null;
  }

  return (
    <div className="fixed top-[92px] left-0 right-0 z-40 px-4">
      {/* Primary Filter Row */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Genre Categories */}
        {Object.keys(filterOptions.hierarchicalGenres || {}).map(category =>
          renderPrimaryPill('genres', category)
        )}

        {/* Divider */}
        <div className="w-px h-8 bg-white/30 mx-2 flex-shrink-0" />

        {/* Vibe Categories */}
        {Object.keys(filterOptions.hierarchicalVibes || {}).map(category =>
          renderPrimaryPill('vibes', category)
        )}
      </div>

      {/* Secondary Filter Row - Animated */}
      <AnimatePresence>
        {expandedSecondaries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 pt-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {expandedSecondaries.map(({ type, primary, secondary }) =>
                renderSecondaryPill(type, primary, secondary)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HierarchicalFilterContainer;