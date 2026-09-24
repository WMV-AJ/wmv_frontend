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
//   displayFont → Roboto. Headlines, page titles, big numerals.
//   bodyFont    → Open Sans. Copy, UI, labels, everything else.
//
// Named for their role, not their classification: the old `serif` and
// `mono` exports pointed at a sans and a proportional face respectively,
// which is how three dead font names survived in the codebase for months.
export const displayFont = 'var(--font-roboto), system-ui, -apple-system, "Helvetica Neue", sans-serif';
export const bodyFont = 'var(--font-open-sans), system-ui, -apple-system, "Helvetica Neue", sans-serif';

/** Max content width of the phone-frame column used across the app. */
/**
 * Condensed labels. Archivo Narrow, loaded in layout.tsx as --font-archivo-narrow
 * and exposed to Tailwind as the `font-narrow` utility in globals.css.
 *
 * Every pill, chip and tag in the app uses this rather than the display or body
 * face. Pills are uppercase labels at 10-12px packed into a horizontally
 * scrolling row inside a 430px frame, and a proportional face needs wide
 * tracking to stay legible at that size — which is exactly what pushed the
 * filter row to ~950px. A condensed face reads at 0.02em, so the same labels
 * fit in about 20% less width at a LARGER nominal size.
 *
 * Use PILL_TYPE for anything class-based; use this constant only where the
 * element already carries an inline style object.
 */
export const condensedFont = "var(--font-archivo-narrow), 'Archivo Narrow', 'Arial Narrow', system-ui, sans-serif";

/**
 * The shared pill/chip/tag treatment. Size is deliberately NOT included: pills
 * range from 9px (card micro-tags) to 12px (date row), and each call site keeps
 * its own. Everything else — family, casing, weight, tracking — is shared so
 * the pills read as one family of controls across map, cards and filters.
 */
export const PILL_TYPE = 'font-narrow uppercase font-bold tracking-[0.02em]';

export const FRAME_MAX_WIDTH = 430;
