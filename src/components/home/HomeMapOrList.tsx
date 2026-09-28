'use client';

// "The night's already happening. How do you want to see it?" (content plan
// §5) — two big rectangular choices, framed by mood: the map (primary) with
// pulsing pins, the list with rows that stack in.

import { ArrowUpRight } from 'lucide-react';
import { H4_LABEL, getCardAccent } from '@/components/shared/card-style';
import { HF } from './home-fonts';
import { useRevealOnce } from './useRevealOnce';
import { SectionKickerRule } from './HomeParts';
import styles from './home.module.css';

const PINS = [
  { x: 28, y: 34 },
  { x: 62, y: 22 },
  { x: 74, y: 60 },
  { x: 40, y: 68 },
];

export default function HomeMapOrList({ pinCategories, scrollRoot, onMap, onList }: {
  /** Today's categories — the pins take their colours. */
  pinCategories: string[];
  scrollRoot: React.RefObject<HTMLElement | null>;
  onMap: () => void;
  onList: () => void;
}) {
  const ref = useRevealOnce<HTMLDivElement>(scrollRoot, 0.25);
  const colours = pinCategories.length ? pinCategories.map((c) => getCardAccent(c).text) : ['#f4c430'];

  return (
    <section className="px-[18px] pt-16" aria-labelledby="home-maplist-title">
      <SectionKickerRule>Map or list</SectionKickerRule>
      <h2 id="home-maplist-title" className={`${HF.mapList} text-pale mt-4`}>
        The night&rsquo;s already happening.<br /><em className="italic text-silver">How do you want to see it?</em>
      </h2>
      <p className="text-[15px] leading-relaxed text-silver mt-3">Same events, two ways in. Pick the one that suits tonight.</p>

      <div ref={ref} className={`${styles.mapListCards} grid gap-3 mt-8`}>
        <button type="button" onClick={onMap} data-cta="maplist-map"
          className="relative flex items-stretch text-left wmv-invert min-h-[132px] overflow-hidden">
          <div className="flex-1 p-4 flex flex-col justify-between">
            <span className={`${H4_LABEL} wmv-invert-muted`}>Map</span>
            <span className="text-[19px] font-semibold leading-tight">See what&rsquo;s near you right now</span>
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className={styles.mlMap} aria-hidden="true">
            {PINS.map((p, i) => (
              <span key={i} className={styles.mlPin}
                style={{ left: `${p.x}%`, top: `${p.y}%`, background: colours[i % colours.length], animationDelay: `${i * 0.4}s` }} />
            ))}
          </div>
        </button>

        <button type="button" onClick={onList} data-cta="maplist-list"
          className="relative flex items-stretch text-left text-pale min-h-[132px] overflow-hidden"
          style={{ border: '1px solid var(--wmv-line-strong)' }}>
          <div className="flex-1 p-4 flex flex-col justify-between">
            <span className={`${H4_LABEL} text-silver`}>List</span>
            <span className="text-[19px] font-semibold leading-tight">Scroll every event by date and vibe</span>
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className={styles.mlList} aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className={styles.mlRow} style={{ '--i': i, borderLeftColor: colours[(i + 1) % colours.length] } as React.CSSProperties}>
                <span /><span />
              </span>
            ))}
          </div>
        </button>
      </div>
    </section>
  );
}
