'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import PillButton from './PillButton';
import DatePresets from './DatePresets';
import { isAllCitySentinel } from '@/lib/city-helpers';
import { getCityConfig } from '@/config/cities.config';

interface FilterSectionConfig {
  id: string;
  title: string;
  type: 'pills' | 'range' | 'collapsible' | 'date-presets';
  isCollapsible: boolean;
  isExpanded: boolean;
  options: string[];
  selectedValues: string[];
}

interface FilterSectionProps {
  section: FilterSectionConfig;
  onToggle: () => void;
  onSelectionChange: (selectedValues: string[]) => void;
  /**
   * Drop the section's own title row. Used when the sheet drives the sections
   * as tabs — the tab already names the section and carries its count, so
   * repeating both directly beneath it is noise the panel cannot afford.
   */
  hideHeader?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  section,
  onToggle,
  onSelectionChange,
  hideHeader = false
}) => {
  const params = useParams();
  const currentCity = typeof params?.city === 'string' ? params.city : 'dubai';

  const handlePillClick = (option: string) => {
    const { selectedValues, id } = section;

    // Special handling for areas — "All <City>" sentinel logic
    if (id === 'selectedAreas') {
      // The current "All <City>" sentinel for this filter (e.g. "All Dubai",
      // "All Bangalore", "All Mumbai"). Falls back to the active city's label
      // from cities.config (was hardcoded to 'All Dubai' pre-multi-city).
      const cityDefaultLabel = getCityConfig(currentCity).defaultAreaLabel ?? `All ${getCityConfig(currentCity).displayName}`;
      const existingAllSentinel = selectedValues.find(isAllCitySentinel) || cityDefaultLabel;

      if (isAllCitySentinel(option)) {
        onSelectionChange([option]);
      } else {
        const currentAreas = selectedValues.filter(a => !isAllCitySentinel(a));
        const newAreas = currentAreas.includes(option)
          ? currentAreas.filter(a => a !== option)
          : [...currentAreas, option];

        // If no specific areas selected, snap back to the "All <City>" sentinel.
        const finalAreas = newAreas.length === 0 ? [existingAllSentinel] : newAreas;
        onSelectionChange(finalAreas);
      }
    } else {
      // Standard multi-select behavior for other filters
      const newSelection = selectedValues.includes(option)
        ? selectedValues.filter(v => v !== option)
        : [...selectedValues, option];
      onSelectionChange(newSelection);
    }
  };

  const getVariantForSection = (sectionId: string) => {
    switch (sectionId) {
      case 'selectedAreas':
        return 'area';
      case 'activeVibes':
        return 'vibe';
      case 'activeGenres':
        return 'genre';
      case 'activeDates':
        return 'date';
      default:
        return 'default';
    }
  };

  const selectedCount = section.selectedValues.filter(v => !isAllCitySentinel(v)).length;

  return (
    <div className={`filter-section ${section.isExpanded ? 'col-span-2' : ''}`}>
      {/* Section Header */}
      {!hideHeader && (
      <div className="flex items-center justify-between mb-1.5 min-h-[28px]">
        <div className="flex items-center space-x-1.5">
          <h3 className="font-geist text-sm font-semibold text-white">
            {section.title}
          </h3>
          {selectedCount > 0 && (
            <span className="px-1.5 py-0.5 text-sm font-medium bg-white/20 text-white/90 rounded-full">
              {selectedCount}
            </span>
          )}
        </div>

        {section.isCollapsible && (
          <button
            onClick={onToggle}
            className="flex items-center justify-center p-0.5 rounded-md hover:bg-white/10"
            aria-label={section.isExpanded ? 'Collapse section' : 'Expand section'}
          >
            {section.isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-white/80" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-white/80" />
            )}
          </button>
        )}
      </div>
      )}

      {/* Section Content */}
      <AnimatePresence initial={false}>
        {(!section.isCollapsible || section.isExpanded) && (
          <motion.div
            initial={section.isCollapsible ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.2,
              ease: 'easeOut'
            }}
            className="overflow-hidden"
          >
            {/* Render date presets for date sections */}
            {section.id === 'activeDates' ? (
              <DatePresets
                activeDates={section.selectedValues}
                onDateSelect={onSelectionChange}
                availableDates={section.options}
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {section.options.map((option) => (
                  <PillButton
                    key={option}
                    label={option}
                    isSelected={section.selectedValues.includes(option)}
                    onClick={() => handlePillClick(option)}
                    variant={getVariantForSection(section.id)}
                    size="sm"
                  />
                ))}
              </div>
            )}

            {/* Show helpful text for empty selections */}
            {section.options.length === 0 && (
              <div className="text-center py-4">
                <p className="font-geist text-sm text-white/60">
                  No {section.title.toLowerCase()} available
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterSection;