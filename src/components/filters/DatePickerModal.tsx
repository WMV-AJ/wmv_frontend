'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDates: string[];
  onDatesSelect: (dates: string[]) => void;
  availableDates?: string[];
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toKey(d: Date) {
  return d.toDateString();
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  selectedDates,
  onDatesSelect,
}) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      const s = new Set<string>();
      selectedDates.forEach(ds => {
        const d = new Date(ds);
        if (!isNaN(d.getTime())) s.add(d.toDateString());
      });
      setSelected(s);
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const toggleDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const key = toKey(d);
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleApply = () => {
    onDatesSelect(Array.from(selected));
  };

  const todayKey = toKey(today);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 320,
          borderRadius: 20,
          background: 'rgba(12,12,26,0.97)',
          border: '1px solid rgba(212,175,55,0.2)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          padding: '20px 20px 16px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: 15 }}>
            Pick a date
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.4)' }} />
          </button>
        </div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}>
            <ChevronLeft style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.6)' }} />
          </button>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}>{monthLabel}</span>
          <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}>
            <ChevronRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.6)' }} />
          </button>
        </div>

        {/* Day labels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', padding: '2px 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const d = new Date(viewYear, viewMonth, day);
            const key = toKey(d);
            const isSelected = selected.has(key);
            const isToday = key === todayKey;
            const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <button
                key={day}
                onClick={() => !isPast && toggleDay(day)}
                disabled={isPast}
                style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  border: isToday && !isSelected ? '1px solid rgba(212,175,55,0.4)' : '1px solid transparent',
                  background: isSelected
                    ? 'linear-gradient(135deg, #d4af37, #b8952e)'
                    : 'transparent',
                  color: isSelected
                    ? '#0a0a14'
                    : isPast
                    ? 'rgba(255,255,255,0.15)'
                    : isToday
                    ? '#d4af37'
                    : 'rgba(255,255,255,0.8)',
                  fontSize: 12,
                  fontWeight: isSelected || isToday ? 700 : 400,
                  cursor: isPast ? 'default' : 'pointer',
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Selected count */}
        {selected.size > 0 && (
          <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(212,175,55,0.7)', textAlign: 'center' }}>
            {selected.size} date{selected.size > 1 ? 's' : ''} selected
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            onClick={() => setSelected(new Set())}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer',
            }}
          >
            Clear
          </button>
          <button
            onClick={handleApply}
            style={{
              flex: 2, padding: '10px 0', borderRadius: 12,
              background: selected.size > 0 ? 'linear-gradient(135deg, #d4af37, #b8952e)' : 'rgba(212,175,55,0.15)',
              border: '1px solid rgba(212,175,55,0.3)',
              color: selected.size > 0 ? '#0a0a14' : 'rgba(212,175,55,0.4)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Apply{selected.size > 0 ? ` (${selected.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
