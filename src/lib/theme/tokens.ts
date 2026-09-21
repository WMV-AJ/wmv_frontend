// ── SHARED THEME TOKENS ──────────────────────────────────────────────
// The dark violet palette used across the city home, listing pages, and
// marketing surfaces. Previously each page redeclared its own `T` object
// ([city]/page.tsx, StackedCardsListPage.tsx, HomeMasthead.tsx) — this is
// the canonical copy. New pages import from here; existing pages migrate
// incrementally (do NOT bulk-rewrite the 869-line home page just for this).

export const T = {
  bg: '#0a0a14',
  surface: '#14141f',
  surfaceAlt: '#1c1c2a',
  overlay: 'rgba(255,255,255,0.04)',

  ink: '#f5f2ed',
  inkMuted: '#a8a2b8',
  inkFaint: '#5f5a70',
  inkInverse: '#0a0a14',

  line: '#2a2638',
  lineFaint: 'rgba(255,255,255,0.08)',
  crosshair: 'rgba(255,255,255,0.06)',

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
//   displayFont → SUSE Mono. Headlines, page titles, big numerals.
//   bodyFont    → SUSE. Copy, UI, labels, micro-text, everything else.
//
// Named for their role, not their classification: the old `serif` and
// `mono` exports pointed at a sans and a proportional face respectively,
// which is how three dead font names survived in the codebase for months.
export const displayFont = 'var(--font-suse-mono), ui-monospace, SFMono-Regular, Menlo, monospace';
export const bodyFont = 'var(--font-suse), system-ui, -apple-system, sans-serif';

/** Max content width of the phone-frame column used across the app. */
export const FRAME_MAX_WIDTH = 430;
