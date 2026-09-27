'use client';

// "What kind of night is it?" — Home 4's vibe fan + numbered vibe index,
// ported without Three.js (the static fan composition) and restyled into the
// map/list system. Every number is live: counts come from the same
// matchesVibe() the /[city]/vibe/[id] pages use, and each fan card shows a
// real upcoming event photo for that vibe, falling back to the local
// public/home3 photo.

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import EventMedia from '@/components/shared/EventMedia';
import { H4_LABEL, TILE_RULE, type CardAccent } from '@/components/shared/card-style';
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

export default function VibeFan({ city, cityName, items, loading, kicker, onExplore }: {
  city: string;
  cityName: string;
  items: VibeFanItem[];
  loading: boolean;
  kicker: { index: number; total: number };
  onExplore: (vibeId: string, source: 'fan_card' | 'fan_link') => void;
}) {
  const [selected, setSelected] = useState(0);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const n = items.length;
  const active = items[selected] ?? items[0];
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
      className="px-[18px] pt-8"
      aria-labelledby="home-vibes-title"
      style={{ '--accent-soft': active.accent.soft } as React.CSSProperties}
    >
      <SectionKicker index={kicker.index} total={kicker.total} title="Find your vibe" />
      <h2 id="home-vibes-title" className="font-tight font-semibold uppercase text-[34px] leading-[0.92] tracking-[-0.045em] text-pale mt-4">
        What kind of<br /><span className="text-silver">night is it?</span>
      </h2>
      <p className="text-[13px] leading-relaxed text-silver mt-3">Start with a feeling. We&rsquo;ll take you somewhere.</p>

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
              onClick={() => { if (isFront) onExplore(v.id, 'fan_card'); else setSelected(index); }}
              style={{
                transform: `translate3d(calc(-50% + ${delta * 64}px), ${depth * 12}px, 0) rotate(${delta * 7}deg) scale(${isFront ? 1.04 : Math.max(0.58, 0.8 - depth * 0.045)})`,
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
                <EventMedia src={v.media.src} poster={v.media.poster} alt={v.label} sizes="142px" fill />
              ) : (
                <Image src={v.fallbackImage} alt={v.label} fill sizes="142px" className="object-cover" />
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

      {/* Selected vibe */}
      <div className="mt-4 py-5" style={{ borderTop: `1px solid ${TILE_RULE}`, borderBottom: `1px solid ${TILE_RULE}` }}>
        <span className={`${H4_LABEL}`} style={{ color: active.accent.text }}>
          The feeling / {String(selected + 1).padStart(2, '0')}
          {!loading && <span className="text-silver-dim"> · {active.count} {active.count === 1 ? 'event' : 'events'}</span>}
        </span>
        <h3 className="font-tight font-semibold uppercase text-[30px] leading-[0.95] tracking-[-0.04em] text-pale mt-2">{active.label}</h3>
        <p className="text-[13px] leading-relaxed text-silver mt-2">{active.description}</p>
        <Link
          href={`/${city}/vibe/${active.id}`}
          onClick={() => onExplore(active.id, 'fan_link')}
          aria-label={`Explore ${active.label} in ${cityName}`}
          className={`${H4_LABEL} inline-flex items-center gap-3 mt-4 pb-2 text-pale`}
          style={{ borderBottom: `1px solid ${active.accent.border}` }}
        >
          Explore {active.label}
          <ArrowUpRight className="w-4 h-4" style={{ color: active.accent.text }} />
        </Link>
      </div>

      {/* Numbered index — tap to select, counts live */}
      <div className="grid grid-cols-2 gap-x-4 mt-4" role="group" aria-label="Select a vibe">
        {items.map((v, index) => {
          const isActive = index === selected;
          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSelected(index)}
              className="flex items-center gap-2 min-h-[52px] text-left transition-[padding] duration-200"
              style={{
                borderTop: `1px solid ${isActive ? v.accent.edge : TILE_RULE}`,
                boxShadow: isActive ? `inset 0 1px 0 ${v.accent.edge}` : undefined,
                paddingLeft: isActive ? 6 : 0,
              }}
            >
              <span className={`${H4_LABEL} tabular-nums`} style={{ color: isActive ? v.accent.text : undefined }}>
                <span className={isActive ? '' : 'text-silver-dim'}>{String(index + 1).padStart(2, '0')}</span>
              </span>
              <span className={`font-inter font-[550] text-[15px] flex-1 truncate ${isActive ? 'text-pale' : 'text-silver'}`}>{v.label}</span>
              <span className={`${H4_LABEL} tabular-nums ${v.count === 0 && !loading ? 'text-silver-dim' : ''}`}
                style={v.count > 0 || loading ? { color: v.accent.text } : undefined}>
                {loading ? '—' : v.count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
