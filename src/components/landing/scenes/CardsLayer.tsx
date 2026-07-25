'use client';

import { Easing, hash } from '@/lib/landing/animation-core';
import {
  CARDS,
  CENTER_X,
  CENTER_Y,
  DUR,
  PHOTO_POOL,
  type CardSpec,
} from '@/lib/landing/constants';
import { IGStoryCard } from '../IGStoryCard';

// One stable image per card — cycling made sense over a 6.5s chaos phase,
// but at 1.3s it just multiplied decodes. (time param kept for call-site
// compatibility; deliberately unused.)
function photoForCard(card: CardSpec, _time: number): string {
  void _time;
  const pool = PHOTO_POOL[card.c] || PHOTO_POOL.nightclub;
  return pool[card.seed % pool.length];
}

interface ChaosPos {
  x: number;
  y: number;
  rotate: number;
}

function chaosPosition(card: CardSpec, time: number): ChaosPos {
  const omega = ((2 * Math.PI) / 8) * card.dir;
  const angle = (card.ang0 * Math.PI) / 180 + omega * time;
  const jx =
    Math.sin(time * 0.7 + card.seed * 1.3) * 70 +
    Math.cos(time * 1.1 + card.seed * 0.9) * 40;
  const jy =
    Math.cos(time * 0.6 + card.seed * 0.7) * 60 +
    Math.sin(time * 1.3 + card.seed * 1.5) * 35;
  const cx = CENTER_X + Math.cos(angle) * card.r + jx;
  const cy = CENTER_Y + Math.sin(angle) * card.r * 1.18 + jy;
  const baseTilt = (hash(card.seed + 4) - 0.5) * 28;
  const rotate = baseTilt + Math.sin(time * 1.2 + card.seed) * 7;
  return { x: cx, y: cy, rotate };
}

interface CollapsePos extends ChaosPos {
  scale: number;
  opacity: number;
}

function collapsePosition(card: CardSpec, time: number): CollapsePos {
  const span = DUR.COLLAPSE_END - DUR.CHAOS_END;
  const p = Math.max(0, Math.min(1, (time - DUR.CHAOS_END) / span));
  const eased = Easing.easeInCubic(p);
  const src = chaosPosition(card, DUR.CHAOS_END);
  const spiral = eased * Math.PI * 1.5 * card.dir;
  const cosS = Math.cos(spiral);
  const sinS = Math.sin(spiral);
  const dx = (src.x - CENTER_X) * (1 - eased);
  const dy = (src.y - CENTER_Y) * (1 - eased);
  return {
    x: CENTER_X + (dx * cosS - dy * sinS),
    y: CENTER_Y + (dx * sinS + dy * cosS),
    rotate: src.rotate + spiral * 90,
    scale: 1 - 0.85 * eased,
    opacity: 1 - eased * eased,
  };
}

export function CardsLayer({ time }: { time: number }) {
  if (time > DUR.COLLAPSE_END) return null;
  const inCollapse = time >= DUR.CHAOS_END;

  return (
    <>
      {CARDS.map((c, i) => {
        const pos = inCollapse ? collapsePosition(c, time) : chaosPosition(c, time);
        const opacityFromCollapse = inCollapse ? (pos as CollapsePos).opacity : null;
        if (opacityFromCollapse != null && opacityFromCollapse < 0.02) return null;

        const angle = inCollapse
          ? 0
          : Math.atan2(pos.y - CENTER_Y, pos.x - CENTER_X);

        const depthOp = inCollapse
          ? (pos as CollapsePos).opacity
          : 0.65 + (0.35 * (Math.sin(angle) + 1)) / 2;
        const depthScale = inCollapse
          ? (pos as CollapsePos).scale
          : 0.85 + (0.2 * (Math.sin(angle) + 1)) / 2;

        return (
          <IGStoryCard
            key={i}
            venue={c.v}
            category={c.c}
            title={c.t}
            meta={c.m}
            seed={c.seed}
            image={photoForCard(c, time)}
            variant={c.variant}
            x={pos.x}
            y={pos.y}
            width={240}
            height={410}
            rotate={pos.rotate}
            scale={depthScale}
            opacity={depthOp}
          />
        );
      })}
    </>
  );
}
