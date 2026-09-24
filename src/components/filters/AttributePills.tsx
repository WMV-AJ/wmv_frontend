'use client';

import React from 'react';
import { HierarchicalFilterState, AttributeFilterState, Venue } from '@/types';

interface AttributePillsProps {
  filters: HierarchicalFilterState;
  onFiltersChange: (filters: HierarchicalFilterState) => void;
  venues: Venue[];
}

const AttributePills: React.FC<AttributePillsProps> = ({
  filters,
  onFiltersChange,
  venues
}) => {
  console.log('🎨 ATTRIBUTE PILLS - Rendering with filters:', filters);
  console.log('🎨 ATTRIBUTE PILLS - Venues count:', venues.length);

  // Initialize attributes if not present
  const attributes: AttributeFilterState = filters.attributes || {
    venue: [],
    energy: [],
    timing: [],
    status: []
  };

  // Attribute configurations
  const attributeConfig = {
    venue: {
      label: 'Venue Type',
      color: '#3B82F6', // blue
      options: ['Indoor', 'Outdoor', 'Rooftop', 'Beach']
    },
    energy: {
      label: 'Energy',
      color: '#F97316', // orange
      options: ['High Energy', 'Intimate', 'Chill', 'Underground']
    },
    timing: {
      label: 'Timing',
      color: '#14B8A6', // teal
      options: ['Day Party', 'Night Event', 'Late Night', 'All Day']
    },
    status: {
      label: 'Status',
      color: '#EC4899', // pink
      options: ['Free Entry', 'Ticketed', 'VIP', 'Guest List', 'Packed', 'Exclusive']
    }
  };

  // Calculate counts for each attribute value
  const getAttributeCount = (attributeType: keyof AttributeFilterState, value: string): number => {
    return venues.filter(venue => {
      const venueAttributes = venue.attributes?.[attributeType] || [];
      return venueAttributes.includes(value);
    }).length;
  };

  // Handle attribute selection
  const handleAttributeClick = (attributeType: keyof AttributeFilterState, value: string) => {
    console.log(`🔘 ATTRIBUTE CLICK - Type: ${attributeType}, Value: ${value}`);
    const currentValues = attributes[attributeType];
    const isCurrentlySelected = currentValues.includes(value);

    const newValues = isCurrentlySelected
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    console.log(isCurrentlySelected ? '➖ REMOVING from selection' : '➕ ADDING to selection');
    console.log('📝 New values after toggle:', newValues);

    onFiltersChange({
      ...filters,
      attributes: {
        ...attributes,
        [attributeType]: newValues
      }
    });
  };

  // Render attribute pill
  const renderAttributePill = (
    attributeType: keyof AttributeFilterState,
    value: string,
    color: string
  ) => {
    const isSelected = attributes[attributeType].includes(value);
    const count = getAttributeCount(attributeType, value);

    // Don't show attributes with 0 count
    if (count === 0) return null;

    return (
      <button
        key={`${attributeType}-${value}`}
        onClick={() => handleAttributeClick(attributeType, value)}
        className={`
          px-2.5 py-1 text-xs font-medium rounded-full
          backdrop-blur-lg border-2
          transition-all duration-200 whitespace-nowrap flex-shrink-0
          ${isSelected
            ? 'text-white border-white shadow-lg scale-105'
            : 'text-white/70 border-white/30 hover:border-white/50 hover:text-white/90'
          }
        `}
        style={{
          backgroundColor: isSelected ? color : `${color}80`
        }}
      >
        {value} ({count})
      </button>
    );
  };

  // Render attribute group
  const renderAttributeGroup = (attributeType: keyof AttributeFilterState) => {
    const config = attributeConfig[attributeType];
    const pills = config.options
      .map(option => renderAttributePill(attributeType, option, config.color))
      .filter(Boolean);

    // Don't render the group if there are no pills
    if (pills.length === 0) return null;

    return (
      <div key={attributeType} className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/60 uppercase tracking-wide flex-shrink-0">
            {config.label}
          </span>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {pills}
          </div>
        </div>
      </div>
    );
  };

  // Check if any attributes are available
  const hasAnyAttributes = venues.some(venue => venue.attributes);
  if (!hasAnyAttributes) {
    console.log('⚠️ No venues with attributes found');
    return null;
  }

  return (
    <div className="fixed top-[150px] left-0 right-0 z-30 px-4">
      <div className="flex flex-col gap-2 bg-black/20 backdrop-blur-md rounded-lg p-3">
        {renderAttributeGroup('venue')}
        {renderAttributeGroup('energy')}
        {renderAttributeGroup('timing')}
        {renderAttributeGroup('status')}
      </div>
    </div>
  );
};

export default AttributePills;
