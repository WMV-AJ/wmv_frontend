'use client';

// "Today's vibes" — Home 4's vibe fan, fed with the categories actually on
// today (top 8 by event count, city date). Each card is a real photo from a
// today event in that category (falling back to a local photo); the count
// is computed the way the list filters (any category match, one per event),
// so "See N" lands on N cards. Tapping goes to today's list for that
// category. Below the fan: the list/map's CategoryPills, then the selected category (name,
// count, line, one action).

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import EventMedia from '@/components/shared/EventMedia';
import CategoryPills from '@/components/filters/CategoryPills';
import type { HierarchicalFilterState, Venue } from '@/types';
import { H4_LABEL, TILE_RULE, type CardAccent } from '@/components/shared/card-style';
import { HomeSectionHeader } from './HomeParts';
import { HF } from './home-fonts';
import styles from './home.module.css';

export interface VibeFanItem {
  id: string;
  label: string;
  description: string;
  count: number;
  accent: CardAccent;
  /** A live event image for this vibe, if any. */
  media: { src: string; poster?: string | null } | null;
  /** The day's top sub-categories, e.g. DJ Set · Theme Party. */
  subcategories: string[];
  fallbackImage: string;
  /** Where the category goes, e.g. /dubai/cards?date=today&cat=Club%20Night */
  href: string;
}

