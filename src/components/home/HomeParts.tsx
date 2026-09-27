'use client';

// Building blocks for the city home page, set in the same type system as the
// map tile / expanded card and the list page (see @/components/shared/card-style).
// Data comes in through props — nothing here fetches.

import { useEffect, useRef, useState } from 'react';
import { Building2, ChevronRight, Clock } from 'lucide-react';
import { T } from '@/lib/theme/tokens';
import {
  H4_LABEL,
  TILE_RULE,
  DEAL_LABELS,
  getCardAccent,
} from '@/components/shared/card-style';

/* eslint-disable @typescript-eslint/no-explicit-any -- home rows are raw /api/venues records */

/** Primary category of a raw venue/event row (highest confidence first). */
export function primaryCategory(e: any): string {
  const cats = (Array.isArray(e?.event_categories) ? e.event_categories : []) as Array<{ primary?: string; confidence?: number }>;
  const best = cats.filter((c) => c?.primary).sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];
  return best?.primary || '';
}

// ── Section header ────────────────────────────────────────────────────
// The expanded card's section heading (11px / extrabold / .18em caps) over a
// full-bleed hairline; the count rides beside it in H4_LABEL.
export function HomeSectionHeader({ label, count, onClick }: {
  label: React.ReactNode;
  count?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-baseline gap-2 -mx-[18px] px-[18px] pb-2.5 mb-3 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ borderBottom: `1px solid ${TILE_RULE}` }}
    >
      <h2 className="flex items-center gap-1.5 text-[11px] uppercase font-extrabold tracking-[0.18em] text-pale">
        {label}
      </h2>
      {count != null && <span className={`${H4_LABEL} text-silver-dim whitespace-nowrap`}>{count}</span>}
    </div>
  );
}

// ── Horizontal rail ───────────────────────────────────────────────────
// Right-edge fade + chevron while there is more to scroll; hides at the end
// (or when nothing overflows).
export function HScrollRail({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [showHint, setShowHint] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    const overflowing = el.scrollWidth > el.clientWidth + 8;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    setShowHint(overflowing && !atEnd);
  };

  // Re-measure whenever the rendered children change (data arriving).
  useEffect(() => { update(); });

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={update}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>
      {showHint && (
        <>
          <div
            aria-hidden
            className="absolute top-0 bottom-1 right-0 w-11 pointer-events-none"
            style={{ background: `linear-gradient(to left, ${T.bg}, transparent)` }}
          />
          <button
            aria-label="Scroll right"
            onClick={() => ref.current?.scrollBy({ left: (ref.current?.clientWidth ?? 200) * 0.8, behavior: 'smooth' })}
            className="absolute top-1/2 right-1 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(10,10,20,0.72)', border: '1px solid rgba(255,255,255,0.28)' }}
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </>
      )}
    </div>
  );
}

// ── Deal card (tile shell) ────────────────────────────────────────────
export function DealCard({ event: e, onOpen }: { event: any; onOpen: () => void }) {
  const cat = primaryCategory(e);
  const accent = getCardAccent(cat);
  const deal = Array.isArray(e.deals) && e.deals.length > 0 ? e.deals[0] : null;
  const dealLabel = DEAL_LABELS[deal?.type as string] ?? DEAL_LABELS.special_offer;
  const dealText = deal?.description || (e.special_offers ? String(e.special_offers) : '') || dealLabel;
  return (
    <div
      onClick={onOpen}
      className="snap-start flex flex-col rounded-2xl overflow-hidden px-3 pt-3 pb-3.5 box-border"
      style={{
        flex: '0 0 220px', width: 220, minWidth: 220, maxWidth: 220,
        background: accent.tileBg,
        borderTop: `3px solid ${accent.edge}`,
        borderRight: '1px solid rgba(255,255,255,0.07)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        boxShadow: `0 2px 20px rgba(0,0,0,0.5), 0 0 16px ${accent.glow}`,
        cursor: e.event_id ? 'pointer' : 'default',
      }}
    >
      <span className={`${H4_LABEL}`} style={{ color: accent.text }}>{dealLabel}{deal?.timing ? <span className="text-silver-dim"> · {deal.timing}</span> : null}</span>
      <p className="text-[13px] leading-snug text-pale mt-1.5 line-clamp-3 break-words">{dealText}</p>
      <div className="mt-auto pt-2.5" style={{ borderTop: `1px solid ${TILE_RULE}`, marginTop: 10 }}>
        {e.event_name && (
          <div className="font-inter font-semibold uppercase text-[12px] leading-tight tracking-[-0.01em] text-silver truncate">{e.event_name}</div>
        )}
        <div className="flex items-center gap-1.5 mt-1 min-w-0">
          <Building2 aria-hidden className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accent.text }} />
          <span className="font-inter font-[550] text-[14px] text-pale truncate">{e.name || ''}</span>
        </div>
        {e.event_time && (
          <div className={`${H4_LABEL} flex items-center gap-1.5 mt-1 text-silver`}>
            <Clock aria-hidden className="w-3 h-3 flex-shrink-0" style={{ color: accent.text }} />
            <span className="truncate">{e.event_time}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Numbered row (areas, and anything list-like) ──────────────────────
export function NumberedRow({ index, label, meta, onClick }: {
  index: number;
  label: string;
  meta?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`grid items-center gap-3 py-3 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ gridTemplateColumns: '20px 1fr auto auto', borderBottom: `1px solid ${TILE_RULE}` }}
    >
      <span className={`${H4_LABEL} text-silver-dim tabular-nums`}>{String(index + 1).padStart(2, '0')}</span>
      <span className="font-inter font-[550] text-[15px] leading-snug text-pale">{label}</span>
      {meta != null ? <span className={`${H4_LABEL} text-silver whitespace-nowrap tabular-nums`}>{meta}</span> : <span />}
      <ChevronRight className="w-4 h-4 text-silver-dim flex-shrink-0" />
    </div>
  );
}

// ── Buttons (map/list idiom) ──────────────────────────────────────────
export const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-white text-[#0a0a14] text-[13px] font-semibold whitespace-nowrap transition-transform active:scale-95';
export const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-pale text-[13px] font-semibold whitespace-nowrap transition-transform active:scale-95';
export const BTN_SECONDARY_STYLE: React.CSSProperties = {
  background: 'rgba(90,90,90,0.75)',
  border: '1px solid rgba(255,255,255,0.12)',
};
