'use client';

// Action row for the expanded event cards (map sheet and list page), set in
// the same ruled idiom as the date items: each action sits between hairline
// rules, icon over an H4_LABEL caption, no pills or round buttons. The
// primary action is marked the way a selected date is — a 2px top rule and
// caption in the category accent.

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { H4_LABEL, TILE_RULE } from './card-style';

export interface CardAction {
  key: string;
  label: string;
  Icon: LucideIcon;
  onClick: (e: React.MouseEvent) => void;
  primary?: boolean;
}

interface CardActionBarProps {
  actions: CardAction[];
  /** Category accent (card-style getCardAccent().text). */
  accent: string;
  className?: string;
}

export function CardActionBar({ actions, accent, className = '' }: CardActionBarProps): React.ReactElement {
  return (
    // Five actions (with Book) run close to a phone's row width, so the gap
    // tightens; horizontal scroll, as on the date row, is the last resort.
    <div
      className={`flex items-stretch overflow-x-auto ${actions.length > 4 ? 'gap-2' : 'gap-3'} ${className}`}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {actions.map(({ key, label, Icon, onClick, primary }) => (
        <button
          key={key}
          type="button"
          aria-label={label}
          onClick={(e) => { e.stopPropagation(); onClick(e); }}
          // flex-auto: items share the row by content width, so a long
          // caption (DIRECTIONS) never squeezes a short one (CALL).
          className="flex-auto flex flex-col items-start gap-1.5 px-0.5 pt-2 pb-2 text-left whitespace-nowrap transition-opacity active:opacity-60"
          style={{
            // Primary: 1px border + 1px inset shadow = a 2px rule with no
            // layout shift against its 1px neighbours (as renderDateItem).
            borderTop: `1px solid ${primary ? accent : TILE_RULE}`,
            boxShadow: primary ? `inset 0 1px 0 ${accent}` : undefined,
            borderBottom: `1px solid ${TILE_RULE}`,
          }}
        >
          <Icon
            aria-hidden
            className={`w-4 h-4 ${primary ? '' : 'text-silver'}`}
            style={primary ? { color: accent } : undefined}
          />
          <span
            className={`${H4_LABEL} ${primary ? '' : 'text-silver'}`}
            style={primary ? { color: accent } : undefined}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
