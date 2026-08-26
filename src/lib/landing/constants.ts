import { hash } from './animation-core';

// Phase boundaries (seconds). Compressed 2026-07 from the original 16.5s
// looping cut, then relaxed ~1.5x in 2026-08 (3.4s read as too rushed): the
// intro is a flash of doomscroll-chaos that snaps into the settled map —
// total 4.9s, non-looping, skippable (see useIntroGate). Returning visitors
// render the final frame statically.
// The tail (burst → settle → pills) is stretched further than the front:
// the chaos flash stays punchy, but the landing on the map breathes.
export const DUR = {
  CHAOS_END: 2.0,
  COLLAPSE_END: 2.9,
  BURST_END: 3.8,
  SETTLE_END: 5.2,
  TOTAL: 6.1,
} as const;

export const CANVAS_W = 1080;
export const CANVAS_H = 1920;
export const CENTER_X = CANVAS_W / 2;
export const CENTER_Y = CANVAS_H / 2;

export const VENUE_PALETTE = [
  '#f4c430',
  '#34d399',
  '#f97316',
  '#22d3ee',
  '#f472b6',
  '#ec4899',
  '#f59e0b',
  '#84cc16',
  '#06b6d4',
] as const;

// Bundled branded backdrops (public/landing/cards/*.webp, ~3.5KB each).
// Previously these were loremflickr.com hotlinks — third-party, slow, and
// pointless in a 2s chaos flash. One image per card, no cycling.
export const PHOTO_POOL: Record<string, string[]> = {
  nightclub: ['/landing/cards/nightclub-1.webp', '/landing/cards/nightclub-2.webp', '/landing/cards/nightclub-3.webp'],
  beach: ['/landing/cards/beach-1.webp', '/landing/cards/beach-2.webp', '/landing/cards/beach-3.webp'],
  rooftop: ['/landing/cards/rooftop-1.webp', '/landing/cards/rooftop-2.webp', '/landing/cards/rooftop-3.webp'],
  bar: ['/landing/cards/bar-1.webp', '/landing/cards/bar-2.webp', '/landing/cards/bar-3.webp'],
  restaurant: ['/landing/cards/restaurant-1.webp', '/landing/cards/restaurant-2.webp', '/landing/cards/restaurant-3.webp'],
};

export type CardCategory = keyof typeof PHOTO_POOL;
export type CardVariant = 'story' | 'website';

export interface CardSpec {
  v: string;
  c: CardCategory;
  t: string;
  m: string;
  seed: number;
  r: number;
  ang0: number;
  dir: 1 | -1;
  variant: CardVariant;
}

