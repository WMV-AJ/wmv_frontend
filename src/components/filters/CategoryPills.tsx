'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils, Laugh, Moon, Music2, Trophy, Sun, Clock, Waves, Sparkles, Coffee,
  // 046/047 city-specific category icons
  Martini, Beer, Wrench, Users, PartyPopper, Mic, Wine, Zap, Briefcase, Film,
  Tag, // generic fallback for unknown categories
} from 'lucide-react';
import { HierarchicalFilterState, EventCategoryFilterState, Venue } from '@/types';
import {
  getCategoryColor,
  getHexColor,
  getDisplayName
} from '@/lib/category-mappings';
import { getCityConfig } from '@/config/cities.config';

interface CategoryPillsProps {
  filters: HierarchicalFilterState;
  onFiltersChange: (filters: HierarchicalFilterState) => void;
  venues: Venue[];
  inlineMode?: boolean;
  variant?: 'filled' | 'outlined';
  wrapPills?: boolean;
  darkMode?: boolean;
}

const SHORT_DISPLAY_NAMES: Record<string, string> = {
  'Food & Dining': 'Food',
  'Club Night': 'Clubs',
  'Cocktail Bar Night': 'Cocktail',
  'Live Performance': 'Live',
  'Business Event': 'Business',
  'Family & Kids': 'Family',
  'Tasting Event': 'Tasting',
  'Bollywood Night': 'Bollywood',
  'Standup Comedy': 'Standup',
};

// Icon mapping for primary categories — keys match DB event_categories[].primary exactly
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Food & Dining': Utensils,
  'Sports Viewing': Trophy,
  'Live Performance': Music2,
  'Club Night': Moon,
  'Day Party & Afterwork': Sun,
  'Happy Hour': Clock,
  'Pool Party': Waves,
  'Ladies Night': Sparkles,
  'Brunch': Coffee,
  'Comedy Night': Laugh,
  // 046/047 city-specific additions
  'Cocktail Bar Night': Martini,
  'Pub Night': Beer,
  'Workshop': Wrench,
  'Family & Kids': Users,
  'Activities': PartyPopper,
  'Karaoke': Mic,
  'Tasting Event': Wine,
  'Pop Up': Zap,
  'Business Event': Briefcase,
  'Bollywood Night': Film,
  'Standup Comedy': Mic,
};

