'use client';

// Building blocks for the city home page, set in the same type system as the
// map tile / expanded card and the list page (see @/components/shared/card-style).
// Data comes in through props — nothing here fetches.

import { useEffect, useRef, useState } from 'react';
import { Building2, ChevronRight, Clock, Heart, Star } from 'lucide-react';
import EventMedia from '@/components/shared/EventMedia';
import { getShortDisplayName } from '@/lib/category-mappings';
import { T } from '@/lib/theme/tokens';
import { HP, homeTileBg } from './home-palette';
import { shortenLocation } from '@/lib/format-location';
import {
  H4_LABEL,
  H4_CHIP,
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

/** "Venue · Area" on one line — the shortest where-is-it for a card. The
 *  venue is omitted when the card's title already IS the venue name. */
export function placeLine(e: any, hasOwnTitle: boolean): string {
  const venue = hasOwnTitle ? (e.name || e.venue || '') : '';
  // Shortest readable area: the neighbourhood (last comma part), e.g.
  // "Dena Bank Colony, Ganganagar" → "Ganganagar".
  const raw = String(e.area || e.address || '');
  const where = shortenLocation(raw.includes(',') ? raw.split(',').map((x: string) => x.trim()).filter(Boolean).pop() || raw : raw, 24);
  return [venue, where].filter(Boolean).join(' · ');
}

// ── Section header ────────────────────────────────────────────────────
// The expanded card's section heading (11px / extrabold / .18em caps) over a
// full-bleed hairline; the count rides beside it in H4_LABEL.
export function HomeSectionHeader({ label, count, onClick, id, font }: {
  label: React.ReactNode;
  /** This section's display face + size (home-fonts.ts HF.*). */
  font: string;
  /** Optional id for the <h2>, so a section can aria-labelledby it. */
  id?: string;
  count?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-end justify-between gap-3 -mx-[18px] px-[18px] pb-3 mb-3.5 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ borderBottom: `1px solid ${TILE_RULE}` }}
    >
      <h2 id={id} className={`flex items-center gap-2 text-pale ${font}`}>
        {typeof label === 'string' ? <ItalicTail text={label} /> : label}
      </h2>
      {count != null && <span className={`${H4_LABEL} text-silver whitespace-nowrap pb-0.5`}>{count}</span>}
    </div>
  );
}

/** "Weekend vibes" → "Weekend *vibes*": upright words, italic last word
 *  (the home's heading style — Instrument Serif, home-fonts.ts). */
export function ItalicTail({ text }: { text: string }) {
  const i = text.trimEnd().lastIndexOf(' ');
  if (i < 0) return <em className="italic">{text}</em>;
  return <>{text.slice(0, i + 1)}<em className="italic text-silver">{text.slice(i + 1)}</em></>;
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
            style={{ background: `linear-gradient(to left, ${HP.bg}, transparent)` }}
          />
          <button
            aria-label="Scroll right"
            onClick={() => ref.current?.scrollBy({ left: (ref.current?.clientWidth ?? 200) * 0.8, behavior: 'smooth' })}
            className="absolute top-1/2 right-1 -translate-y-1/2 w-9 h-9 flex items-center justify-center"
            style={{ background: HP.scrim, border: '1px solid rgba(255,255,255,0.28)' }}
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </>
      )}
    </div>
  );
}

// ── Category pill (identical to the map tile's) ───────────────────────
export function CategoryChip({ category }: { category: string }) {
  if (!category) return null;
  const accent = getCardAccent(category);
  return (
    <span
      className={`inline-block ${H4_CHIP} px-2.5 py-1 rounded-full whitespace-nowrap`}
      style={{ background: accent.soft, color: accent.text, border: `1px solid ${accent.border}` }}
    >
      {getShortDisplayName(category)}
    </span>
  );
}

// ── Like button (the map tile's round button) ─────────────────────────
export function LikeButton({ liked, onToggle, className = '' }: { liked: boolean; onToggle: () => void; className?: string }) {
  return (
    <button
      onClick={(ev) => { ev.stopPropagation(); onToggle(); }}
      aria-label={liked ? 'Unlike' : 'Like'}
      aria-pressed={liked}
      className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ background: HP.scrim, border: '1px solid rgba(255,255,255,0.28)' }}
    >
      <Heart className="w-4 h-4" style={{ color: liked ? T.pink : '#fff', fill: liked ? T.pink : 'transparent' }} />
    </button>
  );
}

