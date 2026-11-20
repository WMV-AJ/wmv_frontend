// City-home headings: the logo's face, Amatic SC (--font-wordmark, loaded in
// src/app/layout.tsx). It is tall and narrow, so sizes run larger than a
// normal heading face. It has no italic, so the emphasised word in a heading
// is set apart by colour only.

const H = 'font-[family-name:var(--font-wordmark)] font-bold tracking-[0.03em] [&_em]:not-italic';

/** Full heading classes (face + size) per section. */
export const HF = {
  hero: `${H} text-[46px] leading-[0.95]`,
  vibes: `${H} text-[46px] leading-[0.95]`,
  vibesName: `${H} text-[46px] leading-[0.95]`,
  idea: `${H} text-[46px] leading-[0.95]`,
  today: `${H} text-[46px] leading-[0.95]`,
  weekend: `${H} text-[46px] leading-[0.95]`,
  faq: `${H} text-[46px] leading-[0.95]`,
  venue: `${H} text-[46px] leading-[0.95]`,
  live: `${H} text-[46px] leading-[0.95]`,
  deals: `${H} text-[46px] leading-[0.95]`,
  areas: `${H} text-[46px] leading-[0.95]`,
  how: `${H} text-[46px] leading-[0.95]`,
  city: `${H} text-[46px] leading-[0.95]`,
  problem: `${H} text-[46px] leading-[0.95]`,
  week: `${H} text-[46px] leading-[0.95]`,
  weekNum: `${H} text-[64px] leading-none`,
  weekTile: `${H} text-[26px] leading-[1]`,
  tiles: `${H} text-[46px] leading-[0.95]`,
  tileName: `${H} text-[30px] leading-[1]`,
  step: `${H} text-[34px] leading-[1] tracking-[-0.01em]`,
  mapList: `${H} text-[46px] leading-[0.95]`,
} as const;