const CategoryPills: React.FC<CategoryPillsProps> = ({
  filters,
  onFiltersChange,
  venues,
  inlineMode = false,
  variant = 'filled',
  wrapPills = false,
  darkMode = false,
}) => {
  const isOutlined = variant === 'outlined';
  const eventCategories: EventCategoryFilterState = filters.eventCategories || {
    selectedPrimaries: [],
    selectedSecondaries: {},
    expandedPrimaries: []
  };

  const getCategoryCount = (primaryCategory: string): number => {
    return venues.filter(venue => {
      const categories = venue.event_categories || [];
      return categories.some(cat => cat.primary === primaryCategory);
    }).length;
  };

  const handlePrimaryClick = (category: string) => {
    const currentPrimaries = eventCategories.selectedPrimaries;
    const currentExpanded = eventCategories.expandedPrimaries;

    if (currentPrimaries.includes(category)) {
      onFiltersChange({
        ...filters,
        eventCategories: {
          ...eventCategories,
          selectedPrimaries: currentPrimaries.filter(c => c !== category),
          expandedPrimaries: currentExpanded.filter(c => c !== category),
          selectedSecondaries: Object.fromEntries(
            Object.entries(eventCategories.selectedSecondaries).filter(([key]) => key !== category)
          )
        }
      });
    } else {
      onFiltersChange({
        ...filters,
        eventCategories: {
          ...eventCategories,
          selectedPrimaries: [...currentPrimaries, category],
          expandedPrimaries: [...currentExpanded, category]
        }
      });
    }
  };

  const handleSecondaryClick = (primary: string, secondary: string) => {
    const currentSecondaries = eventCategories.selectedSecondaries[primary] || [];
    const isCurrentlySelected = currentSecondaries.includes(secondary);
    const newSecondaries = isCurrentlySelected
      ? currentSecondaries.filter(s => s !== secondary)
      : [...currentSecondaries, secondary];

    if (newSecondaries.length === 0 && isCurrentlySelected) {
      onFiltersChange({
        ...filters,
        eventCategories: {
          ...eventCategories,
          selectedSecondaries: Object.fromEntries(
            Object.entries(eventCategories.selectedSecondaries).filter(([key]) => key !== primary)
          )
        }
      });
      return;
    }

    const primaryIsSelected = eventCategories.selectedPrimaries.includes(primary);
    const primaryIsExpanded = eventCategories.expandedPrimaries.includes(primary);

    onFiltersChange({
      ...filters,
      eventCategories: {
        selectedPrimaries: primaryIsSelected
          ? eventCategories.selectedPrimaries
          : [...eventCategories.selectedPrimaries, primary],
        expandedPrimaries: primaryIsExpanded
          ? eventCategories.expandedPrimaries
          : [...eventCategories.expandedPrimaries, primary],
        selectedSecondaries: {
          ...eventCategories.selectedSecondaries,
          [primary]: newSecondaries
        }
      }
    });
  };

  const getExpandedSecondaries = () => {
    const secondaries: Array<{ primary: string, secondary: string }> = [];
    eventCategories.expandedPrimaries.forEach(primary => {
      // Build secondary counts from live venue data — sorted by count, top 5 only
      const countMap = new Map<string, number>();
      venues.forEach(venue => {
        (venue.event_categories || []).forEach(cat => {
          if (cat.primary === primary && cat.secondary) {
            countMap.set(cat.secondary, (countMap.get(cat.secondary) || 0) + 1);
          }
        });
      });
      Array.from(countMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([secondary]) => secondaries.push({ primary, secondary }));
    });
    return secondaries;
  };

  const expandedSecondaries = getExpandedSecondaries();

  // City-driven pill list (migration 046/047 — backend city_config.event_categories,
  // mirrored into frontend CityUiConfig.eventCategories and synced via
  // /api/cities at runtime). Falls back to any organically-observed categories
  // in the venues data if the city's taxonomy is empty (e.g. a freshly-onboarded
  // city before its taxonomy is curated).
  const params = useParams();
  const citySlug = (Array.isArray(params?.city) ? params.city[0] : params?.city) || '';
  const cityCfg = getCityConfig(citySlug);

  const taxonomy: string[] = cityCfg.eventCategories?.length
    ? cityCfg.eventCategories
    : Array.from(new Set(
        venues.flatMap(v => (v.event_categories || []).map(c => c.primary).filter(Boolean) as string[])
      ));

  const sortedCategories = taxonomy
    .map(category => ({ category, count: getCategoryCount(category) }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count);

  const renderPill = (category: string) => {
    const isSelected = eventCategories.selectedPrimaries.includes(category);
    const isExpanded = eventCategories.expandedPrimaries.includes(category);
    const hexColor = getHexColor(getCategoryColor(category));
    const displayName = getDisplayName(category);
    const label = isOutlined ? (SHORT_DISPLAY_NAMES[category] || displayName) : displayName;
    const count = getCategoryCount(category);
    const IconComponent = CATEGORY_ICONS[category] ?? Tag;

    return (
      <button
        key={`category-${category}`}
        onClick={() => handlePrimaryClick(category)}
        className={`flex items-center gap-1 px-2.5 md:px-2 py-1 md:py-0.5 rounded-full text-[10px] md:text-[8px] font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
          isSelected ? 'shadow-md' : 'hover:shadow-sm'
        }`}
        style={isOutlined ? {
          color: isSelected ? '#ffffff' : hexColor,
          background: isSelected ? hexColor : darkMode ? 'rgba(10,10,26,0.75)' : 'rgba(255,255,255,0.9)',
          border: `1.5px solid ${hexColor}`,
        } : {
          color: '#ffffff',
          background: isSelected ? hexColor : `${hexColor}CC`,
          border: `1px solid ${isSelected ? hexColor : hexColor + '90'}`,
        }}
      >
        {IconComponent && <IconComponent className="w-3 h-3" />}
        {label} ({count})
        {isExpanded && ' ↓'}
      </button>
    );
  };

  // Three rows, not two. At two rows the ten Bangalore categories ran wider
  // than the bar and the last few (Workshop, Pop Up) could only be reached by
  // scrolling sideways - easy to miss entirely on a phone.
  //
  // Contiguous chunks rather than round-robin so the count ordering still
  // reads left-to-right, and sizes are balanced (10 -> 4/3/3, not 4/4/2) so no
  // single row is much wider than the rest.
  const PILL_ROWS = 3;
  const perRow = Math.floor(sortedCategories.length / PILL_ROWS);
  const remainder = sortedCategories.length % PILL_ROWS;
  const pillRows: string[][] = [];
  let taken = 0;
  for (let r = 0; r < PILL_ROWS; r += 1) {
    const size = perRow + (r < remainder ? 1 : 0);
    if (size > 0) {
      pillRows.push(sortedCategories.slice(taken, taken + size).map(({ category }) => category));
      taken += size;
    }
  }

  const pillsContent = (
    <div className="flex flex-col gap-2">
      {/* Primary Category Row with Icons */}
      <div
        className={wrapPills ? 'pb-0.5' : 'overflow-x-auto scrollbar-hide pb-0.5'}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {wrapPills ? (
          <div className="flex flex-col gap-1.5">
            {/* flex-wrap as well as the row split: a city with longer category
                names, or a narrow phone, spills onto another line instead of
                bringing the sideways scroll back. */}
            {pillRows.map((row, i) => (
              <div key={i} className="flex flex-wrap gap-1.5">{row.map(renderPill)}</div>
            ))}
          </div>
        ) : (
          <div className="flex gap-1.5">
            {sortedCategories.map(({ category }) => renderPill(category))}
          </div>
        )}
      </div>

      {/* Secondary Category Row - Animated */}
      <AnimatePresence>
        {expandedSecondaries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{
              opacity: 0,
              height: 0,
              transition: {
                opacity: { duration: 0.1 },
                height: { duration: 0.22, delay: 0.08, ease: 'easeInOut' },
              },
            }}
            transition={{
              height: { duration: 0.22, ease: 'easeOut' },
              opacity: { duration: 0.15, delay: 0.15 },
            }}
            className="overflow-hidden"
          >
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 pt-0.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {expandedSecondaries.map(({ primary, secondary }) => {
                const isSelected = eventCategories.selectedSecondaries[primary]?.includes(secondary) || false;
                const hexColor = getHexColor(getCategoryColor(primary));
                return (
                  <button
                    key={`category-${primary}-${secondary}`}
                    onClick={() => handleSecondaryClick(primary, secondary)}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                      isSelected ? 'shadow-lg scale-105' : ''
                    }`}
                    style={isOutlined ? {
                      color: isSelected ? '#ffffff' : hexColor,
                      background: isSelected ? hexColor : darkMode ? 'rgba(10,10,26,0.75)' : 'rgba(255,255,255,0.9)',
                      border: `1.5px solid ${hexColor}`,
                    } : {
                      color: '#ffffff',
                      background: isSelected ? hexColor : `${hexColor}99`,
                      border: `1px solid ${isSelected ? hexColor : hexColor + '60'}`,
                    }}
                  >
                    {secondary}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (inlineMode) {
    return pillsContent;
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-[130px] md:h-[150px] bg-gradient-to-b from-black/40 via-black/20 to-transparent pointer-events-none z-39" />
      <div className="fixed top-[110px] md:top-[120px] left-0 right-0 z-30 px-2 md:px-4 pt-1 pb-1">
        {pillsContent}
      </div>
    </>
  );
};

export default CategoryPills;