// ── Portrait event tile (rails) ───────────────────────────────────────
// Still on top (9:16-ish 3:4 crop, tile border), copy below in the map
// tile's type: pill, Inter caps name, Building2 venue, Clock time.
export function EventTile({ event: e, width, sizes, live, liked, onLike, onOpen }: {
  event: any;
  /** CSS width of the tile, e.g. 130 or '48%'. */
  width: number | string;
  sizes: string;
  live?: boolean;
  liked?: boolean;
  onLike?: () => void;
  onOpen: () => void;
}) {
  const cat = primaryCategory(e);
  const accent = getCardAccent(cat);
  const w = typeof width === 'number' ? `${width}px` : width;
  const small = typeof width === 'number' && width < 150;
  const place = placeLine(e, !!(e.event_name && e.name));
  return (
    <div
      onClick={onOpen}
      className="snap-start"
      style={{ flex: `0 0 ${w}`, width: w, minWidth: w, maxWidth: w, cursor: e.event_id ? 'pointer' : 'default' }}
    >
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-xl"
        style={{ background: homeTileBg(accent), border: '1px solid rgba(255,255,255,0.10)' }}
      >
        {e.media_url_1 && (
          <EventMedia
            src={e.media_url_1}
            mediaType={e.media_type_1}
            poster={e.media_type_2 !== 'video' ? e.media_url_2 : null}
            alt={e.event_name || e.name || ''}
            sizes={sizes}
            fill
            lazyVideo
          />
        )}
        {live && (
          <span className={`absolute top-2 left-2 inline-flex items-center gap-1.5 px-2 py-1 ${H4_CHIP}`}
            style={{ background: T.live, color: '#fff' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: 'wmv-pulse 1.5s infinite' }} />
            Live
          </span>
        )}
        {onLike && <LikeButton liked={!!liked} onToggle={onLike} className="absolute top-2 right-2" />}
      </div>
      {/* Always: category pill → event name → time → venue · area. */}
      <div className="pt-2" data-card="tile">
        {cat && <span data-field="pill"><CategoryChip category={cat} /></span>}
        <h3 data-field="name" className={`font-inter font-semibold uppercase leading-tight tracking-[-0.01em] line-clamp-2 text-pale ${cat ? 'mt-1.5' : ''} ${small ? 'text-[13px]' : 'text-[15px]'}`}>
          {e.event_name || e.name || ''}
        </h3>
        {e.event_time && (
          <div data-field="time" className={`${H4_LABEL} flex items-center gap-1.5 mt-1 text-silver min-w-0`}>
            <Clock aria-hidden className="w-3 h-3 flex-shrink-0" style={{ color: accent.text }} />
            <span className="truncate">{e.event_time}</span>
          </div>
        )}
        {place && (
          <div data-field="place" className="flex items-center gap-1.5 mt-1 min-w-0">
            <Building2 aria-hidden className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accent.text }} />
            <span className={`font-inter font-[550] text-pale truncate ${small ? 'text-[12px]' : 'text-[13px]'}`}>{place}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Numbered event row (Tonight list) ─────────────────────────────────
export function EventRow({ event: e, index, liked, onLike, onOpen }: {
  event: any;
  index: number;
  liked: boolean;
  onLike: () => void;
  onOpen: () => void;
}) {
  const cat = primaryCategory(e);
  const accent = getCardAccent(cat);
  const place = placeLine(e, !!(e.event_name && e.name));
  return (
    <div
      onClick={onOpen}
      className="grid items-start gap-3 py-3"
      style={{ gridTemplateColumns: '20px 72px 1fr auto', borderTop: `1px solid ${TILE_RULE}`, cursor: e.event_id ? 'pointer' : 'default' }}
    >
      <span className={`${H4_LABEL} text-silver-dim tabular-nums`}>{String(index + 1).padStart(2, '0')}</span>
      <div className="relative w-[72px] h-[72px] overflow-hidden rounded-lg"
        style={{ background: homeTileBg(accent), border: '1px solid rgba(255,255,255,0.10)' }}>
        {e.media_url_1 && (
          <EventMedia
            src={e.media_url_1}
            mediaType={e.media_type_1}
            poster={e.media_type_2 !== 'video' ? e.media_url_2 : null}
            alt={e.name || ''}
            sizes="96px"
            fill
            lazyVideo
          />
        )}
      </div>
      {/* Same order as the tiles: pill → name → time (+ rating) → venue · area. */}
      <div className="min-w-0" data-card="row">
        {cat && <span data-field="pill"><CategoryChip category={cat} /></span>}
        <div data-field="name" className="font-inter font-semibold uppercase text-[14px] leading-tight tracking-[-0.01em] text-pale line-clamp-2 mt-1.5">
          {e.event_name || e.name || e.venue}
        </div>
        {(e.event_time || e.rating) && (
          <div data-field="time" className={`${H4_LABEL} flex items-center gap-1.5 mt-1 text-silver flex-wrap`}>
            {e.event_time && <><Clock aria-hidden className="w-3 h-3" style={{ color: accent.text }} />{e.event_time}</>}
            {e.rating && (
              <span className="inline-flex items-center gap-1 normal-case tracking-normal text-[11px] font-bold tabular-nums text-silver-dim">
                <Star className="w-3 h-3 text-silver-dim fill-silver-dim" />
                {e.rating}
              </span>
            )}
          </div>
        )}
        {place && (
          <div data-field="place" className="flex items-center gap-1.5 mt-1 min-w-0">
            <Building2 aria-hidden className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accent.text }} />
            <span className="font-inter font-[550] text-[13px] text-pale truncate">{place}</span>
          </div>
        )}
      </div>
      <LikeButton liked={liked} onToggle={onLike} />
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
        background: homeTileBg(accent),
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
  'inline-flex items-center justify-center gap-2 h-12 px-5 bg-white text-[#0b0b0b] text-[11px] font-[750] uppercase tracking-[0.13em] whitespace-nowrap transition-transform active:scale-[0.98]';
export const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 h-12 px-5 text-pale text-[11px] font-[750] uppercase tracking-[0.13em] whitespace-nowrap transition-transform active:scale-[0.98]';
export const BTN_SECONDARY_STYLE: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(226,227,225,0.42)',
};
