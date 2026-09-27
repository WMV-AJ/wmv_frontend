'use client';

// Map tiles on the home page: the identical EventTile the map dock renders,
// laid out as a swipeable rail (same slot width + snapping as the dock) or a
// short vertical list. Tapping a tile opens the event page.

import { ArrowUpRight } from 'lucide-react';
import EventTile from '@/components/shared/EventTile';
import type { EventCardData } from '@/components/shared/event-card-types';
import { transformVenueDataToStackedCards } from '@/lib/stacked-card-adapter';
import { useRevealOnce } from './useRevealOnce';
import styles from './home.module.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- home rows are raw /api/venues records */

export interface HomeTileItem {
  /** The raw /api/venues row (used for navigation + analytics). */
  row: any;
  card: EventCardData;
}

/** Raw rows → tiles. Rows without an event_id can't open an event page, so
 *  they're skipped (same rule as openEvent). One row per call keeps the
 *  row ↔ card pairing exact. */
export function toTileItems(rows: any[]): HomeTileItem[] {
  const out: HomeTileItem[] = [];
  for (const row of rows) {
    if (!row?.event_id) continue;
    const card = transformVenueDataToStackedCards([row])[0] as unknown as EventCardData | undefined;
    if (card) out.push({ row, card });
  }
  return out;
}

// The map's round bottom-right control, with an "open" arrow instead of the
// expand chevron (on home a tap opens the event page).
function OpenCorner() {
  return (
    <span
      aria-hidden
      className="absolute bottom-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center"
      style={{ background: 'rgba(10, 10, 20, 0.72)', border: '1px solid rgba(255, 255, 255, 0.28)' }}
    >
      <ArrowUpRight className="w-4 h-4 text-white" />
    </span>
  );
}

/** Horizontal rail at the map dock's geometry: 85% slots, snap to centre. */
export function TileRail({ items, onOpen, trailing }: {
  items: HomeTileItem[];
  onOpen: (row: any) => void;
  /** Optional last slot, e.g. an "All N" button. */
  trailing?: React.ReactNode;
}) {
  return (
    <div
      className={`-mx-[18px] px-3 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 ${styles.revealRail}`}
      style={{ scrollbarWidth: 'none', touchAction: 'pan-x pan-y' }}
    >
      {items.map(({ row, card }) => (
        <div key={card.event.id} className="flex-shrink-0 flex w-[85%] snap-center">
          <EventTile card={card} darkMode onClick={() => onOpen(row)} corner={<OpenCorner />} />
        </div>
      ))}
      {trailing && <div className="flex-shrink-0 flex items-center snap-center pr-3">{trailing}</div>}
    </div>
  );
}

/** Short vertical list of full-width tiles, each revealed in turn. */
export function TileList({ items, onOpen }: { items: HomeTileItem[]; onOpen: (row: any) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map(({ row, card }, i) => (
        <div key={card.event.id} className={styles.revealItem} style={{ '--i': i } as React.CSSProperties}>
          <EventTile card={card} darkMode onClick={() => onOpen(row)} corner={<OpenCorner />} />
        </div>
      ))}
    </div>
  );
}

/** Wrapper that reveals its .revealItem / .revealRail children once, when
 *  it first scrolls into view inside the page's scrolling <main>. */
export function RevealBlock({ root, className = '', children }: {
  root: React.RefObject<HTMLElement | null>;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRevealOnce<HTMLDivElement>(root, 0.1);
  return <div ref={ref} className={className}>{children}</div>;
}
