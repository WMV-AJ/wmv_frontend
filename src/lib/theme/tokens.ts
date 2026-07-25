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

// Font stacks (match the next/font variables wired in src/app/layout.tsx).
export const mono = 'var(--font-geist-sans), ui-monospace, monospace';
export const serif = 'var(--font-playfair), Georgia, serif';

/** Max content width of the phone-frame column used across the app. */
export const FRAME_MAX_WIDTH = 430;
