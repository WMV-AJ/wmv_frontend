'use client';

import { LandingHero } from '@/components/landing/LandingHero';
import { LandingOverlay } from '@/components/landing/LandingOverlay';

export default function LandingPage() {
  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        overflow: 'hidden',
      }}
    >
      <LandingHero />
      <LandingOverlay />
    </main>
  );
}