export function SectionKicker({ index, total, title }: { index: number; total: number; title: string }) {
  return (
    <div className={`${H4_LABEL} flex items-center gap-2.5 text-silver-dim`}>
      <span className="text-pale tabular-nums">{String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      <span aria-hidden className="w-6 h-px" style={{ background: TILE_RULE }} />
      <span>{title}</span>
    </div>
  );
}

// Everything CategoryPills reads besides eventCategories — unused here.
const PILL_FILTERS: HierarchicalFilterState = {
  selectedPrimaries: { genres: [], vibes: [] },
  selectedSecondaries: { genres: {}, vibes: {} },
  expandedPrimaries: { genres: [], vibes: [] },
  eventCategories: { selectedPrimaries: [], selectedSecondaries: {}, expandedPrimaries: [] },
  attributes: { venue: [], energy: [], timing: [], status: [] },
  selectedAreas: [],
  activeDates: [],
  activeOffers: [],
  searchQuery: '',
};

export default function VibeFan({ title, items, rows, loading, onExplore }: {
  /** Section heading, e.g. "Today's vibes" or "Tomorrow's vibes". */
  title: string;
  items: VibeFanItem[];
  /** The fan day's rows — what the pills count, exactly as the list does. */
  rows: Venue[];
  loading: boolean;
  /** Called on every navigation (the caller routes to item.href). */
  onExplore: (item: VibeFanItem, source: 'fan_card' | 'fan_link') => void;
}) {
  const [selected, setSelected] = useState(0);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const chipRow = useRef<HTMLDivElement>(null);
  // Dragging the fan changes the selection — keep its chip in view. Scrolls
  // the row only (never the page).
  useEffect(() => {
    const row = chipRow.current;
    const chip = row?.querySelector<HTMLElement>('button.shadow-md'); // CategoryPills' selected pill
    const scroller = chip?.closest<HTMLElement>('.overflow-x-auto');
    if (!chip || !scroller) return;
    const left = chip.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft;
    scroller.scrollTo({ left: left - (scroller.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }, [selected]);
  const n = items.length;
  const active = items[selected] ?? items[0];
  if (loading && !active) {
    // Hold the stage's height while today's data loads, so nothing jumps.
    return (
      <section className="px-[18px] pt-6" aria-busy="true">
        <HomeSectionHeader font={HF.vibes} label={title} count="—" />
        <div className={styles.vibeStage} aria-hidden="true">
          {[-1, 1, 0].map((d) => (
            <div key={d} className={styles.fanCard}
              style={{ transform: `translate3d(calc(-50% + ${d * 78}px), ${Math.abs(d) * 14}px, 0) rotate(${d * 7}deg) scale(${d ? 0.76 : 1.04})`, zIndex: 10 - Math.abs(d), background: 'linear-gradient(90deg, #1a1a1a 25%, #262626 50%, #1a1a1a 75%)', backgroundSize: '200% 100%', animation: 'wmv-shimmer 1.4s infinite' }} />
          ))}
        </div>
      </section>
    );
  }
  if (!active) return null;

  const step = (d: number) => setSelected((s) => (s + d + n) % n);


  const onPointerDown = (e: React.PointerEvent) => { dragStart.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = dragStart.current;
    dragStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.25) step(dx < 0 ? 1 : -1);
  };

  return (
    <section
      className="px-[18px] pt-6"
      aria-labelledby="home-vibes-title"
      style={{ '--accent-soft': active.accent.soft } as React.CSSProperties}
    >
      <HomeSectionHeader font={HF.vibes} id="home-vibes-title" label={title} count={loading ? '—' : `${n} ${n === 1 ? 'category' : 'categories'}`} />

      {/* Index — the list/map's own CategoryPills (same categories, labels,
          icons, counts and rows), fed the same day's rows; the selected
          category shows as the selected pill. */}
      <div ref={chipRow} className="mb-5 -mr-[18px]" role="group" aria-label="Select a category">
        <CategoryPills
          filters={{ ...PILL_FILTERS, eventCategories: { selectedPrimaries: [active.id], selectedSecondaries: {}, expandedPrimaries: [] } }}
          onFiltersChange={(f) => {
            const picked = f.eventCategories?.selectedPrimaries.find((c) => c !== active.id);
            const index = picked ? items.findIndex((v) => v.id === picked) : -1;
            if (index >= 0) setSelected(index);
          }}
          venues={rows}
          inlineMode
          variant="outlined"
          wrapPills
          darkMode
        />
      </div>


      {/* Fan — drag sideways to change the vibe; tap the front card to go. */}
      <div
        className={styles.vibeStage}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragStart.current = null; }}
        onDragStart={(e) => e.preventDefault()}
        aria-label="Vibe gallery. Drag sideways to change the selected vibe."
      >
        {items.map((v, index) => {
          const raw = (index - selected + n) % n;
          const delta = raw > n / 2 ? raw - n : raw;
          const depth = Math.abs(delta);
          const isFront = depth === 0;
          return (
            <div
              key={v.id}
              className={styles.fanCard}
              onClick={() => { if (isFront) onExplore(v, 'fan_card'); else setSelected(index); }}
              style={{
                transform: `translate3d(calc(-50% + ${delta * 78}px), ${depth * 14}px, 0) rotate(${delta * 7}deg) scale(${isFront ? 1.04 : Math.max(0.58, 0.8 - depth * 0.045)})`,
                zIndex: 10 - depth,
                border: `3px solid ${v.accent.edge}`,
                boxShadow: isFront
                  ? `0 2px 20px rgba(0,0,0,0.5), 0 0 22px ${v.accent.glow}`
                  : '0 2px 14px rgba(0,0,0,0.45)',
                opacity: depth > 3 ? 0 : 1,
                cursor: 'pointer',
              }}
            >
              {v.media ? (
                <EventMedia src={v.media.src} poster={v.media.poster} alt={v.label} sizes="160px" fill />
              ) : (
                <Image src={v.fallbackImage} alt={v.label} fill sizes="160px" className="object-cover" />
              )}
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.65))' }} />
              <span className={`${H4_LABEL} absolute left-2.5 bottom-2.5 text-pale`}>{v.label}</span>
            </div>
          );
        })}
      </div>

      {/* Selected category — name, sub-categories, line; the square box is
          the action (count + View). */}
      <div className="mt-6 flex items-stretch gap-4" data-fan-selected data-cat={active.id} data-count={active.count}>
        <div className="flex-1 min-w-0 pl-4" style={{ borderLeft: `2px solid ${active.accent.edge}` }}>
          <h3 className={`${HF.vibesName} italic capitalize`} style={{ color: active.accent.text }}>{active.label.toLowerCase()}</h3>
          {active.subcategories.length > 0 && (
            <div className={`${H4_LABEL} text-silver mt-2 leading-relaxed line-clamp-2`} data-fan-subs>
              {active.subcategories.slice(0, 3).join(' · ')}
            </div>
          )}
          <p className="text-[14px] leading-snug text-silver mt-2 line-clamp-2">{active.description}</p>
        </div>
        <Link
          href={active.href}
          onClick={() => onExplore(active, 'fan_link')}
          aria-label={`View ${active.count} ${active.label} events`}
          className="flex-shrink-0 w-[108px] self-start aspect-square flex flex-col justify-between p-3 bg-white text-[#0b0b0b] transition-transform active:scale-[0.97]"
          data-fan-view
        >
          <div className="flex items-start justify-between">
            <span className={`${HF.vibesName} tabular-nums leading-none`}>{loading ? '—' : active.count}</span>
            <ArrowUpRight className="w-5 h-5 mt-1" />
          </div>
          <div>
            <div className={`${H4_LABEL} text-[#0b0b0b]/60`}>{active.count === 1 ? 'event' : 'events'} today</div>
            <div className="text-[12px] font-[750] uppercase tracking-[0.13em] mt-1">View</div>
          </div>
        </Link>
      </div>
    </section>
  );
}
