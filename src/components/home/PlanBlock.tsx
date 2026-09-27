'use client';

// "Plan a night in 2 taps" — the home page's one clear path: pick WHEN, pick
// a VIBE, see it on the list or the map. Chips reuse the map page's own
// controls (the TopNav date pill and the CategoryPills outlined pill), and
// the count on the button is computed with the destination's own filter so
// the number promised is the number you land on.

import { useState } from 'react';
import { ArrowUpRight, Map as MapIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { H4_LABEL, TILE_RULE } from '@/components/shared/card-style';
import { BTN_PRIMARY, BTN_SECONDARY, BTN_SECONDARY_STYLE } from './HomeParts';

export interface PlanWhen {
  /** 'today' | 'tomorrow' | 'YYYY-MM-DD' — also the ?date= value. */
  id: string;
  day: string;   // "SAT"
  date: string;  // "4"
  label: string; // "Tonight", "Tomorrow", "Sat 4 Oct"
  isToday: boolean;
  isWeekend: boolean;
}

export interface PlanVibe {
  id: string;
  label: string;
  Icon: LucideIcon;
  hex: string;
  /** false for vibes that the list/map can't filter (e.g. Rooftops): they
   *  open the vibe page instead and count across all dates. */
  filterable: boolean;
}

export default function PlanBlock({ whens, vibes, countFor, loading = false, onChange, onGo }: {
  whens: PlanWhen[];
  /** While the venue data loads, counts show "—" instead of a false 0. */
  loading?: boolean;
  vibes: PlanVibe[];
  countFor: (whenId: string, vibeId: string | null) => number;
  onChange: (whenId: string, vibeId: string | null) => void;
  onGo: (target: 'cards' | 'map', whenId: string, vibe: PlanVibe | null) => void;
}) {
  const [whenId, setWhenId] = useState(whens[0]?.id ?? 'today');
  const [vibeId, setVibeId] = useState<string | null>(null);
  const vibe = vibes.find((v) => v.id === vibeId) ?? null;
  const when = whens.find((w) => w.id === whenId) ?? whens[0];
  const total = loading ? 0 : countFor(whenId, vibeId);

  const pickWhen = (id: string) => { setWhenId(id); onChange(id, vibeId); };
  const pickVibe = (id: string) => {
    const next = vibeId === id ? null : id;
    setVibeId(next);
    onChange(whenId, next);
  };

  // Two even rows of vibe chips, scrolling sideways as one block (like the
  // map's wrapped CategoryPills).
  const perRow = Math.ceil(vibes.length / 2);
  const rows = [vibes.slice(0, perRow), vibes.slice(perRow)].filter((r) => r.length);

  return (
    <section className="px-[18px] pt-6" aria-labelledby="home-plan-title">
      <div className="rounded-2xl px-4 pt-4 pb-4" style={{ background: '#101019', border: `1px solid ${TILE_RULE}` }}>
        <h2 id="home-plan-title" className="text-[11px] uppercase font-extrabold tracking-[0.18em] text-pale">
          Plan a night in 2 taps
        </h2>
        <p className="text-[13px] leading-relaxed text-silver mt-1">Less scroll. More tonight.</p>

        {/* 1 · When */}
        <p className={`${H4_LABEL} text-silver-dim mt-4`}>1 · When</p>
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }} role="radiogroup" aria-label="When">
          {whens.map((w) => {
            const selected = w.id === whenId;
            return (
              <button
                key={w.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={w.label}
                onClick={() => pickWhen(w.id)}
                className="flex flex-col items-center px-2.5 pt-0.5 pb-0.5 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 relative active:scale-95"
                style={selected ? { background: 'rgba(255,255,255,0.18)', color: '#fff' } : undefined}
              >
                {w.isToday && (
                  <span className="absolute -top-1.5 -right-1.5 text-[6px] font-bold px-1 py-px rounded z-10"
                    style={{ background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.25)' }}>
                    TODAY
                  </span>
                )}
                <span className={`text-[10px] font-semibold uppercase tracking-wider leading-tight ${selected ? 'text-white' : w.isWeekend ? 'text-red-400' : 'text-gray-400'}`}>
                  {w.day}
                </span>
                <span className={`text-[14px] font-bold leading-tight ${selected ? 'text-white' : w.isWeekend ? 'text-red-400' : 'text-gray-200'}`}>
                  {w.date}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2 · Vibe (optional) */}
        <p className={`${H4_LABEL} text-silver-dim mt-4`}>2 · Vibe <span className="normal-case tracking-normal font-normal">(optional)</span></p>
        <div className="overflow-x-auto pb-0.5 mt-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          <div className="flex flex-col gap-1 w-max min-w-full">
            {rows.map((row, r) => (
              <div key={r} className="flex gap-1">
                {row.map((v) => {
                  const selected = v.id === vibeId;
                  const n = loading ? null : countFor(whenId, v.id);
                  const Icon = v.Icon;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => pickVibe(v.id)}
                      className={`flex items-center gap-[3px] px-2 py-[3px] rounded-full text-[11px] font-semibold uppercase whitespace-nowrap flex-shrink-0 transition-all duration-200 active:scale-95 ${selected ? 'shadow-md' : ''} ${n === 0 && !selected ? 'opacity-45' : ''}`}
                      style={{
                        color: selected ? '#ffffff' : v.hex,
                        background: selected ? v.hex : 'rgba(8,8,18,0.92)',
                        border: `1.5px solid ${v.hex}`,
                      }}
                    >
                      <Icon className="w-3 h-3" />
                      <span>
                        {v.label}
                        <span className="opacity-45 font-normal px-[2px]">|</span>
                        {n ?? '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Result + the page's one map/list action */}
        <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${TILE_RULE}` }}>
          <p className={`${H4_LABEL} text-silver`} aria-live="polite">
            <span className="text-pale tabular-nums">{loading ? '—' : total}</span> {total === 1 ? 'event' : 'events'}
            {' · '}{vibe && !vibe.filterable ? 'All dates' : when?.label}
            {vibe ? ` · ${vibe.label}` : ''}
          </p>
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={() => onGo('cards', whenId, vibe)} className={`${BTN_PRIMARY} flex-1`} disabled={loading || total === 0}
              style={loading || total === 0 ? { opacity: 0.5 } : undefined}>
              {loading ? 'Loading tonight…' : `See ${total} on the list`}
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => onGo('map', whenId, vibe)} className={BTN_SECONDARY} style={BTN_SECONDARY_STYLE} aria-label="See on the map">
              <MapIcon className="w-4 h-4" />
              Map
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
