'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Search, List, Map as MapIcon, ChevronDown, Home } from 'lucide-react';
import { Venue } from '@/types';
import { parseDateFromFormat } from '@/lib/filters/date-utils';
import { useVenueData } from '@/contexts/VenueDataContext';
import SignInButton from '@/components/auth/SignInButton';
import UserMenu from '@/components/auth/UserMenu';

// ===========================================
// DATE RANGE PRESET LOGIC
// ===========================================

type DateRangePreset = 'today' | 'all' | 'this-week' | 'next-week' | 'this-month' | 'next-month';

const PRESET_LABELS: Record<DateRangePreset, string> = {
  'today': 'Today',
  'all': 'All Dates',
  'this-week': 'This Week',
  'next-week': 'Next Week',
  'this-month': 'This Month',
  'next-month': 'Next Month',
};

function getDateRangeKeys(preset: DateRangePreset): string[] {
  if (preset === 'all') return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (preset === 'today') return [today.toDateString()];

  const dates: string[] = [];

  if (preset === 'this-week') {
    // Start from today through end of week (Sunday)
    const day = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    for (let i = 0; i <= daysUntilSunday; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toDateString());
    }
  } else if (preset === 'next-week') {
    const day = today.getDay();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + (7 - ((day + 6) % 7)));
    for (let i = 0; i < 7; i++) {
      const d = new Date(nextMonday);
      d.setDate(nextMonday.getDate() + i);
      dates.push(d.toDateString());
    }
  } else if (preset === 'this-month') {
    // Start from today through end of month
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = today.getDate(); i <= daysInMonth; i++) {
      dates.push(new Date(year, month, i).toDateString());
    }
  } else if (preset === 'next-month') {
    const year = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
    const month = (today.getMonth() + 1) % 12;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(year, month, i).toDateString());
    }
  }

  return dates;
}

interface DateSelectorProps {
  venues: Venue[];
  selectedDates: string[];
  onDateChange: (dates: string[]) => void;
  className?: string;
}

interface TopNavProps {
  navButtons?: React.ReactNode;
  onSearchClick?: () => void;
  showDatePicker?: boolean;
  datePickerProps?: DateSelectorProps;
  showCategoryPills?: boolean;
  categoryPillsContent?: React.ReactNode;
  embedded?: boolean; // When true, renders as static (for desktop split-view)
  hideProfile?: boolean; // When true, hides user avatar/signout in mobile overlay
  hideSignOut?: boolean; // When true, avatar stays visible but the sign-out
                         // button in the dropdown is suppressed (used on
                         // map + cards so the sign-out action lives only on
                         // the home page).
  onListToggle?: () => void; // Toggle between map and list views
  isListView?: boolean; // Current view mode
  onPresetRangeDatesChange?: (dates: string[]) => void; // Notify parent of preset range dates
  onHeightChange?: (height: number) => void; // Notify parent of nav height (mobile only)
  darkMode?: boolean;
}

