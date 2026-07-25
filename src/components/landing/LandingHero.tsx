'use client';

import { phaseProgress, useTime } from '@/lib/landing/animation-core';
import { Stage, type StageHandle } from '@/lib/landing/Stage';
import { CANVAS_H, CANVAS_W, DUR } from '@/lib/landing/constants';
import { CardsLayer } from './scenes/CardsLayer';
import { ChaosOverlay } from './scenes/ChaosOverlay';
import { DotsLayer } from './scenes/DotsLayer';
import { HUDLayer } from './scenes/HUDLayer';
import { LogoLayer } from './scenes/LogoLayer';
import { MapLayer } from './scenes/MapLayer';

// Inner scene reads time from TimelineContext via useTime() — must live inside <Stage>.
function Scene() {
  const time = useTime();
  const ambientFade = 1 - phaseProgress(time, DUR.BURST_END, DUR.SETTLE_END);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#1f2a30', overflow: 'hidden' }}>
      {/* Deep navy ambience — fades out as the map fades in */}
      <div style={{ position: 'absolute', inset: 0, background: '#0a0a1a', opacity: ambientFade }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 45% at 50% 50%, rgba(124,58,237,0.09), transparent 65%)',
          opacity: ambientFade,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(40% 30%, rgba(236, 72, 153, 0.06), transparent 60%) 0% 0% / cover',
        }}
      />

      {/* Chaos-only dark vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 95%)',
          opacity: 1 - phaseProgress(time, DUR.CHAOS_END - 0.2, DUR.BURST_END),
          pointerEvents: 'none',
        }}
      />

      <MapLayer time={time} />

      {/* Bottom fade so HUD reads cleanly over the map */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 600,
          background:
            'linear-gradient(180deg, rgba(15,20,25,0) 0%, rgba(15,20,25,0.85) 60%, rgba(15,20,25,0.95) 100%)',
          opacity: phaseProgress(time, DUR.SETTLE_END - 0.2, DUR.SETTLE_END + 0.4),
          pointerEvents: 'none',
        }}
      />

      <CardsLayer time={time} />

      {/* Dull black wash above cards, behind logo & text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.38) 60%, rgba(0,0,0,0.52) 100%)',
          opacity: 1 - phaseProgress(time, DUR.CHAOS_END - 0.4, DUR.BURST_END),
          pointerEvents: 'none',
        }}
      />

      <LogoLayer time={time} />
      <ChaosOverlay time={time} />
      <DotsLayer time={time} />
      <HUDLayer time={time} />
    </div>
  );
}

interface LandingHeroProps {
  /** Render the settled final frame statically (returning visitors). */
  settled?: boolean;
  /** Fires when the (non-looping) intro reaches its end. */
  onComplete?: () => void;
  /** Imperative handle for skipTo (skip button). */
  stageRef?: React.Ref<StageHandle>;
}

export function LandingHero({ settled = false, onComplete, stageRef }: LandingHeroProps) {
  return (
    <Stage
      ref={stageRef}
      width={CANVAS_W}
      height={CANVAS_H}
      duration={DUR.TOTAL}
      background="#0a0a1a"
      loop={false}
      initialTime={settled ? DUR.TOTAL : 0}
      onComplete={onComplete}
    >
      <Scene />
    </Stage>
  );
}
