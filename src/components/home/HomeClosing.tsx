'use client';

// The home page's closing run, ported from Home 4 and set dark in the
// map/list system: "Good to know" FAQ, the venue call to action and the
// footer (links to every live city and vibe).

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUp, ArrowUpRight, Plus } from 'lucide-react';
import { FAQ_ITEMS } from '@/content/faq';
import { VIBES_DATA } from '@/config/vibes-data';
import { H4_LABEL, TILE_RULE, type CardAccent } from '@/components/shared/card-style';
import { BTN_PRIMARY } from './HomeParts';
import styles from './home.module.css';

const TITLE = 'font-tight font-semibold uppercase text-[34px] leading-[0.92] tracking-[-0.045em] text-pale';

// ── Good to know ──────────────────────────────────────────────────────
export function HomeFaq({ accent, onExpand }: { accent: CardAccent; onExpand: (question: string) => void }) {
  const items = FAQ_ITEMS.slice(0, 4);
  return (
    <section className="px-[18px] pt-14" aria-labelledby="home-faq-title">
      <span className={H4_LABEL} style={{ color: accent.text }}>A few good questions / 01—{String(items.length).padStart(2, '0')}</span>
      <h2 id="home-faq-title" className={`${TITLE} mt-4`}>
        Good to<br />know<span style={{ color: accent.text }}>.</span>
      </h2>
      <div className="mt-6" style={{ borderTop: `1px solid ${TILE_RULE}` }}>
        {items.map((item, i) => (
          <details
            key={item.q}
            className="group"
            style={{ borderBottom: `1px solid ${TILE_RULE}` }}
            onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) onExpand(item.q); }}
          >
            <summary className="grid items-center gap-3 min-h-[64px] py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden"
              style={{ gridTemplateColumns: '24px 1fr 20px' }}>
              <span className={`${H4_LABEL} tabular-nums`} style={{ color: accent.text }}>{String(i + 1).padStart(2, '0')}</span>
              <span className="font-inter font-[550] text-[14px] leading-snug text-pale">{item.q}</span>
              <Plus aria-hidden className="w-4 h-4 text-silver transition-transform duration-200 group-open:rotate-45" />
            </summary>
            <p className="text-[13px] leading-relaxed text-silver pb-4 pl-9 pr-5">{item.a}</p>
          </details>
        ))}
      </div>
      <Link href="/faq" className={`${H4_LABEL} inline-flex items-center gap-3 mt-5 pb-2 text-pale`} style={{ borderBottom: `1px solid ${accent.border}` }}>
        All questions <ArrowUpRight className="w-4 h-4" style={{ color: accent.text }} />
      </Link>
    </section>
  );
}

// ── Make your venue someone's next plan ───────────────────────────────
export function VenueCta({ accent, onClick }: { accent: CardAccent; onClick: () => void }) {
  return (
    <section
      className="px-[18px] pt-14 overflow-hidden"
      aria-labelledby="home-venue-title"
      style={{ '--accent-edge': accent.edge, '--accent-glow': accent.glow } as React.CSSProperties}
    >
      <div className={styles.venueStage} aria-hidden="true">
        <div className={styles.venueSpotlight} />
        <div className={styles.venueFrame} />
        <div className={styles.venuePhoto}>
          <Image src="/home3/live-performance.webp" alt="" fill sizes="230px" className="object-cover" />
        </div>
      </div>
      <span className={`${H4_LABEL} block mt-6`} style={{ color: accent.text }}>To the places that make the night</span>
      <h2 id="home-venue-title" className={`${TITLE} mt-4`}>
        Make your venue<br /><span className="text-silver">someone&rsquo;s next plan.</span>
      </h2>
      <p className="text-[13px] leading-relaxed text-silver mt-3">
        Your stories are probably already on our radar. Make sure your next night gets seen.
      </p>
      <Link href="/list-your-venue" onClick={onClick} className={`${BTN_PRIMARY} mt-5`}>
        List your venue <ArrowUpRight className="w-4 h-4" />
      </Link>
      <p className={`${H4_LABEL} text-silver-dim mt-5`}>WMV / For venues</p>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────
export function HomeFooter({ city, cities, accent, onBackToTop }: {
  city: string;
  cities: Array<[string, string]>;
  accent: CardAccent;
  onBackToTop: () => void;
}) {
  const linkCls = 'text-[13px] text-silver hover:text-pale';
  const colHead = `${H4_LABEL} text-silver-dim mb-1`;
  return (
    <footer
      className="px-[18px] pt-12 mt-14 overflow-hidden"
      style={{ borderTop: `1px solid ${TILE_RULE}`, '--accent-border': accent.border } as React.CSSProperties}
    >
      <div className="flex items-start gap-4">
        <Image src="/home3/wmv-logo-still.png" alt="" width={64} height={64} className="rounded-full flex-shrink-0" />
        <div>
          <span className={H4_LABEL} style={{ color: accent.text }}>Where&rsquo;s My Vibe / After hours</span>
          <p className="font-tight font-semibold uppercase text-[18px] leading-tight tracking-[-0.03em] text-pale mt-2">
            We watch the stories.<br /><span className="text-silver">You pick the vibe.</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-10">
        <nav className="flex flex-col gap-2.5" aria-label="Explore">
          <span className={colHead}>Explore</span>
          <Link href={`/${city}/map`} className={linkCls}>The map</Link>
          <Link href={`/${city}/cards`} className={linkCls}>The list</Link>
          {cities.map(([slug, name]) => (
            <Link key={slug} href={`/${slug}`} className={linkCls}>{name}</Link>
          ))}
        </nav>
        <nav className="flex flex-col gap-2.5" aria-label="Vibes">
          <span className={colHead}>Vibes</span>
          {VIBES_DATA.map((v) => (
            <Link key={v.id} href={`/${city}/vibe/${v.id}`} className={linkCls}>{v.label}</Link>
          ))}
        </nav>
        <nav className="flex flex-col gap-2.5" aria-label="More">
          <span className={colHead}>More</span>
          <Link href="/how-it-works" className={linkCls}>How it works</Link>
          <Link href="/faq" className={linkCls}>FAQ</Link>
          <Link href="/list-your-venue" className={linkCls}>List your venue</Link>
        </nav>
      </div>

      <div className={`${styles.footerMark} font-tight font-semibold uppercase`} aria-hidden="true" data-outline="WMV">
        WMV<span style={{ color: accent.text }}>.</span>
      </div>

      <div className={`${H4_LABEL} flex items-center justify-between gap-4 text-silver-dim mt-6 pt-4`} style={{ borderTop: `1px solid ${TILE_RULE}` }}>
        <span>© {new Date().getFullYear()} Where&rsquo;s My Vibe</span>
        <button type="button" onClick={onBackToTop} className="inline-flex items-center gap-1.5 text-pale">
          Back to top <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
}
