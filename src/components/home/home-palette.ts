// Neutral greys for the city home — black, dark grey and white behind the
// category accents (which stay as they are). Home only: the shared violet
// `T` in lib/theme/tokens.ts still drives the list, vibe, area and map
// pages. Set as CSS vars on the home <main> (homePaletteVars) so shared
// chrome (HomeMasthead, NavPill) can opt in via var(--home-*, <violet>)
// without changing anywhere else.

import type { CardAccent } from '@/components/shared/card-style';

export const HP = {
  bg: '#0b0b0b',
  surface: '#161616',
  raised: '#202020',
  line: 'rgba(255,255,255,0.12)',
  ink: '#f5f5f5',
  inkMuted: '#b3b3b3',
  inkFaint: '#7a7a7a',
  scrim: 'rgba(11,11,11,0.72)',
  pill: 'rgba(32,32,32,0.97)',
  skeleton: '#1a1a1a',
  skeletonHi: '#262626',
} as const;

export const homePaletteVars = {
  '--home-bg': HP.bg,
  '--home-surface': HP.surface,
  '--home-raised': HP.raised,
  '--home-line': HP.line,
  '--home-ink': HP.ink,
  '--home-ink-muted': HP.inkMuted,
  '--home-pill': HP.pill,
} as React.CSSProperties;

/** The card's flat tile fill: the same 6% category wash as accent.tileBg,
 *  but over neutral grey instead of navy. */
export function homeTileBg(accent: CardAccent): string {
  const mix = (c: number) => Math.round(c * 0.06 + 20 * 0.94);
  return `rgb(${mix(accent.rgb[0])}, ${mix(accent.rgb[1])}, ${mix(accent.rgb[2])})`;
}
