'use client';

// The event tile: the map's collapsed card, shared so the map dock and the
// city home render the identical component. Moved verbatim from
// MobileEventCard's "COLLAPSED PREVIEW CARD" branch; only the bottom-right
// control is supplied by the caller.

import React from 'react';
import { Building2, Clock, Navigation2, Star } from 'lucide-react';
import EventMedia from '@/components/shared/EventMedia';
import { shortenLocation } from '@/lib/format-location';
import { formatDateLabel } from '@/lib/time-utils';
import { displayFont } from '@/lib/theme/tokens';
import { getShortDisplayName } from '@/lib/category-mappings';
import {
  H4_LABEL,
  H4_CHIP,
  resolveAccentCategory,
  getCardAccent,
  useRatingWrap,
} from '@/components/shared/card-style';
import type { EventCardData } from '@/components/shared/event-card-types';

export interface EventTileProps {
  card: EventCardData;
  darkMode?: boolean;
  onClick?: () => void;
  /** Bottom-right control (absolutely positioned by the caller). */
  corner?: React.ReactNode;
  /** Re-arms the rating-wrap measurement (the map passes isExpanded). */
  rerunMeasure?: unknown;
  ref?: React.Ref<HTMLDivElement>;
}

export default function EventTile({ card, darkMode = false, onClick, corner, rerunMeasure, ref }: EventTileProps) {
  const { event, venue } = card;
  const accentCategory = resolveAccentCategory(event);
  const {
    border: accentBorder,
    soft: accentSoft,
    text: accentText,
    edge: accentEdge,
    glow: accentGlow,
    tileBg: accentTileBg,
  } = getCardAccent(accentCategory);
  // Hide the "|" when the rating wraps (see useRatingWrap).
  const {
    nameRef: venueNameRef,
    ratingRef,
    wrapped: ratingWrapped,
  } = useRatingWrap(`${venue.venue_name}|${venue.venue_rating}|${venue.venue_review_count}`, rerunMeasure);

  return (
    <div
      ref={ref}
      className="relative rounded-2xl overflow-hidden cursor-pointer w-full flex flex-col font-inter antialiased"
      style={darkMode ? {
        // Opaque instead of backdrop-blur: the carousel slides these cards
        // over the live map canvas, and backdrop-filter forces a recomposite
        // on every scroll frame (same fix as OfferBanner). The category tint
        // is pre-mixed into this flat fill for the same reason.
        // Explicit floor rather than letting content decide: the carousel
        // already forces a uniform height, and pinning it keeps the measured
        // panel height — and the nav pill derived from it — stable.
        minHeight: 176,   // = the 25% still (≈154px) + padding + borders
        background: accentTileBg,
        // Category colour is a single line across the top edge only.
        borderTop: `3px solid ${accentEdge}`,
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: `0 2px 20px rgba(0, 0, 0, 0.5), 0 0 16px ${accentGlow}`,
      } : {
        background: 'rgba(255, 255, 255, 0.97)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.12)',
      }}
      onClick={onClick}
    >
      {/* Two columns: all copy on the left, a 9:16 still on the right.
          Reading order is event -> when -> what kind -> where. */}
      {/* Bottom-right control, supplied by the caller (the map passes its
          Expand / Close button; the home page an Open arrow). */}
      {corner}

      {/* flex-1 so the row absorbs the stretch, items-center so what is left
          of it splits evenly above and below rather than pooling under the
          address. The carousel stretches every card to the tallest, and the
          tallest is whichever event name wraps to two lines — so a one-line
          card carries ~20px of slack no matter what. Centred, that reads as
          padding; top-aligned it read as a dead band. */}
      {/* Copy left, 25% still right. items-start so text always begins at
          the top of the tile — the carousel stretches every card to the
          tallest, and centring made shorter cards float mid-tile. */}
      <div className="flex gap-3 p-2.5 pb-2 flex-1 min-h-0 items-start">

        {/* ── Left: the copy column ───────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* 1. Event name */}
          {/* Inter at 600 — the venue name's face, not the condensed Inter
              Tight, which was too narrow to read in caps at this size. Caps
              and the extra 50 weight keep it a rank above the venue. */}
          <h3 className={`font-inter font-semibold uppercase text-[15px] leading-tight tracking-[-0.01em] line-clamp-2 ${darkMode ? 'text-pale' : 'text-gray-900'}`}>
            {event.event_name}
          </h3>

          {/* 2. Time / date — always rendered so cards keep a steady height */}
          {/* Same label type as the tags line (H4_LABEL). */}
          <span className={`${H4_LABEL} flex items-center gap-1.5 mt-1 ${darkMode ? 'text-silver' : 'text-gray-500'}`}>
            {/* Tile icons (clock, building, arrow) take the category pill's
                text colour; the rating star keeps its own. */}
            <Clock className="w-3 h-3 flex-shrink-0" style={{ color: accentText }} />
            {event.event_time_display
              || (event.event_time_start
                    ? `${event.event_time_start}${event.event_time_end ? ` – ${event.event_time_end}` : ''}`
                    : formatDateLabel(event.event_date))}
          </span>

          {/* 3. Category, on its own line */}
          {accentCategory && (
            <span
              className={`self-start mt-1 ${H4_CHIP} px-2.5 py-1 rounded-full whitespace-nowrap`}
              style={{ background: accentSoft, color: accentText, border: `1px solid ${accentBorder}` }}
            >
              {getShortDisplayName(accentCategory)}
            </span>
          )}

          {/* 4. Tags — the event's own subtitle, on the next line */}
          {event.event_subtitle && event.event_subtitle !== event.event_name && (
            <span className={`${H4_LABEL} truncate min-w-0 mt-1 ${darkMode ? 'text-silver-dim' : 'text-gray-500'}`}>
              {event.event_subtitle}
            </span>
          )}

          {/* 5 + 6. Venue name and rating share one flow: the name wraps
                 and the rating follows it, the pair capped at two lines. */}
          {/* Rule separating the event from the venue it is at. */}
          <div
            aria-hidden
            className="mt-1.5"
            style={{ borderTop: darkMode ? '1px solid rgba(226,227,225,0.14)' : '1px solid rgba(0,0,0,0.10)' }}
          />

          <div className="mt-1 line-clamp-2 text-[14px] leading-snug">
            <Building2
              aria-hidden
              className="w-3.5 h-3.5 inline align-[-2px] mr-1.5"
              style={{ color: accentText }}
            />
            {/* Inter at 550, home4's `.faqItems summary strong` register —
                the one place that system uses Inter above body size at a mid
                weight. The event name above shares the face; its caps and
                600 weight keep it a rank above the venue. */}
            <span
              ref={venueNameRef}
              className={`${darkMode ? 'font-inter font-[550] text-pale' : 'font-semibold'}`}
              style={darkMode ? undefined : { fontFamily: displayFont, color: '#8a6d0b', letterSpacing: '-0.01em' }}
            >
              {venue.venue_name}
            </span>
            {/* Break opportunity. JSX strips the newline between these two
                spans, so there is NO whitespace where the name ends and the
                nowrap rating block begins — which makes the name's last word
                and the entire rating one unbreakable unit. "JB Arena (Just
                BLR)" then broke after "Just", pushing "BLR)" onto line 2
                beside the stars even though the name fits a single line with
                90px to spare. <wbr> restores the break without adding a space;
                the rule already carries its own margin. */}
            <wbr />
            {/* Wrapped: own line, no separator (see useRatingWrap). */}
            <span ref={ratingRef} className={ratingWrapped ? 'block whitespace-nowrap' : 'whitespace-nowrap'}>
              {!ratingWrapped && (
                <span className={`mx-2 ${darkMode ? 'text-silver-dim/50' : 'text-gray-300'}`}>|</span>
              )}
              <Star className={`w-3.5 h-3.5 inline align-text-bottom ${darkMode ? 'text-silver fill-silver' : 'text-amber-500 fill-amber-500'}`} />
              <span className={`text-[13px] font-bold ml-1 tabular-nums ${darkMode ? 'text-silver' : 'text-amber-500'}`}>{venue.venue_rating}</span>
              <span className={`text-[11px] ml-1 tabular-nums ${darkMode ? 'text-silver-dim' : 'text-gray-400'}`}>({venue.venue_review_count?.toLocaleString()})</span>
            </span>
          </div>

          {/* 7. Address — same rule as the expanded card's header line,
                 allowed to run to two lines in this narrower column. */}
          {/* Address, with the pin back on its own line. Two rows. */}
          <span className={`flex items-start gap-1.5 mt-0.5 text-[12px] leading-snug ${darkMode ? 'text-silver' : 'text-gray-500'}`}>
            <Navigation2 aria-hidden className="w-3.5 h-3.5 flex-shrink-0 mt-px" style={{ color: accentText }} />
            <span className="line-clamp-2 min-w-0">{shortenLocation(venue.venue_location)}</span>
          </span>
        </div>

        {/* ── Right: 9:16 still, 25% of the tile ──────────────────── */}
        {/* 25%, not 30%: at 30% the 9:16 still stood ~183px tall against
            ~154px of copy, leaving a dead band under the address. */}
        <div className="flex-shrink-0 w-[25%] self-start">
          <div
            className="relative w-full rounded-xl overflow-hidden"
            style={{
              // Width-driven: the column is 25% and the height falls out of
              // the ratio. Height-driven aspect-ratio on a stretched flex
              // item is the patchier of the two across browsers.
              aspectRatio: '9 / 16',
              border: darkMode ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const u1 = (event as any).media_url_1 as string | undefined;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const u2 = (event as any).media_url_2 as string | undefined;
              const isVid = (u: string) => /\.(mp4|mov|webm)$/i.test(u);
              // url_1 wins, url_2 is the fallback. If the primary is a video
              // and the sibling is an image, the sibling is the poster frame.
              const primary = u1 || u2;
              const sibling = primary === u1 ? u2 : undefined;
              return (
                <EventMedia
                  src={primary}
                  alt={venue.venue_name}
                  sizes="(max-width: 430px) 30vw, 100px"
                  fill
                  poster={sibling && !isVid(sibling) ? sibling : null}
                />
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
