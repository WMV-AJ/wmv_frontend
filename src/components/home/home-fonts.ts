// One display face per city-home heading, so every section reads as its
// own thing. Home only — the rest of the app stays on Roboto / Open Sans
// (src/app/layout.tsx). Only the first screen's faces are preloaded; the
// rest swap in as the page scrolls.

import {
  Anton,
  Bebas_Neue,
  Instrument_Serif,
  Unbounded,
  Syne,
  Fraunces,
  Space_Grotesk,
  Oswald,
  Bricolage_Grotesque,
  DM_Serif_Display,
  Big_Shoulders,
  Playfair_Display,
  Dela_Gothic_One,
  Archivo_Black,
  Syncopate,
  Young_Serif,
} from 'next/font/google';

const hero = Anton({ weight: '400', subsets: ['latin'], display: 'swap' });
const vibes = Bebas_Neue({ weight: '400', subsets: ['latin'], display: 'swap' });
const idea = Instrument_Serif({ weight: '400', style: ['normal', 'italic'], subsets: ['latin'], display: 'swap' });
const today = Unbounded({ weight: '700', subsets: ['latin'], display: 'swap', preload: false });
const weekend = Syne({ weight: '800', subsets: ['latin'], display: 'swap', preload: false });
const faq = Fraunces({ weight: '600', subsets: ['latin'], display: 'swap', preload: false });
const venue = Space_Grotesk({ weight: '700', subsets: ['latin'], display: 'swap', preload: false });
const live = Oswald({ weight: '600', subsets: ['latin'], display: 'swap', preload: false });
const deals = Bricolage_Grotesque({ weight: '800', subsets: ['latin'], display: 'swap', preload: false });
const areas = DM_Serif_Display({ weight: '400', subsets: ['latin'], display: 'swap', preload: false });
const how = Big_Shoulders({ weight: '800', subsets: ['latin'], display: 'swap', preload: false });
const city = Playfair_Display({ weight: '700', style: ['normal', 'italic'], subsets: ['latin'], display: 'swap', preload: false });
const problem = Dela_Gothic_One({ weight: '400', subsets: ['latin'], display: 'swap', preload: false });
const week = Archivo_Black({ weight: '400', subsets: ['latin'], display: 'swap', preload: false });
const tiles = Syncopate({ weight: '700', subsets: ['latin'], display: 'swap', preload: false });
const mapList = Young_Serif({ weight: '400', subsets: ['latin'], display: 'swap', preload: false });

/** Full heading classes (face + size + case) per section. */
export const HF = {
  hero: `${hero.className} uppercase text-[42px] leading-[0.95] tracking-[-0.005em]`,
  vibes: `${vibes.className} uppercase text-[40px] leading-[0.9] tracking-[0.01em]`,
  vibesName: `${vibes.className} uppercase text-[44px] leading-[0.85] tracking-[0.01em]`,
  idea: `${idea.className} text-[42px] leading-[0.98] tracking-[-0.01em]`,
  today: `${today.className} uppercase text-[24px] leading-[1] tracking-[-0.03em]`,
  weekend: `${weekend.className} uppercase text-[32px] leading-[0.95] tracking-[-0.02em]`,
  faq: `${faq.className} text-[40px] leading-[0.95] tracking-[-0.03em]`,
  venue: `${venue.className} uppercase text-[32px] leading-[0.95] tracking-[-0.045em]`,
  live: `${live.className} uppercase text-[34px] leading-[0.95] tracking-[0.005em]`,
  deals: `${deals.className} uppercase text-[30px] leading-[0.95] tracking-[-0.04em]`,
  areas: `${areas.className} text-[40px] leading-[0.95]`,
  how: `${how.className} uppercase text-[46px] leading-[0.88] tracking-[-0.01em]`,
  city: `${city.className} text-[38px] leading-[0.98] tracking-[-0.02em]`,
  problem: `${problem.className} uppercase text-[30px] leading-[1.02] tracking-[-0.01em]`,
  week: `${week.className} uppercase text-[30px] leading-[0.95] tracking-[-0.03em]`,
  weekNum: `${week.className} text-[56px] leading-none`,
  weekTile: `${week.className} uppercase text-[20px] leading-[1.02] tracking-[-0.02em]`,
  tiles: `${tiles.className} uppercase text-[24px] leading-[1.05] tracking-[-0.02em]`,
  tileName: `${tiles.className} uppercase text-[13px] leading-[1.1] tracking-[0.02em]`,
  mapList: `${mapList.className} text-[32px] leading-[1.05] tracking-[-0.02em]`,
} as const;
