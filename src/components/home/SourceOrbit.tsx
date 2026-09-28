'use client';

// "The idea" visual — WMV at the centre of its sources. The three live
// sources ride an inner ring; the city's ticketing sites drift the other way
// on a dashed outer ring. Every source sends data inward: dots run along a
// beam into the core, which glows as it takes them in. A scan sweeps the
// inner ring. The rings grow in when scrolled into view; all still under
// reduced motion.

import Image from 'next/image';
import { LIVE, Logo, SourceLegend, nextSourcesFor } from './sources';
import { useRevealOnce } from './useRevealOnce';
import styles from './home.module.css';

const INNER = 86;  // px radius, live ring
const OUTER = 146; // px radius, next ring

export default function SourceOrbit({ countryCode, scrollRoot }: {
  countryCode?: string;
  scrollRoot: React.RefObject<HTMLElement | null>;
}) {
  const next = nextSourcesFor(countryCode);
  const ref = useRevealOnce<HTMLDivElement>(scrollRoot, 0.3);
  return (
    <div className="mt-8">
      <div ref={ref} className={styles.orbit} aria-label="Where's My Vibe at the centre of Instagram, Google Maps and ticketing sites">
        <div className={styles.orbitRingOuter} />
        <div className={styles.orbitRingInner}><span className={styles.orbitScan} /></div>

        {/* Outer ring — next (counter-clockwise, slow): faint beams, white data */}
        <div className={`${styles.orbitSpin} ${styles.orbitSpinSlow}`}>
          {next.map((s, i) => {
            const a = (360 / next.length) * i;
            return (
              <div key={s.name}>
                <Beam angle={a} length={OUTER} delay={(i * 0.37) % 2.4} faint />
                <div className={styles.orbitSlot} style={{ transform: `rotate(${a}deg) translateX(${OUTER}px) rotate(${-a}deg)` }}>
                  <div className={styles.orbitUprightSlow}>
                    <span className={styles.orbitNext}><Logo src={s.logo} name={s.name} size={32} /></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Inner ring — live (clockwise): bright beams, gold data */}
        <div className={styles.orbitSpin}>
          {LIVE.map((s, i) => {
            const a = (360 / LIVE.length) * i - 90;
            return (
              <div key={s.name}>
                <Beam angle={a} length={INNER} delay={i * 0.45} />
                <div className={styles.orbitSlot} style={{ transform: `rotate(${a}deg) translateX(${INNER}px) rotate(${-a}deg)` }}>
                  <div className={styles.orbitUpright}>
                    <span className={styles.orbitLive}><Logo src={s.logo} name={s.name} size={40} /></span>
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
          <Image src="/home3/wmv-logo-still.png" alt="Where's My Vibe" width={70} height={70} className="relative rounded-full" />
        </div>
      </div>
      <SourceLegend next={next} />
    </div>
  );
}

/** A spoke from a source to the core with two data dots running inward. */
function Beam({ angle, length, delay, faint }: { angle: number; length: number; delay: number; faint?: boolean }) {
  return (
    <div className={`${styles.orbitBeam} ${faint ? styles.orbitBeamFaint : ''}`} style={{ width: length, transform: `rotate(${angle}deg)` }}>
      <span style={{ animationDelay: `${delay}s` }} />
      <span style={{ animationDelay: `${delay + (faint ? 1.3 : 0.9)}s` }} />
    </div>
  );
}
