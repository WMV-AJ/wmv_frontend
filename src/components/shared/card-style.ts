'use client';

// Shared type, colour and layout helpers for the event cards, so the map
// tile / expanded sheet (MobileEventCard) and the list page
// (StackedEventCards) cannot drift apart.

import { useLayoutEffect, useRef, useState } from 'react';
import { getCategoryLightBg, mixCategoryTint } from '@/lib/category-mappings';

// Home 4 label idiom: Inter, uppercase, 9-11px, weight 650-750, positive
// tracking. Every label carries `uppercase` explicitly.
export const H4_LABEL = 'text-[10px] uppercase font-[650] tracking-[0.16em]'; // .heroFine 10/650/.16em
export const H4_CHIP  = 'text-[10px] font-bold uppercase tracking-wide'; // start-of-day chip type, deliberately NOT the Home 4 label idiom

// Hairline used between the event and venue blocks and around ruled cells.
export const TILE_RULE = 'rgba(226,227,225,0.14)';

// Offer type → label for the expanded card's Offers cell.
export const DEAL_LABELS: Record<string, string> = {
  ladies_night: 'Ladies Night',
  '2for1': 'Buy 1 Get 1',
  happy_hour: 'Happy Hour',
  discount: 'Discount',
  free_entry: 'Free Entry',
  special_offer: 'Special Offer',
};

// "a | b , high_energy" → "a · b · high energy" for the expanded card's
// list cells (vibes arrive as snake_case slugs).
export function joinList(value: string, separator: string | RegExp): string {
  return value.split(separator).map((part) => part.replace(/_/g, ' ').trim()).filter(Boolean).join(' · ');
}

// Accent category for a card. Mirrors getVenuePrimaryEventCategory in
// @/lib/map/marker-colors — highest-confidence primary first — so the card,
// its filter pill and its map marker all resolve to the same hue.
// event.category is already event_categories[0].primary (stacked-card-adapter),
// so the fallback costs nothing.
export function resolveAccentCategory(event: { event_categories?: unknown; category?: string }): string {
  const cats = (Array.isArray(event.event_categories) ? event.event_categories : []) as Array<{ primary?: string; confidence?: number }>;
  const best = cats
    .filter((c) => c?.primary)
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];
  return best?.primary || event.category || '';
}

export interface CardAccent {
  rgb: [number, number, number];
  /** Pill text, icons, selected rules. */
  text: string;
  /** Pill fill. */
  soft: string;
  /** Pill border. */
  border: string;
  /** 3px top edge of the card. */
  edge: string;
  /** Outer glow on the card. */
  glow: string;
  /** Flat dark card fill, pre-tinted with the category. */
  tileBg: string;
}

export function getCardAccent(category: string): CardAccent {
  const { rgb, hex } = getCategoryLightBg(category);
  const rgba = (a: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
  return {
    rgb,
    text: hex,
    soft: rgba(0.16),
    border: rgba(0.55),
    edge: rgba(0.95),
    glow: rgba(0.30),
    tileBg: mixCategoryTint(category, [12, 12, 28], 0.06),
  };
}

// When the rating block wraps below the venue name, give it its own line and
// drop the "|" that would otherwise lead that line. CSS cannot detect an
// inline wrap, so measure the unwrapped layout: if the rating's top sits
// below the name's last line box, it wrapped. The result is keyed to the
// content, so a new venue measures afresh; a width change or late font swap
// resets it to the unwrapped layout to measure again. Measuring only the
// unwrapped layout avoids a flip-flop where hiding the separator frees just
// enough room for the rating to fit back on line 1.
//
// Put `nameRef` on the venue-name span and `ratingRef` on the rating block;
// they must share a parent. `rerun` re-arms the measurement (e.g. when the
// card is shown).
export function useRatingWrap(contentKey: string, rerun?: unknown) {
  const nameRef = useRef<HTMLSpanElement>(null);
  const ratingRef = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<{ key: string; wrapped: boolean } | null>(null);
  const measured = state?.key === contentKey;
  const wrapped = measured && !!state?.wrapped;

  useLayoutEffect(() => {
    const name = nameRef.current;
    const rating = ratingRef.current;
    const row = name?.parentElement;
    if (!name || !rating || !row) return;
    if (!measured) {
      const lines = name.getClientRects();
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        setState({ key: contentKey, wrapped: rating.getBoundingClientRect().top > lastLine.top + 2 });
      }
    }
    let width = row.clientWidth;
    const remeasure = (): void => setState(null);
    const observer = new ResizeObserver(() => {
      if (row.clientWidth !== width) { width = row.clientWidth; remeasure(); }
    });
    observer.observe(row);
    // A late web-font swap changes line breaks without changing the width.
    document.fonts?.addEventListener('loadingdone', remeasure);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', remeasure);
    };
  }, [contentKey, measured, rerun]);

  return { nameRef, ratingRef, wrapped };
}
