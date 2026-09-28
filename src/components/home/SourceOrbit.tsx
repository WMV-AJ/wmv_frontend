'use client';

// Option A — "Orbit": WMV glowing at the centre; the three live sources ride
// an inner ring with beams into the core; the ticketing sites drift the
// other way on a dashed outer ring. Logos stay upright as the rings turn.

import Image from 'next/image';
import { LIVE, Logo, SourceLegend, nextSourcesFor } from './sources';
import styles from './home.module.css';

const INNER = 88;  // px radius, live ring
const OUTER = 150; // px radius, next ring

export default function SourceOrbit({ countryCode }: { countryCode?: string }) {
  const next = nextSourcesFor(countryCode);
  return (
    <div className="mt-10">
      <div className={styles.orbit} aria-label="Where's My Vibe at the centre of Instagram, Google Maps and ticketing sites">
        <div className={styles.orbitRingOuter} />
        <div className={styles.orbitRingInner} />

        {/* Outer ring — next (counter-clockwise, slow) */}
        <div className={`${styles.orbitSpin} ${styles.orbitSpinSlow}`}>
          {next.map((s, i) => {
            const a = (360 / next.length) * i;
            return (
              <div key={s.name} className={styles.orbitSlot} style={{ transform: `rotate(${a}deg) translateX(${OUTER}px) rotate(${-a}deg)` }}>
                <div className={styles.orbitUprightSlow}>
                  <span className={styles.orbitNext}><Logo src={s.logo} name={s.name} size={26} /></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Inner ring — live (clockwise), with beams into the core */}
        <div className={styles.orbitSpin}>
          {LIVE.map((s, i) => {
            const a = (360 / LIVE.length) * i - 90;
            return (
              <div key={s.name}>
                <div className={styles.orbitBeam} style={{ width: INNER, transform: `rotate(${a}deg)` }}>
                  <span style={{ animationDelay: `${i * 0.5}s` }} />
                </div>
                <div className={styles.orbitSlot} style={{ transform: `rotate(${a}deg) translateX(${INNER}px) rotate(${-a}deg)` }}>
                  <div className={styles.orbitUpright}>
                    <span className={styles.orbitLive}><Logo src={s.logo} name={s.name} size={34} /></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Core */}
        <div className={styles.orbitCore}>
          <span className={styles.orbitPulse} />
          <span className={styles.orbitPulse} style={{ animationDelay: '1.2s' }} />
          <Image src="/home3/wmv-logo-still.png" alt="Where's My Vibe" width={68} height={68} className="relative rounded-full" />
        </div>
      </div>
      <SourceLegend next={next} />
    </div>
  );
}
