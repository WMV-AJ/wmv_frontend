// City-home headings: the site's heading face, Bree Serif (--font-heading,
// loaded in src/app/layout.tsx). It has no italic, so the emphasised word in a
// heading is set apart by colour only.

const H = 'font-[family-name:var(--font-heading)] font-normal [&_em]:not-italic';

/** Full heading classes (face + size) per section. */
export const HF = {
  hero: `${H} text-[36px] leading-[1.02] tracking-[-0.015em]`,
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
