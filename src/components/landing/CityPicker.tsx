'use client';

import { useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { ALL_CITIES, CITIES, type CitySlug } from '@/config/cities.config';

interface CityPickerProps {
  value: CitySlug;
  onChange: (city: CitySlug) => void;
}

export function CityPicker({ value, onChange }: CityPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = CITIES[value];

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          flexShrink: 0,
          gap: 6,
          padding: '0 14px',
          height: 44,
          borderRadius: 9999,
          background: 'rgba(15,15,25,0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(255,255,255,0.25)',
          color: '#fff',
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset',
        }}
      >
        <MapPin size={14} style={{ opacity: 0.85 }} />
        <span>{selected.displayName}</span>
        <ChevronDown
          size={14}
          style={{
            opacity: 0.7,
            transition: 'transform 180ms ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            minWidth: 200,
            margin: 0,
            padding: 6,
            listStyle: 'none',
            borderRadius: 12,
            background: 'rgba(15,15,25,0.94)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05) inset',
            zIndex: 100,
          }}
        >
          {/* Only the OTHER cities — the selected one already reads on the
              pill itself, so repeating it (highlighted) above was noise. */}
          {ALL_CITIES.filter((slug) => slug !== value).map((slug) => {
            const cfg = CITIES[slug];
            return (
              <li key={slug}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => {
                    // mousedown fires before blur, so the picker closes cleanly
                    e.preventDefault();
                    onChange(slug);
                    setOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(232,236,242,0.85)',
                    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>{cfg.displayName}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.45)',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {cfg.country}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