const TopNav: React.FC<TopNavProps> = ({
  navButtons,
  onSearchClick,
  showDatePicker,
  datePickerProps,
  showCategoryPills,
  categoryPillsContent,
  embedded = false,
  hideProfile = false,
  hideSignOut = false,
  onListToggle,
  isListView = false,
  onPresetRangeDatesChange,
  onHeightChange,
  darkMode = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  // Use shared filter options from context — no duplicate fetch
  const { filterOptions: sharedFilterOptions } = useVenueData();
  const filterOptions = { dates: sharedFilterOptions.dates };
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDateScrollRef = useRef<HTMLDivElement>(null);
  const todayPillRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  // Measure mobile nav height and notify parent
  useEffect(() => {
    if (embedded || !onHeightChange || !mobileNavRef.current) return;
    const el = mobileNavRef.current;
    // Fire initial measurement
    onHeightChange(el.offsetTop + el.offsetHeight);
    // ResizeObserver guard for older Safari (< 13.1)
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        onHeightChange(el.offsetTop + el.offsetHeight);
      });
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [embedded, onHeightChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Filter options now come from shared VenueDataContext — no fetch needed here

  const dateOptions = useMemo(() => {
    if (!datePickerProps) return [];
    const allDates = filterOptions?.dates || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateMap = new Map<string, Date>();
    allDates.forEach((dateStr: string) => {
      try {
        const date = parseDateFromFormat(dateStr);
        if (isNaN(date.getTime())) return;
        const dateKey = date.toDateString();
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, date);
        }
      } catch { /* skip */ }
    });

    const sortedDates = Array.from(dateMap.entries())
      .sort(([, a], [, b]) => a.getTime() - b.getTime());

    return sortedDates.map(([dateKey, date]) => ({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dateKey,
      isToday: date.toDateString() === today.toDateString(),
      isSaturday: date.getDay() === 6,
      isSunday: date.getDay() === 0,
    }));
  }, [filterOptions, datePickerProps]);

  // Auto-scroll date pills on initial load (to today) and when dropdown preset changes
  const prevPresetRef = useRef<string>(selectedPreset);
  const hasInitialScrolled = useRef(false);
  useEffect(() => {
    if (!mobileDateScrollRef.current || dateOptions.length === 0) return;

    const isPresetChange = prevPresetRef.current !== selectedPreset;
    const needsInitialScroll = !hasInitialScrolled.current;

    if (!isPresetChange && !needsInitialScroll) return;
    prevPresetRef.current = selectedPreset;
    hasInitialScrolled.current = true;

    requestAnimationFrame(() => {
      const container = mobileDateScrollRef.current;
      if (!container) return;
      const pillButtons = container.querySelectorAll('button');
      if (!pillButtons.length) return;

      let targetIndex = -1;

      if (selectedPreset === 'today' || selectedPreset === 'all') {
        // Scroll to today's pill
        targetIndex = dateOptions.findIndex(d => d.isToday);
      } else {
        // Scroll to the first date of the selected range
        const rangeDates = getDateRangeKeys(selectedPreset);
        if (rangeDates.length > 0) {
          const firstRangeDate = rangeDates[0];
          targetIndex = dateOptions.findIndex(d => d.dateKey === firstRangeDate);
        }
      }

      if (targetIndex >= 0 && pillButtons[targetIndex]) {
        // Manual scroll for Safari compatibility (scrollIntoView options not fully supported)
        const pill = pillButtons[targetIndex] as HTMLElement;
        if (container) {
          container.scrollLeft = pill.offsetLeft - container.offsetLeft;
        }
      }
    });
  }, [dateOptions, selectedPreset]);

  // Track visible month for sticky vertical label
  useEffect(() => {
    if (dateOptions.length > 0) {
      setVisibleMonth(dateOptions[0].date.split(' ')[0].toUpperCase());
    }
  }, [dateOptions]);

  const handleDateScroll = () => {
    const container = mobileDateScrollRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const buttons = container.querySelectorAll<HTMLButtonElement>('button[data-month]');
    for (const btn of buttons) {
      const rect = btn.getBoundingClientRect();
      if (rect.left + rect.width / 2 >= containerRect.left) {
        const month = btn.getAttribute('data-month');
        if (month) setVisibleMonth(month);
        break;
      }
    }
  };

  // Compute the full preset range dates (independent of what's clicked)
  const presetRangeDates = useMemo(() => {
    if (['all', 'today'].includes(selectedPreset)) return [];
    return getDateRangeKeys(selectedPreset);
  }, [selectedPreset]);

  // Notify parent whenever preset range changes
  useEffect(() => {
    onPresetRangeDatesChange?.(presetRangeDates);
  }, [presetRangeDates, onPresetRangeDatesChange]);

  const handlePresetSelect = (preset: DateRangePreset) => {
    if (!datePickerProps) return;
    setSelectedPreset(preset);
    setIsDropdownOpen(false);
    const dates = getDateRangeKeys(preset);
    datePickerProps.onDateChange(dates);
  };

  const handleDateClick = (dateKey: string) => {
    if (!datePickerProps) return;
    const isPresetActive = !['all', 'today'].includes(selectedPreset);
    if (isPresetActive) {
      // Preset range active — select this single date but keep the dropdown preset
      datePickerProps.onDateChange([dateKey]);
    } else {
      // No preset — toggle individual date selection
      const isSelected = datePickerProps.selectedDates.includes(dateKey);
      if (isSelected) {
        datePickerProps.onDateChange(datePickerProps.selectedDates.filter(d => d !== dateKey));
      } else {
        datePickerProps.onDateChange([dateKey]);
      }
    }
  };

  const isDateSelected = (dateKey: string) => {
    if (!datePickerProps) return false;
    return datePickerProps.selectedDates.includes(dateKey);
  };

  // Get current selected date label for the desktop pill
  const selectedDateLabel = useMemo(() => {
    if (!datePickerProps || datePickerProps.selectedDates.length === 0) return 'All Dates';
    const todayStr = new Date().toDateString();
    if (datePickerProps.selectedDates.includes(todayStr)) {
      const today = new Date();
      return `Today — ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    const first = datePickerProps.selectedDates[0];
    try {
      const d = new Date(first);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Selected';
    }
  }, [datePickerProps]);

  // --- DESKTOP EMBEDDED LAYOUT ---
  if (embedded) {
    return (
      <div
        className="border-b"
        style={{
          background: 'rgba(10, 10, 26, 0.97)',
          borderColor: 'rgba(255, 255, 255, 0.06)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.04) inset',
        }}
      >
        {/* === ROW 1: Logo + Date Pills + Search + Hamburger === */}
        <div className="flex items-center gap-3 px-5 py-3">
          {/* WMV Logo — animated GIF; plain <img> so the browser plays it natively */}
          <img
            src="/wmv-logo.gif"
            alt="Where's My Vibe"
            className="flex-shrink-0"
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'contain',
              borderRadius: '50%',
            }}
          />

          {/* Scrollable Date Pills */}
          {showDatePicker && datePickerProps && (
            <div className="flex-1 flex items-center gap-2">
              {/* Date Range Dropdown — outside scroll area */}
              <div ref={dropdownRef} className="relative flex-shrink-0">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="text-xs font-semibold px-3 py-3 rounded-xl transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 bg-purple-600/30 text-purple-300 shadow-[0_0_10px_rgba(124,58,237,0.3)]"
                >
                  {PRESET_LABELS[selectedPreset]}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 rounded-xl overflow-hidden z-[60]"
                    style={{
                      background: 'rgba(20, 20, 40, 0.97)',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                      minWidth: '140px',
                    }}
                  >
                    {(Object.keys(PRESET_LABELS) as DateRangePreset[]).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handlePresetSelect(preset)}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors duration-150"
                        style={{
                          color: selectedPreset === preset ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                          background: selectedPreset === preset ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                        }}
                        onMouseEnter={(e) => { if (selectedPreset !== preset) e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)'; }}
                        onMouseLeave={(e) => { if (selectedPreset !== preset) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {PRESET_LABELS[preset]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Scrollable date pills */}
              <div
                className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
              {dateOptions.map((dateOption, index) => {
                const isClicked = isDateSelected(dateOption.dateKey);
                const isToday = dateOption.isToday;
                const isWeekend = dateOption.isSaturday || dateOption.isSunday;
                const isInRange = presetRangeDates.includes(dateOption.dateKey);
                // Full selection = clicked a specific date (either no preset, or clicked within preset)
                const isFullSelected = isClicked && (!isInRange || datePickerProps!.selectedDates.length < presetRangeDates.length);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(dateOption.dateKey)}
                    className={`flex flex-col items-center px-3 py-1.5 rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 relative ${
                      isFullSelected
                        ? 'bg-purple-600/30 shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                        : 'hover:bg-white/5'
                    }`}
                    style={{
                      ...(isToday && !isClicked && !isInRange ? { border: '1px solid rgba(124,58,237,0.4)' } : {}),
                      ...(isFullSelected ? { border: '1px solid rgba(124,58,237,0.5)' } : {}),
                      ...(!isFullSelected && isInRange ? { border: '1.5px solid rgba(59, 130, 246, 0.6)' } : {}),
                    }}
                  >
                    {isToday && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-bold px-1.5 py-0.5 rounded bg-purple-600 text-white tracking-wider">
                        TODAY
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isFullSelected ? 'text-purple-300'
                        : isWeekend ? 'text-red-400'
                        : 'text-gray-500'
                    }`}>
                      {dateOption.day}
                    </span>
                    <span className={`text-[13px] font-bold ${
                      isFullSelected ? 'text-white'
                        : isToday ? 'text-purple-400'
                        : 'text-gray-400'
                    }`}>
                      {dateOption.date}
                    </span>
                  </button>
                );
              })}
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="w-64 flex-shrink-0">
            <div className="relative cursor-pointer group" onClick={onSearchClick}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-colors group-hover:text-purple-400" />
              <input
                type="text"
                placeholder="Search for your Vibe?"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-500 cursor-pointer focus:outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                }}
                readOnly
                onClick={onSearchClick}
              />
            </div>
          </div>

          {/* List/Map Toggle */}
          {onListToggle && (
            <button
              onClick={onListToggle}
              className="p-2.5 rounded-xl flex-shrink-0 transition-all duration-200"
              style={{
                background: isListView ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isListView ? 'rgba(124, 58, 237, 0.5)' : 'rgba(255,255,255,0.08)'}`,
              }}
              aria-label={isListView ? 'Show map' : 'Show list'}
            >
              {isListView ? (
                <MapIcon className="w-5 h-5 text-purple-300" />
              ) : (
                <List className="w-5 h-5 text-gray-300" />
              )}
            </button>
          )}

          {/* Auth slot */}
          {!hideProfile && (user ? <UserMenu variant="desktop" hideSignOut={hideSignOut} /> : <SignInButton variant="desktop" />)}
        </div>

        {/* === ROW 2: Category Pills === */}
        {showCategoryPills && categoryPillsContent && (
          <div className="px-5 py-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {categoryPillsContent}
          </div>
        )}
      </div>
    );
  }

  // --- MOBILE OVERLAY LAYOUT (original) ---
  return (
    <div ref={mobileNavRef} className="fixed top-1.5 left-1.5 right-1.5 z-50">
      <div
        className={`px-3 md:px-2.5 rounded-2xl relative ${
          showDatePicker ? 'py-2 md:py-1' : 'py-2 md:py-1'
        }`}
        style={darkMode ? {
          background: 'rgba(10, 10, 26, 0.88)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 2px 20px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255,255,255,0.05) inset',
        } : {
          background: 'rgba(255, 255, 255, 0.97)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="flex flex-col gap-1.5">
          {/* ROW 1: Date pills with inline month labels + Dropdown + Search + List toggle */}
          <div className="flex items-center gap-1.5">
            {/* Date pills with inline month separators */}
            {showDatePicker && datePickerProps && (
              <div className="flex-1 min-w-0 flex items-center gap-1" style={{ overflow: 'visible' }}>
                {/* Sticky frozen month label — always visible on left */}
                <span
                  className={`text-[14px] md:text-[11px] font-black uppercase flex-shrink-0 select-none ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}
                  style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}
                >
                  {visibleMonth}
                </span>
                <div ref={mobileDateScrollRef} onScroll={handleDateScroll} className="flex items-center gap-1.5 md:gap-1 overflow-x-auto scrollbar-hide pt-3 md:pt-2 pb-1 md:pb-0.5"
                     style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {dateOptions.map((dateOption, index) => {
                  const isClicked = isDateSelected(dateOption.dateKey);
                  const isToday = dateOption.isToday;
                  const isWeekend = dateOption.isSaturday || dateOption.isSunday;
                  const isInRange = presetRangeDates.includes(dateOption.dateKey);
                  const isFullSelected = isClicked && (!isInRange || datePickerProps!.selectedDates.length < presetRangeDates.length);
                  const currentMonth = dateOption.date.split(' ')[0].toUpperCase();
                  const prevMonth = index > 0 ? dateOptions[index - 1].date.split(' ')[0].toUpperCase() : null;
                  const showMonthLabel = index > 0 && currentMonth !== prevMonth;
                  return (
                    <React.Fragment key={index}>
                      {showMonthLabel && (
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider flex-shrink-0 select-none px-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                          style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}
                        >
                          {currentMonth}
                        </span>
                      )}
                      <button
                        ref={isToday ? todayPillRef : undefined}
                        data-month={currentMonth}
                        onClick={() => handleDateClick(dateOption.dateKey)}
                        className="flex flex-col items-center px-2.5 md:px-1.5 pt-1 pb-1 md:pb-0.5 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 relative"
                        style={{
                          ...(isFullSelected
                            ? { background: darkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0, 0, 0, 0.45)', color: '#fff' }
                            : {}),
                          ...(!isFullSelected && isInRange
                            ? { border: '2px solid rgba(59, 130, 246, 0.6)' }
                            : {}),
                        }}
                      >
                        {isToday && (
                          <span
                            className="absolute -top-1.5 -right-1.5 text-[6px] font-bold px-1 py-px rounded z-10"
                            style={darkMode ? {
                              background: 'rgba(255,255,255,0.18)',
                              color: 'rgba(255,255,255,0.9)',
                              border: '1px solid rgba(255,255,255,0.25)',
                            } : {
                              background: '#7c3aed',
                              color: '#fff',
                            }}
                          >
                            TODAY
                          </span>
                        )}
                        <span className={`text-[10px] md:text-[8px] font-semibold uppercase tracking-wider leading-tight ${
                          isFullSelected ? 'text-white'
                            : isWeekend ? 'text-red-400'
                            : darkMode ? 'text-gray-400' : 'text-gray-400'
                        }`}>
                          {dateOption.day}
                        </span>
                        <span className={`text-[14px] md:text-[11px] font-bold leading-tight ${
                          isFullSelected ? 'text-white'
                            : isWeekend ? 'text-red-400'
                            : darkMode ? 'text-gray-200' : 'text-gray-600'
                        }`}>
                          {dateOption.date.split(' ')[1]}
                        </span>
                      </button>
                    </React.Fragment>
                  );
                })}
                </div>
              </div>
            )}

            {/* Date range dropdown (arrow only) */}
            {showDatePicker && datePickerProps && (
              <div ref={dropdownRef} className="relative flex-shrink-0 z-10">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-8 h-8 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
                  style={{ background: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0, 0, 0, 0.06)' }}
                  aria-label="Date range"
                >
                  <ChevronDown className={`w-4 h-4 md:w-3 md:h-3 transition-transform duration-200 ${darkMode ? 'text-gray-300' : 'text-gray-500'} ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div
                    className="absolute top-full right-0 mt-2 rounded-xl overflow-hidden z-[60]"
                    style={{
                      background: 'rgba(30, 30, 30, 0.97)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                      minWidth: '140px',
                    }}
                  >
                    {(Object.keys(PRESET_LABELS) as DateRangePreset[]).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handlePresetSelect(preset)}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors duration-150"
                        style={{
                          color: selectedPreset === preset ? '#fff' : 'rgba(255,255,255,0.6)',
                          background: selectedPreset === preset ? 'rgba(255,255,255,0.1)' : 'transparent',
                        }}
                        onMouseEnter={(e) => { if (selectedPreset !== preset) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                        onMouseLeave={(e) => { if (selectedPreset !== preset) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {PRESET_LABELS[preset]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search icon */}
            <button
              onClick={onSearchClick}
              className="w-8 h-8 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 flex-shrink-0"
              style={{ background: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0, 0, 0, 0.06)' }}
              aria-label="Search"
            >
              <Search className={`w-4 h-4 md:w-3 md:h-3 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
            </button>

            {/* Home */}
            <button
              onClick={() => {
                const citySegment = pathname.split('/').filter(Boolean)[0] || 'dubai';
                router.push(`/${citySegment}`);
              }}
              className="w-8 h-8 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 flex-shrink-0"
              style={{ background: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0, 0, 0, 0.06)' }}
              aria-label="Home"
            >
              <Home className={`w-4 h-4 md:w-3 md:h-3 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
            </button>

            {/* List/Map toggle */}
            <button
              onClick={() => {
                if (onListToggle) {
                  onListToggle();
                } else {
                  const citySegment = pathname.split('/').filter(Boolean)[0] || 'dubai';
                  router.push(pathname.endsWith('/cards') ? `/${citySegment}` : `/${citySegment}/cards`);
                }
              }}
              className="w-8 h-8 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 flex-shrink-0"
              style={{ background: 'rgba(59, 130, 246, 0.9)' }}
              aria-label={isListView ? 'Show map' : 'Show event list'}
            >
              {isListView ? (
                <MapIcon className="w-4 h-4 md:w-3 md:h-3 text-white" />
              ) : (
                <List className="w-4 h-4 md:w-3 md:h-3 text-white" />
              )}
            </button>

            {/* Auth slot */}
            {!hideProfile && (user ? <UserMenu variant="compact" hideSignOut={hideSignOut} /> : <SignInButton variant="compact" />)}
          </div>

          {/* ROW 2: Category Pills */}
          {showCategoryPills && categoryPillsContent && (
            <div className="-mx-1 px-1">
              {categoryPillsContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNav;
