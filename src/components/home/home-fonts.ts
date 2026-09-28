// City-home headings: one editorial face, Instrument Serif — the first line
// upright, the second (or the last word of a one-line heading) in italic.
// Home only; the rest of the app stays on Roboto / Open Sans
// (src/app/layout.tsx).

import { Instrument_Serif } from 'next/font/google';

const serif = Instrument_Serif({ weight: '400', style: ['normal', 'italic'], subsets: ['latin'], display: 'swap' });

const H = `${serif.className} font-normal`;

/** Full heading classes (face + size) per section. */
export const HF = {
  hero: `${H} text-[46px] leading-[0.98] tracking-[-0.015em]`,
  vibes: `${H} text-[40px] leading-[1] tracking-[-0.01em]`,
  vibesName: `${H} text-[42px] leading-[0.9] tracking-[-0.01em]`,
  idea: `${H} text-[42px] leading-[0.98] tracking-[-0.01em]`,
  today: `${H} text-[40px] leading-[1] tracking-[-0.01em]`,
  weekend: `${H} text-[40px] leading-[1] tracking-[-0.01em]`,
  faq: `${H} text-[42px] leading-[0.98] tracking-[-0.01em]`,
  venue: `${H} text-[40px] leading-[0.98] tracking-[-0.01em]`,
  live: `${H} text-[40px] leading-[1] tracking-[-0.01em]`,
  deals: `${H} text-[40px] leading-[1] tracking-[-0.01em]`,
  areas: `${H} text-[40px] leading-[1] tracking-[-0.01em]`,
  how: `${H} text-[42px] leading-[0.98] tracking-[-0.01em]`,
  city: `${H} text-[42px] leading-[0.98] tracking-[-0.01em]`,
  problem: `${H} text-[40px] leading-[0.98] tracking-[-0.01em]`,
  week: `${H} text-[40px] leading-[1] tracking-[-0.01em]`,
  weekNum: `${H} text-[64px] leading-none`,
  weekTile: `${H} text-[26px] leading-[1]`,
  tiles: `${H} text-[40px] leading-[1] tracking-[-0.01em]`,
  tileName: `${H} text-[22px] leading-[1]`,
  step: `${H} text-[34px] leading-[1] tracking-[-0.01em]`,
  mapList: `${H} text-[38px] leading-[1] tracking-[-0.01em]`,
} as const;
