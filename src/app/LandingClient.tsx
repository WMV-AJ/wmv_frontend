'use client';

// Landing page = one screen: the intro animation as the backdrop, with the
// city / sign-in row pinned to the bottom from the first frame.
//
// First visit: the intro plays once (skippable, tap-anywhere on the
// backdrop). Returning visitors and prefers-reduced-motion get the settled
// final frame at once. Nothing scrolls; How it works, FAQ and List your venue
// are linked under the row.
import { useRef } from 'react';
import { LandingIntro, type LandingIntroHandle } from '@/components/landing/LandingIntro';
import { LandingOverlay } from '@/components/landing/LandingOverlay';
import { useIntroGate } from '@/components/landing/useIntroGate';
import { trackEvent } from '@/lib/analytics/track';
import { bodyFont } from '@/lib/theme/tokens';

export default function LandingClient() {
  const { state, markDone } = useIntroGate();
  const introRef = useRef<LandingIntroHandle>(null);

  const skip = () => {
    const at = introRef.current?.getTime() ?? 0;
    trackEvent('intro_skipped', { at_seconds: Math.round(at * 10) / 10 });
    introRef.current?.skipToEnd();
    markDone();
  };

  const playing = state === 'playing';

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        height: '100dvh',
        overflow: 'hidden',
        background: '#000',
      }}
      onClick={playing ? skip : undefined}
    >
      <LandingIntro
        ref={introRef}
        mode={state}
        onComplete={() => {
          trackEvent('intro_completed');
          markDone();
        }}
      />

      {/* Skip pill — visible only while playing */}
      {playing && (
        <button
          onClick={(e) => { e.stopPropagation(); skip(); }}
          style={{
            position: 'absolute', top: 'max(16px, env(safe-area-inset-top))', right: 16, zIndex: 60,
            padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
            background: 'rgba(10,10,26,0.6)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.65)', fontFamily: bodyFont, fontSize: 11, letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Skip →
        </button>
      )}

      <LandingOverlay hideUserMenu={playing} />
    </main>
  );
}
