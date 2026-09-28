'use client';

// Option B — "Sphere": the sources spread over a slowly turning globe around
// a glowing WMV core. Live sources are big and bright; ticketing sites are
// smaller and dimmer. Logos pass behind the core as the globe turns (depth →
// scale, opacity, stacking). Positions update by ref each frame — no React
// re-render. Still (a fixed angle) under reduced motion.

import { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { LIVE, Logo, SourceLegend, nextSourcesFor, type Source } from './sources';
import { prefersReducedMotion } from './useRevealOnce';
import styles from './home.module.css';

const R = 128; // sphere radius, px

interface Node extends Source { live: boolean; x: number; y: number; z: number }

/** Even spread over a sphere (Fibonacci lattice); live sources first so they
 *  land around the equator's front. */
function layout(items: Array<Source & { live: boolean }>): Node[] {
  const n = items.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  return items.map((s, i) => {
    const y = 1 - ((i + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    return { ...s, x: Math.cos(t) * r, y: y * 0.92, z: Math.sin(t) * r };
  });
}

export default function SourceSphere({ countryCode }: { countryCode?: string }) {
  const next = useMemo(() => nextSourcesFor(countryCode), [countryCode]);
  const nodes = useMemo(() => {
    // Interleave the live sources through the list so they sit apart.
    const items: Array<Source & { live: boolean }> = [];
    const step = Math.max(1, Math.floor(next.length / LIVE.length));
    let li = 0;
    next.forEach((s, i) => {
      if (i % step === 0 && li < LIVE.length) items.push({ ...LIVE[li++], live: true });
      items.push({ ...s, live: false });
    });
    while (li < LIVE.length) items.push({ ...LIVE[li++], live: true });
    return layout(items);
  }, [next]);

  const refs = useRef<Array<HTMLDivElement | null>>([]);
  useEffect(() => {
    let raf = 0;
    let angle = 0.6;
    const tilt = -0.32; // look slightly down onto the globe
    const place = () => {
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      nodes.forEach((p, i) => {
        const el = refs.current[i];
        if (!el) return;
        const x1 = p.x * ca + p.z * sa;
        const z1 = -p.x * sa + p.z * ca;
        const y2 = p.y * ct - z1 * st;
        const z2 = p.y * st + z1 * ct;
        const depth = (z2 + 1) / 2; // 0 back … 1 front
        const scale = (p.live ? 0.8 : 0.6) + depth * 0.5;
        el.style.transform = `translate(-50%, -50%) translate3d(${x1 * R}px, ${y2 * R}px, 0) scale(${scale})`;
        el.style.opacity = String((p.live ? 0.55 : 0.2) + depth * (p.live ? 0.45 : 0.6));
        el.style.zIndex = String(z2 > 0 ? 20 + Math.round(depth * 10) : Math.round(depth * 10));
        el.style.filter = z2 < -0.2 ? 'blur(1px) grayscale(0.6)' : 'none';
        el.style.setProperty('--label', z2 > 0.15 ? '1' : '0');
      });
    };
    if (prefersReducedMotion()) { place(); return; }
    let last = performance.now();
    const tick = (now: number) => {
      angle += ((now - last) / 1000) * 0.28; // rad/s
      last = now;
      if (!document.hidden) place();
      raf = requestAnimationFrame(tick);
    };
    place();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nodes]);

  return (
    <div className="mt-10">
      <div className={styles.sphere} aria-label="Where's My Vibe at the core of Instagram, Google Maps and ticketing sites">
        {/* Globe lines */}
        <svg className={styles.sphereLines} viewBox="-150 -150 300 300" aria-hidden="true">
          <circle r="136" />
          <ellipse rx="136" ry="42" />
          <ellipse rx="136" ry="96" />
          <ellipse rx="54" ry="136" />
          <ellipse rx="108" ry="136" />
        </svg>

        {nodes.map((p, i) => (
          <div key={`${p.name}-${i}`} ref={(el) => { refs.current[i] = el; }} className={styles.sphereNode}>
            <span className={p.live ? styles.sphereLive : styles.sphereNext}>
              <Logo src={p.logo} name={p.name} size={p.live ? 34 : 24} />
            </span>
            {p.live && <span className={styles.sphereLabel}>{p.name}</span>}
          </div>
        ))}

        {/* Core, between the back and front halves */}
        <div className={styles.sphereCore}>
          <Image src="/home3/wmv-logo-still.png" alt="Where's My Vibe" width={72} height={72} className="rounded-full" />
        </div>
      </div>
      <SourceLegend next={next} />
    </div>
  );
}
