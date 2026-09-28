// ── SHARED THEME TOKENS ──────────────────────────────────────────────
// The site palette (light by default, dark via .dark) for the city home,
// listing pages and marketing surfaces. Previously each page redeclared its own `T` object
// ([city]/page.tsx, StackedCardsListPage.tsx, HomeMasthead.tsx) — this is
// the canonical copy. New pages import from here; existing pages migrate
// incrementally (do NOT bulk-rewrite the 869-line home page just for this).

export const T = {
  // Themed (globals.css :root = light, .dark = dark). These are CSS var()
  // strings, so they work in inline styles but NOT in string math — don't
  // append hex alpha to them.
  bg: 'var(--wmv-bg)',
  surface: 'var(--wmv-surface)',
  surfaceAlt: 'var(--wmv-raised)',
  overlay: 'var(--wmv-overlay)',

  ink: 'var(--wmv-ink)',
  inkMuted: 'var(--wmv-ink-muted)',
  inkFaint: 'var(--wmv-ink-faint)',
  inkInverse: 'var(--wmv-ink-inverse)',

  line: 'var(--wmv-line-strong)',
  lineFaint: 'var(--wmv-line)',
  crosshair: 'var(--wmv-line)',

  /** Gold for TEXT — darker in light mode so it stays readable. */
  accentInk: 'var(--wmv-accent-ink)',

  // Fixed brand colours (same in both themes; safe for `${T.accent}66`).
  accent: '#f4c430',
  accentSoft: 'rgba(244, 196, 48,0.18)',
  live: '#ef4444',
  pink: '#ec4899',

  chipLight: '#f5f2ed',
} as const;

// ── FONT STACKS ───────────────────────────────────────────────────────
// The two faces wired in src/app/layout.tsx. Nothing else is loaded, and
// no page defines its own — import these everywhere.
//
//   displayFont → Roboto. Headlines, page titles, big numerals.
//   bodyFont    → Open Sans. Copy, UI, labels, everything else.
//
// Named for their role, not their classification: the old `serif` and
// `mono` exports pointed at a sans and a proportional face respectively,
// which is how three dead font names survived in the codebase for months.
export const displayFont = 'var(--font-roboto), system-ui, -apple-system, "Helvetica Neue", sans-serif';
export const bodyFont = 'var(--font-open-sans), system-ui, -apple-system, "Helvetica Neue", sans-serif';

/** Max content width of the phone-frame column used across the app. */
export const FRAME_MAX_WIDTH = 430;
