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
  /**
   * Which filter's options are on screen. One at a time, and the others stay
   * reachable as tabs rather than being pushed below the fold.
   *
   * The sections used to be a two-column grid of accordions sorted
   * expanded-first. Opening Areas — 77 options — grew that card until Dates and
   * Rating were off the bottom of the sheet, so the only way to reach a filter
   * was to close the one you were already using.
   *
   * Special Offers opens first: it is the shortest list, every entry is a
   * reason to go out tonight, and it is the one filter that changes what you
   * find rather than just where.
   */
  const [activeSection, setActiveSection] = useState<string>('activeOffers');
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

  /**
   * The box at the top of the sheet narrows the lists below it.
   *
   * It always searched venues and events, applied on Apply — but it sat
   * directly above 172 area chips and did nothing to them. Typing
   * "koramangala" left all 172 on screen, so the only way to reach an area was
   * to scroll the whole list. Everyone expects a search box to filter what is
   * underneath it, and here it now does, while still searching the results too.
   *
   * A selected value is never hidden: a filter you cannot see is a filter you
   * cannot remove.
   */
  const narrow = (options: string[], selected: string[]): string[] => {
    const q = (tempFilters.searchQuery || '').trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.toLowerCase().includes(q) || selected.includes(o));
  };

  const filterSections: FilterSectionConfig[] = [
    {
      id: 'selectedAreas',
      title: 'Areas',
      type: 'collapsible',
      isCollapsible: true,
      isExpanded: activeSection === 'selectedAreas',
      options: narrow(filterOptions.areas, tempFilters.selectedAreas),
      selectedValues: tempFilters.selectedAreas
    },
    {
      id: 'activeDates',
      title: 'Dates',
      type: 'collapsible',
      isCollapsible: true,
      isExpanded: activeSection === 'activeDates',
      options: narrow(filterOptions.dates, tempFilters.activeDates),
      selectedValues: tempFilters.activeDates
    },
    {
      id: 'activeOffers',
      title: 'Special Offers',
      type: 'pills',
      isCollapsible: true,
      isExpanded: activeSection === 'activeOffers',
      options: narrow(filterOptions.specialOffers || [], tempFilters.activeOffers || []),
      selectedValues: tempFilters.activeOffers || []
    },
    {
      id: 'selectedRatings',
      title: 'Rating',
      type: 'pills',
      isCollapsible: true,
      isExpanded: activeSection === 'selectedRatings',
      options: ['3+ Stars', '4+ Stars', '5 Stars'],
      selectedValues: (tempFilters.selectedRatings || []).map(r => `${r}+ Stars`)
    },
  ];

  // A tab is a destination, not a toggle: tapping the one you are already on
  // must not leave the panel showing nothing.
  const handleSectionToggle = (sectionId: string) => setActiveSection(sectionId);

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
              {/* Tabs: every filter stays on screen, one shows its options.
                  min-h-0 is load-bearing — a flex child defaults to min-height
                  auto, which lets the options push the tabs off the top instead
                  of scrolling within their own box. */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Tabs are flat text on a rule; the values below them are
                    bordered pills. Both were rounded pills before, which made
                    "Areas" and "Koramangala" the same kind of object on screen
                    — one navigates, the other selects, and nothing said so.
                    Different shape, not just a different colour: a shape reads
                    before a fill does. */}
                <div
                  role="tablist"
                  aria-label="Filter by"
                  className="flex-shrink-0 flex gap-5 px-4 border-b border-white/10 overflow-x-auto scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {filterSections.map((section) => {
                    const isActive = section.id === activeSection;
                    const count = section.selectedValues.filter(v => !isAllCitySentinel(v)).length;
                    return (
                      <button
                        key={section.id}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => handleSectionToggle(section.id)}
                        className={`relative flex-shrink-0 flex items-center gap-1.5 whitespace-nowrap pb-2.5 pt-0.5 text-[13px] tracking-wide transition-colors ${
                          isActive
                            ? 'text-white font-semibold'
                            : 'text-white/45 font-medium hover:text-white/75'
                        }`}
                      >
                        {section.title}
                        {count > 0 && (
                          <span
                            className={`min-w-[17px] rounded-full px-1 text-[11px] font-semibold leading-[17px] text-center ${
                              isActive ? 'bg-white text-black' : 'bg-white/15 text-white/70'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                        {/* Sits ON the rule, so the active tab joins the panel
                            below it rather than floating above it. */}
                        {isActive && (
                          <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-white" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-4 pt-3 pb-3">
                  {filterSections
                    .filter((section) => section.id === activeSection)
                    .map((section) => (
                      <FilterSection
                        key={section.id}
                        section={section}
                        hideHeader
                        onToggle={() => handleSectionToggle(section.id)}
                        onSelectionChange={(selectedValues) =>
                          handleFilterChange(section.id, selectedValues)
                        }
                      />
                    ))}
                </div>
              </div>

              {/* Action Bar — flex child so it never overlaps scroll content */}
              <div className="flex-shrink-0">
                <FilterActionBar
                  onCancel={handleCancel}
                  onApply={handleApply}
                  hasUnsavedChanges={hasUnsavedChanges}
                  selectedCount={
                    tempFilters.selectedAreas.filter(a => !isAllCitySentinel(a)).length +
                    tempFilters.activeDates.length +
                    (tempFilters.activeOffers || []).length +
                    (tempFilters.selectedRatings || []).length
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