export const CARDS: CardSpec[] = [
  { v: 'Soho Garden',  c: 'nightclub',  t: 'HOUSE NIGHT',       m: '11PM · DJ Lina',     seed: 7,  r: 360, ang0: 0,   dir:  1, variant: 'story' },
  { v: 'Cove Beach',   c: 'beach',      t: 'SUNSET SESSION',    m: '6PM · Afro House',   seed: 8,  r: 500, ang0: 20,  dir: -1, variant: 'story' },
  { v: 'Iris Rooftop', c: 'rooftop',    t: 'CITY LIGHTS',       m: '9PM · Live Sax',     seed: 9,  r: 400, ang0: 40,  dir:  1, variant: 'website' },
  { v: 'Penrose',      c: 'bar',        t: 'NEGRONI NIGHT',     m: '8PM · 2-4-1',        seed: 10, r: 540, ang0: 60,  dir: -1, variant: 'story' },
  { v: 'BLU Dubai',    c: 'restaurant', t: "CHEF'S TABLE",      m: '7:30 · Tasting',     seed: 11, r: 340, ang0: 80,  dir:  1, variant: 'story' },
  { v: 'White Beach',  c: 'beach',      t: 'AFTER HOURS',       m: '10PM · Tech House',  seed: 12, r: 480, ang0: 100, dir: -1, variant: 'story' },
  { v: 'Cé La Vi',     c: 'rooftop',    t: 'FRIDAY POP',        m: '10PM · DJ Mo',       seed: 13, r: 420, ang0: 120, dir:  1, variant: 'story' },
  { v: 'Treehouse',    c: 'nightclub',  t: 'LADIES NIGHT',      m: '10PM · Free Entry',  seed: 14, r: 560, ang0: 140, dir: -1, variant: 'website' },
  { v: 'Solutions',    c: 'bar',        t: 'JAZZ + BURGERS',    m: '9PM · Live Band',    seed: 15, r: 360, ang0: 160, dir:  1, variant: 'story' },
  { v: 'Bla Bla',      c: 'beach',      t: 'BEACH PARTY',       m: '8PM · Open Bar',     seed: 16, r: 520, ang0: 180, dir: -1, variant: 'story' },
  { v: 'SUSHISAMBA',   c: 'restaurant', t: 'LATIN NIGHT',       m: '9PM · Cocktails',    seed: 17, r: 400, ang0: 200, dir:  1, variant: 'story' },
  { v: 'Drift',        c: 'beach',      t: 'GOLDEN HOUR',       m: '5PM · Champagne',    seed: 18, r: 540, ang0: 230, dir: -1, variant: 'website' },
  { v: 'Blind Tiger',  c: 'bar',        t: 'SPEAKEASY',         m: '10PM · Live Jazz',   seed: 20, r: 480, ang0: 265, dir: -1, variant: 'story' },
  { v: 'Bohemia',      c: 'nightclub',  t: 'TECHNO TUESDAY',    m: '11PM · Underground', seed: 22, r: 560, ang0: 300, dir: -1, variant: 'website' },
  { v: 'Atlantis',     c: 'rooftop',    t: 'SKY HIGH',          m: '10PM · DJ Set',      seed: 24, r: 500, ang0: 335, dir: -1, variant: 'story' },
];
// 12 cards (was 18) — fewer image decodes inside a 2s chaos window.

// Pre-baked dot positions on the Dubai map (normalized 0..1 over the canvas).
// Clusters concentrated on the Palm trunk + Marina; mirrors the reference screenshot.
export const MAP_DOTS: ReadonlyArray<[number, number]> = [
  // Big trunk cluster (the strip)
  [0.45, 0.48], [0.50, 0.50], [0.55, 0.51], [0.52, 0.54], [0.48, 0.56],
  [0.51, 0.58], [0.54, 0.60], [0.49, 0.62], [0.53, 0.64], [0.51, 0.66],
  // Palm crescent right tip
  [0.66, 0.38], [0.70, 0.36],
  // Palm crescent left tip
  [0.22, 0.40], [0.18, 0.42],
  // Mid-trunk
  [0.46, 0.44], [0.50, 0.46],
  // Marina cluster
  [0.42, 0.85], [0.45, 0.87], [0.40, 0.89], [0.46, 0.91],
  // Mainland scattered
  [0.62, 0.72], [0.70, 0.78], [0.78, 0.84],
  [0.30, 0.30],
];

export interface DotSpec {
  finalX: number;
  finalY: number;
  scatterX: number;
  scatterY: number;
  color: string;
  size: number;
  seed: number;
}

// Pre-computed scatter velocity for each dot (deterministic via seed)
export const DOTS: DotSpec[] = MAP_DOTS.map((p, i) => {
  const ang = hash(i * 13 + 1) * Math.PI * 2;
  const speed = 280 + hash(i * 13 + 2) * 280;
  const color = VENUE_PALETTE[i % VENUE_PALETTE.length];
  const size = (22 + hash(i * 13 + 3) * 14) | 0;
  return {
    finalX: p[0] * CANVAS_W,
    finalY: p[1] * CANVAS_H,
    scatterX: CENTER_X + Math.cos(ang) * speed,
    scatterY: CENTER_Y + Math.sin(ang) * speed * 1.1,
    color,
    size,
    seed: i,
  };
});
