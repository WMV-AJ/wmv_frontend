// City-home palette — now just names for the site theme tokens (globals.css:
// light by default, .dark for dark), so the home follows the theme toggle.
// --home-* stay defined on the home <main> because home.module.css and a
// few shared components read them.

import type { CardAccent } from '@/components/shared/card-style';

export const HP = {
  bg: 'var(--wmv-bg)',
  surface: 'var(--wmv-surface)',
  raised: 'var(--wmv-raised)',
  line: 'var(--wmv-line)',
  ink: 'var(--wmv-ink)',
  inkMuted: 'var(--wmv-ink-muted)',
  inkFaint: 'var(--wmv-ink-faint)',
  /** Buttons that sit ON photos (heart, rail arrow) — dark in both themes. */
  scrim: 'rgba(11,11,11,0.72)',
  pill: 'var(--wmv-chrome)',
  skeleton: 'var(--wmv-skeleton)',
  skeletonHi: 'var(--wmv-skeleton-hi)',
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

/** The card's flat tile fill: a 6% category wash over the theme surface. */
export function homeTileBg(accent: CardAccent): string {
  return `color-mix(in srgb, rgb(${accent.rgb.join(',')}) 6%, var(--wmv-surface))`;
}
