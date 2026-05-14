'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { HierarchicalFilterState } from '@/types';
import FilterSection from './FilterSection';
import FilterActionBar from './FilterActionBar';
import { trackEvent } from '@/lib/analytics/track';
import { isAllCitySentinel } from '@/lib/city-helpers';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: HierarchicalFilterState;
  onFiltersChange: (filters: HierarchicalFilterState) => void;
  filterOptions: {
    areas: string[];
    vibes: string[];
    dates: string[];
    genres: string[];
    specialOffers?: string[];
    venueCategories?: string[];
    eventCategories?: string[];
  };
}

interface FilterSectionConfig {
  id: string;
  title: string;
  type: 'pills' | 'range' | 'collapsible';
  isCollapsible: boolean;
  isExpanded: boolean;
  options: string[];
  selectedValues: string[];
}

const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  filterOptions
}) => {
  // Temporary filter state for apply/cancel functionality
  const [tempFilters, setTempFilters] = useState<HierarchicalFilterState>(filters);
  const [expandedSections, setExpandedSections] = useState<string[]>(['selectedAreas']);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Ref for search input auto-focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update temp filters when props change (on initial open)
  useEffect(() => {
    if (isOpen) {
      setTempFilters(filters);
      setHasUnsavedChanges(false);
    }
  }, [isOpen, filters]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(tempFilters) !== JSON.stringify(filters);
    setHasUnsavedChanges(hasChanges);
  }, [tempFilters, filters]);

  // Auto-focus search input when sheet opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Delay focus slightly to ensure sheet animation completes
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const filterSections: FilterSectionConfig[] = [
    {
      id: 'selectedAreas',
      title: 'Areas',
      type: 'collapsible',
      isCollapsible: true,
      isExpanded: expandedSections.includes('selectedAreas'),
      options: filterOptions.areas,
      selectedValues: tempFilters.selectedAreas
    },
    // Note: Vibes and Genres are handled by CategoryPills on the map view
    // {
    //   id: 'activeVibes',
    //   title: 'Vibes',
    //   type: 'collapsible',
    //   isCollapsible: true,
    //   isExpanded: expandedSections.includes('activeVibes'),
    //   options: filterOptions.vibes,
    //   selectedValues: [] // TODO: Extract from hierarchical structure
    // },
    {
      id: 'activeDates',
      title: 'Dates',
      type: 'collapsible',
      isCollapsible: true,
      isExpanded: expandedSections.includes('activeDates'),
      options: filterOptions.dates,
      selectedValues: tempFilters.activeDates
    },
    // {
    //   id: 'activeGenres',
    //   title: 'Music Genres',
    //   type: 'collapsible',
    //   isCollapsible: true,
    //   isExpanded: expandedSections.includes('activeGenres'),
    //   options: filterOptions.genres,
    //   selectedValues: [] // TODO: Extract from hierarchical structure
    // },
    {
      id: 'selectedRatings',
      title: 'Minimum Rating',
      type: 'pills',
      isCollapsible: true,
      isExpanded: expandedSections.includes('selectedRatings'),
      options: ['3+ Stars', '4+ Stars', '5 Stars'],
      selectedValues: (tempFilters.selectedRatings || []).map(r => `${r}+ Stars`)
    },
    {
      id: 'selectedTimes',
      title: 'Event Time',
      type: 'pills',
      isCollapsible: true,
      isExpanded: expandedSections.includes('selectedTimes'),
      options: ['Morning', 'Afternoon', 'Evening', 'Night'],
      selectedValues: tempFilters.selectedTimes || []
    },
    {
      id: 'selectedTicketPrices',
      title: 'Ticket Price Range',
      type: 'pills',
      isCollapsible: true,
      isExpanded: expandedSections.includes('selectedTicketPrices'),
      options: ['Free', 'AED 0-50', 'AED 50-100', 'AED 100-200', 'AED 200+'],
      selectedValues: tempFilters.selectedTicketPrices || []
    },
    {
      id: 'selectedVenuePrices',
      title: 'Venue Price Range',
      type: 'pills',
      isCollapsible: true,
      isExpanded: expandedSections.includes('selectedVenuePrices'),
      options: ['$', '$$', '$$$', 'AED', 'AED AED', 'AED AED AED', '£', '££', '£££'],
      selectedValues: tempFilters.selectedVenuePrices || []
    },
    {
      id: 'selectedAtmospheres',
      title: 'Venue Atmosphere',
      type: 'pills',
      isCollapsible: true,
      isExpanded: expandedSections.includes('selectedAtmospheres'),
      options: ['Beachfront', 'Chill', 'Garden', 'High Energy', 'Intimate', 'Open-air', 'Pool', 'Rooftop', 'Underground'],
      selectedValues: tempFilters.selectedAtmospheres || []
    },
    {
      id: 'activeOffers',
      title: 'Special Offers',
      type: 'pills',
      isCollapsible: true,
      isExpanded: expandedSections.includes('activeOffers'),
      options: filterOptions.specialOffers || [],
      selectedValues: tempFilters.activeOffers || []
    },
    {
      id: 'selectedVenueCategories',
      title: 'Venue Categories',
      type: 'collapsible',
      isCollapsible: true,
      isExpanded: expandedSections.includes('selectedVenueCategories'),
      options: filterOptions.venueCategories || [],
      selectedValues: tempFilters.selectedVenueCategories || []
    },
    {
      id: 'selectedEventCategories',
      title: 'Event Categories',
      type: 'pills',
      isCollapsible: true,
      isExpanded: expandedSections.includes('selectedEventCategories'),
      options: filterOptions.eventCategories || [],
      selectedValues: tempFilters.selectedEventCategories || []
    }
  ];

  const handleSectionToggle = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [sectionId] // Only allow one section expanded at a time
    );
  };

  const handleFilterChange = (sectionId: string, selectedValues: string[]) => {
    // Special handling for ratings - convert "3+ Stars" to numbers
    if (sectionId === 'selectedRatings') {
      const ratings = selectedValues.map(v => parseInt(v.split('+')[0]));
      setTempFilters(prev => ({ ...prev, selectedRatings: ratings }));
    } else {
      setTempFilters(prev => ({
        ...prev,
        [sectionId]: selectedValues
      }));
    }
  };

  const handleApply = () => {
    const primaryGenres = tempFilters.selectedPrimaries?.genres ?? [];
    const primaryVibes = tempFilters.selectedPrimaries?.vibes ?? [];
    const secondaryGenres = Object.values(tempFilters.selectedSecondaries?.genres ?? {}).flat();
    const secondaryVibes = Object.values(tempFilters.selectedSecondaries?.vibes ?? {}).flat();
    const areas = tempFilters.selectedAreas ?? [];
    const dates = tempFilters.activeDates ?? [];
    const offers = tempFilters.activeOffers ?? [];
    const ratings = tempFilters.selectedRatings ?? [];
    const times = tempFilters.selectedTimes ?? [];
    const ticketPrices = tempFilters.selectedTicketPrices ?? [];
    const venuePrices = tempFilters.selectedVenuePrices ?? [];
    const atmospheres = tempFilters.selectedAtmospheres ?? [];
    const venueCategories = tempFilters.selectedVenueCategories ?? [];
    const eventCategories = tempFilters.selectedEventCategories ?? [];
    trackEvent('filter_applied', {
      vibes: [...primaryVibes, ...secondaryVibes],
      genres: [...primaryGenres, ...secondaryGenres],
      areas,
      dates,
      offers,
      atmospheres,
      venue_categories: venueCategories,
      event_categories: eventCategories,
      times,
      ticket_prices: ticketPrices,
      venue_prices: venuePrices,
      ratings,
      primary_genres: primaryGenres,
      secondary_genres: secondaryGenres,
      primary_vibes: primaryVibes,
      secondary_vibes: secondaryVibes,
      total_active_filters:
        primaryGenres.length + secondaryGenres.length +
        primaryVibes.length + secondaryVibes.length +
        areas.length + dates.length + offers.length + ratings.length +
        times.length + ticketPrices.length + venuePrices.length +
        atmospheres.length + venueCategories.length + eventCategories.length,
    });
    const q = (tempFilters.searchQuery || '').trim();
    if (q.length > 0) {
      trackEvent('search_performed', { query: q, source: 'filter_sheet' });
    }
    onFiltersChange(tempFilters);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleCancel = () => {
    setTempFilters(filters);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleClearAll = () => {
    // Preserve the current city's "All <City>" sentinel on clear (so a
    // Bangalore page clear doesn't reset to "All Dubai" and vice versa).
    const existingAllSentinel = tempFilters.selectedAreas.find(isAllCitySentinel) || 'All Dubai';
    const clearedFilters: HierarchicalFilterState = {
      selectedPrimaries: { genres: [], vibes: [] },
      selectedSecondaries: { genres: {}, vibes: {} },
      expandedPrimaries: { genres: [], vibes: [] },
      selectedAreas: [existingAllSentinel],
      activeDates: [],
      activeOffers: [],
      searchQuery: '',
      selectedRatings: [],
      selectedTimes: [],
      selectedTicketPrices: [],
      selectedVenuePrices: [],
      selectedAtmospheres: [],
      selectedVenueCategories: [],
      selectedEventCategories: []
    };
    setTempFilters(clearedFilters);
  };

  const getAllSelectedFilters = () => {
    const selected: Array<{ label: string; type: string; color: string; onRemove: () => void }> = [];

    const existingAllSentinel = tempFilters.selectedAreas.find(isAllCitySentinel) || 'All Dubai';

    // Areas (exclude the "All <City>" sentinel)
    tempFilters.selectedAreas.filter(area => !isAllCitySentinel(area)).forEach(area => {
      selected.push({
        label: area,
        type: 'area',
        color: 'bg-[#B9D3C2]/80 border-[#B9D3C2]',
        onRemove: () => {
          const newAreas = tempFilters.selectedAreas.filter(a => a !== area);
          const finalAreas = newAreas.length === 0 ? [existingAllSentinel] : newAreas;
          handleFilterChange('selectedAreas', finalAreas);
        }
      });
    });

    // Dates
    tempFilters.activeDates.forEach(date => {
      selected.push({
        label: date,
        type: 'date',
        color: 'bg-cyan-500/80 border-cyan-400',
        onRemove: () => {
          handleFilterChange('activeDates', tempFilters.activeDates.filter(d => d !== date));
        }
      });
    });

    // New filters
    (tempFilters.selectedRatings || []).forEach(rating => {
      selected.push({
        label: `${rating}+ Stars`,
        type: 'rating',
        color: 'bg-yellow-500/80 border-yellow-400',
        onRemove: () => {
          const newRatings = (tempFilters.selectedRatings || []).filter(r => r !== rating);
          setTempFilters(prev => ({ ...prev, selectedRatings: newRatings }));
        }
      });
    });

    (tempFilters.selectedTimes || []).forEach(time => {
      selected.push({
        label: time,
        type: 'time',
        color: 'bg-blue-500/80 border-blue-400',
        onRemove: () => {
          handleFilterChange('selectedTimes', (tempFilters.selectedTimes || []).filter(t => t !== time));
        }
      });
    });

    (tempFilters.selectedTicketPrices || []).forEach(price => {
      selected.push({
        label: price,
        type: 'ticketPrice',
        color: 'bg-green-500/80 border-green-400',
        onRemove: () => {
          handleFilterChange('selectedTicketPrices', (tempFilters.selectedTicketPrices || []).filter(p => p !== price));
        }
      });
    });

    (tempFilters.selectedVenuePrices || []).forEach(price => {
      selected.push({
        label: price,
        type: 'venuePrice',
        color: 'bg-green-600/80 border-green-500',
        onRemove: () => {
          handleFilterChange('selectedVenuePrices', (tempFilters.selectedVenuePrices || []).filter(p => p !== price));
        }
      });
    });

    (tempFilters.selectedAtmospheres || []).forEach(atmosphere => {
      selected.push({
        label: atmosphere,
        type: 'atmosphere',
        color: 'bg-purple-500/80 border-purple-400',
        onRemove: () => {
          handleFilterChange('selectedAtmospheres', (tempFilters.selectedAtmospheres || []).filter(a => a !== atmosphere));
        }
      });
    });

    (tempFilters.activeOffers || []).forEach(offer => {
      selected.push({
        label: offer,
        type: 'offer',
        color: 'bg-orange-500/80 border-orange-400',
        onRemove: () => {
          handleFilterChange('activeOffers', (tempFilters.activeOffers || []).filter(o => o !== offer));
        }
      });
    });

    (tempFilters.selectedVenueCategories || []).forEach(category => {
      selected.push({
        label: category,
        type: 'venueCategory',
        color: 'bg-indigo-500/80 border-indigo-400',
        onRemove: () => {
          handleFilterChange('selectedVenueCategories', (tempFilters.selectedVenueCategories || []).filter(c => c !== category));
        }
      });
    });

    (tempFilters.selectedEventCategories || []).forEach(category => {
      selected.push({
        label: category,
        type: 'eventCategory',
        color: 'bg-pink-500/80 border-pink-400',
        onRemove: () => {
          handleFilterChange('selectedEventCategories', (tempFilters.selectedEventCategories || []).filter(c => c !== category));
        }
      });
    });

    return selected;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
              duration: 0.3
            }}
            className="fixed left-0 right-0 z-40"
            style={{ top: '180px', bottom: 0 }}
          >
            <div className="filter-bottom-sheet rounded-t-3xl shadow-2xl relative h-full flex flex-col">
              {/* Handle Bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-white/30 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-geist text-lg font-semibold text-white">
                      Filter by
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleClearAll}
                      className="font-geist text-sm text-white/60 hover:text-white/80 px-2 py-1 rounded-md hover:bg-white/10"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={onClose}
                      className="p-1 rounded-full bg-white/10 hover:bg-white/20"
                    >
                      <X className="w-4 h-4 text-white/80" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Input Section */}
              <div className="px-4 py-3 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={tempFilters.searchQuery || ''}
                    onChange={(e) => setTempFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                    placeholder="Search venues, events, vibes..."
                    className="w-full pl-10 pr-10 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
                  />
                  {tempFilters.searchQuery && (
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, searchQuery: '' }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Filters Tags */}
              {getAllSelectedFilters().length > 0 && (
                <div className="px-4 py-1.5">
                  <div className="flex flex-wrap gap-1">
                    {getAllSelectedFilters().map((filter, index) => (
                      <motion.div
                        key={`${filter.type}-${filter.label}-${index}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`flex items-center border rounded-full px-2 py-0.5 ${filter.color}`}
                      >
                        <span className="font-geist text-sm text-white/90 mr-1">
                          {filter.label}
                        </span>
                        <button
                          onClick={filter.onRemove}
                          className="text-white/60 hover:text-white/90"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter Content */}
              <div className="px-4 py-3 pb-32 flex-1 overflow-y-auto scrollbar-thin">
                <div className="grid grid-cols-2 gap-2">
                  {filterSections
                    .sort((a, b) => {
                      // Put expanded sections first
                      if (a.isExpanded && !b.isExpanded) return -1;
                      if (!a.isExpanded && b.isExpanded) return 1;
                      return 0;
                    })
                    .map((section) => (
                      <FilterSection
                        key={section.id}
                        section={section}
                        onToggle={() => handleSectionToggle(section.id)}
                        onSelectionChange={(selectedValues) =>
                          handleFilterChange(section.id, selectedValues)
                        }
                      />
                    ))}
                </div>
              </div>

              {/* Fixed Action Bar */}
              <div className="absolute bottom-0 left-0 right-0">
                <FilterActionBar
                  onCancel={handleCancel}
                  onApply={handleApply}
                  hasUnsavedChanges={hasUnsavedChanges}
                  selectedCount={
                    tempFilters.selectedAreas.filter(a => !isAllCitySentinel(a)).length +
                    tempFilters.activeDates.length +
                    (tempFilters.selectedRatings || []).length +
                    (tempFilters.selectedTimes || []).length +
                    (tempFilters.selectedTicketPrices || []).length +
                    (tempFilters.selectedVenuePrices || []).length +
                    (tempFilters.selectedAtmospheres || []).length +
                    (tempFilters.activeOffers || []).length +
                    (tempFilters.selectedVenueCategories || []).length +
                    (tempFilters.selectedEventCategories || []).length
                  }
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterBottomSheet;