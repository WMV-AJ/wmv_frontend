'use client';

import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Venue } from '@/types';
import { parseDateFromFormat } from '@/lib/filters/date-utils';
import { useVenueData } from '@/contexts/VenueDataContext';

interface DatePillsRowProps {
  venues: Venue[];
  selectedDates: string[];
  onDateChange: (dates: string[]) => void;
}

const DatePillsRow: React.FC<DatePillsRowProps> = ({
  venues,
  selectedDates,
  onDateChange,
}) => {
  // Use shared filter options from context — no duplicate fetch
  const { filterOptions: sharedFilterOptions } = useVenueData();
  const filterOptions = { dates: sharedFilterOptions.dates };

  // Count events per date from venues
  const eventCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    venues.forEach(venue => {
      if (venue.event_date) {
        const dateKey = new Date(venue.event_date).toDateString();
        counts[dateKey] = (counts[dateKey] || 0) + 1;
      }
    });
    return counts;
  }, [venues]);

  const dateOptions = useMemo(() => {
    const allDates = filterOptions?.dates || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const dateMap = new Map<string, Date>();
    allDates.forEach((dateStr: string) => {
      try {
        const date = parseDateFromFormat(dateStr);
        if (date.getTime() >= threeDaysAgo.getTime()) {
          const dateKey = date.toDateString();
          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, date);
          }
        }
      } catch {
        // skip invalid dates
      }
    });

    const sortedDates = Array.from(dateMap.entries())
      .sort(([, a], [, b]) => a.getTime() - b.getTime());

    return sortedDates.map(([dateKey, date]) => {
      const isToday = date.toDateString() === today.toDateString();
      return {
        label: isToday
          ? 'Today'
          : date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        dateKey,
        isToday,
        eventCount: eventCountsByDate[dateKey] || 0,
      };
    });
  }, [filterOptions, eventCountsByDate]);

  const handleDateClick = (dateKey: string) => {
    if (dateKey === 'all') {
      onDateChange([]);
    } else {
      const isSelected = selectedDates.includes(dateKey);
      if (isSelected) {
        onDateChange(selectedDates.filter(d => d !== dateKey));
      } else {
        onDateChange([dateKey]);
      }
    }
  };

  const isAllSelected = selectedDates.length === 0;

  return (
    <div className="flex items-center gap-2 px-5 py-2.5 overflow-x-auto scrollbar-hide border-b"
         style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', borderColor: 'rgba(255,255,255,0.04)' }}>
      <Calendar className="w-4 h-4 text-amber-400/60 flex-shrink-0" />

      {dateOptions.map((opt) => {
        const isSelected = selectedDates.includes(opt.dateKey);
        return (
          <button
            key={opt.dateKey}
            onClick={() => handleDateClick(opt.dateKey)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
              isSelected
                ? 'bg-amber-600 text-white shadow-[0_2px_10px_rgba(202, 138, 4,0.35)]'
                : 'bg-white/[0.03] text-gray-400 border border-white/[0.08] hover:bg-white/[0.06] hover:text-gray-300'
            }`}
          >
            <span>{opt.label}</span>
            {opt.eventCount > 0 && (
              <span className={`text-[10px] ${isSelected ? 'text-amber-200' : 'text-gray-500'}`}>
                {opt.eventCount} Events
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default DatePillsRow;
