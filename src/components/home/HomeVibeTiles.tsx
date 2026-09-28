'use client';

// "Pick your vibe" (content plan §4): up to six photo tiles per city, ranked
// by how many upcoming events each vibe has (any category match, one per
// event — the list's own counting). Vibes under 10 events are left off so
// no tile opens onto an empty page. Tiles rise in one after another.

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { H4_LABEL, TILE_RULE, type CardAccent } from '@/components/shared/card-style';
import EventMedia from '@/components/shared/EventMedia';
import { HF } from './home-fonts';
import { useRevealOnce } from './useRevealOnce';
import styles from './home.module.css';

export interface VibeTile {
  id: string;
  label: string;
  count: number;
  tagline: string;
  photo: string | null;
  fallbackImage: string;
  accent: CardAccent;
  /** /{city}/cards?date=all&cat=… */
  href: string;
}

export default function HomeVibeTiles({ cityName, tiles, loading, scrollRoot, onPick }: {
  cityName: string;
  tiles: VibeTile[];
  loading: boolean;
  scrollRoot: React.RefObject<HTMLElement | null>;
  onPick: (tile: VibeTile) => void;
}) {
  const gridRef = useRevealOnce<HTMLDivElement>(scrollRoot, 0.15);
  if (!loading && tiles.length === 0) return null;

  return (
    <section className="px-[18px] pt-16 mt-14" aria-labelledby="home-tiles-title" style={{ borderTop: `1px solid ${TILE_RULE}` }}>
      <div className={`${H4_LABEL} flex items-center gap-2.5 text-silver-dim`}>
        <span>Pick your vibe</span>
        <span aria-hidden className="flex-1 h-px" style={{ background: TILE_RULE }} />
      </div>
      <h2 id="home-tiles-title" className={`${HF.tiles} text-pale mt-5`}>What {cityName} is into</h2>
      <p className="text-[15px] leading-relaxed text-silver mt-3">
        Ranked by what&rsquo;s actually on, from tonight through the coming weeks.
      </p>

      <div ref={gridRef} className="grid grid-cols-2 gap-3 mt-7">
        {(loading ? [] : tiles).map((t, i) => (
          <Link
            key={t.id}
            href={t.href}
            onClick={() => onPick(t)}
            className={styles.vibeTile}
            style={{ '--i': i, borderTop: `3px solid ${t.accent.edge}` } as React.CSSProperties}
            data-vibe-tile data-count={t.count}
          >
            <div className={styles.vibeTilePhoto}>
              {t.photo
                ? <EventMedia src={t.photo} alt="" sizes="(max-width: 430px) 46vw, 200px" fill />
                : <Image src={t.fallbackImage} alt="" fill sizes="(max-width: 430px) 46vw, 200px" className="object-cover" />}
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(rgba(0,0,0,0.35), transparent 35%, rgba(11,11,11,0.92) 72%)' }} />
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              <span className="text-[26px] font-semibold text-white tabular-nums leading-none">{t.count}</span>
              <ArrowUpRight className="w-4 h-4 text-white" />
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <div className={HF.tileName} style={{ color: t.accent.text }}>{t.label}</div>
              <p className="text-[11px] leading-snug text-silver mt-1.5 line-clamp-2">{t.tagline}</p>
            </div>
          </Link>
        ))}
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/5]" style={{ background: 'linear-gradient(90deg, #1a1a1a 25%, #262626 50%, #1a1a1a 75%)', backgroundSize: '200% 100%', animation: 'wmv-shimmer 1.4s infinite' }} />
        ))}
      </div>
    </section>
  );
}
