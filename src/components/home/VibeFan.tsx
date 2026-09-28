'use client';

// "Today's vibes" — Home 4's vibe fan, fed with the categories actually on
// today (top 8 by event count, city date). Each card is a real photo from a
// today event in that category (falling back to a local photo); the count
// is computed the way the list filters (any category match, one per event),
// so "See N" lands on N cards. Tapping goes to today's list for that
// category. Below the fan: the selected category (name, count, line, one
// action), then a chip index.

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import EventMedia from '@/components/shared/EventMedia';
import { H4_LABEL, H4_CHIP, TILE_RULE, type CardAccent } from '@/components/shared/card-style';
import { HomeSectionHeader, BTN_PRIMARY } from './HomeParts';
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

export default function VibeFan({ title, items, loading, onExplore }: {
  /** Section heading, e.g. "Today's vibes" or "Tomorrow's vibes". */
  title: string;
  items: VibeFanItem[];
  loading: boolean;
  /** Called on every navigation (the caller routes to item.href). */
  onExplore: (item: VibeFanItem, source: 'fan_card' | 'fan_link') => void;
}) {
  const [selected, setSelected] = useState(0);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
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
                <EventMedia src={v.media.src} poster={v.media.poster} alt={v.label} sizes="175px" fill />
              ) : (
                <Image src={v.fallbackImage} alt={v.label} fill sizes="175px" className="object-cover" />
              )}
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.65))' }} />
              <span className={`${H4_LABEL} absolute left-2.5 bottom-2.5 text-pale`}>{v.label}</span>
            </div>
          );
        })}
      </div>
      <div className={`${H4_LABEL} flex justify-between text-silver-dim`}>
        <span className="tabular-nums">Selected / {String(selected + 1).padStart(2, '0')}—{String(n).padStart(2, '0')}</span>
        <span>Drag to explore ↔</span>
      </div>

      {/* Selected category — name + count, its line, then one clear action */}
      <div className="mt-9 pl-4" style={{ borderLeft: `2px solid ${active.accent.edge}` }}
        data-fan-selected data-cat={active.id} data-count={active.count}>
        <div className="flex items-end justify-between gap-4">
          <h3 className={HF.vibesName} style={{ color: active.accent.text }}>{active.label}</h3>
          <div className="text-right flex-shrink-0">
            <div className={`${HF.vibesName} text-pale tabular-nums`}>{loading ? '—' : active.count}</div>
            <div className={`${H4_LABEL} text-silver-dim mt-1`}>today</div>
          </div>
        </div>
        <p className="text-[15px] leading-relaxed text-silver mt-3">{active.description}</p>
      </div>
      <Link
        href={active.href}
        onClick={() => onExplore(active, 'fan_link')}
        aria-label={`See ${active.count} ${active.label} events`}
        className={`${BTN_PRIMARY} w-full justify-between mt-6`}
      >
        See {active.count} {active.label} {active.count === 1 ? 'event' : 'events'}
        <ArrowUpRight className="w-4 h-4" />
      </Link>

      {/* Index — one row of chips; tap to select */}
      <div className="flex gap-2 overflow-x-auto mt-7 pb-1 -mx-[18px] px-[18px]" style={{ scrollbarWidth: 'none' }} role="group" aria-label="Select a category">
        {items.map((v, index) => {
          const isActive = index === selected;
          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSelected(index)}
              data-fan-chip data-cat={v.id} data-count={v.count}
              className={`${H4_CHIP} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-colors duration-200 active:scale-95`}
              style={isActive
                ? { background: v.accent.edge, color: '#0b0b0b', border: `1px solid ${v.accent.edge}` }
                : { background: v.accent.soft, color: v.accent.text, border: `1px solid ${v.accent.border}` }}
            >
              {v.label}
              <span className="tabular-nums opacity-80">{loading ? '—' : v.count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
