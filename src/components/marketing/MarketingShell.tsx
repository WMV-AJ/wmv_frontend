// ── MARKETING SHELL (server component) ───────────────────────────────
// Shared scaffold for the marketing/SEO pages (/how-it-works, /faq,
// /list-your-venue). Keeps the phone-frame mobile-first aesthetic the rest
// of the app uses: a max-430px content column centered on the dark backdrop,
// with a subtle frame border on wide screens, plus a footer whose internal
// links double as crawlable SEO pathways into the money pages.
//
// This is intentionally a SERVER component (no 'use client') so pages built
// on it can export generateMetadata and render static HTML for crawlers.
// Interactive bits (CTA clicks with analytics) live in small client islands
// (see CtaButton.tsx / FaqAccordion).
import Link from 'next/link';
import { T, serif, mono, FRAME_MAX_WIDTH } from '@/lib/theme/tokens';
import { VIBES_DATA } from '@/config/vibes-data';
import { ALL_CITIES, getCityConfig } from '@/config/cities.config';

export default function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: T.bg, display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          width: '100%',
          maxWidth: FRAME_MAX_WIDTH,
          minHeight: '100dvh',
          background: T.bg,
          borderLeft: `1px solid ${T.lineFaint}`,
          borderRight: `1px solid ${T.lineFaint}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Masthead (server-rendered; no auth widget on marketing pages) */}
        <header
          style={{
            padding: '14px 18px 12px',
            borderBottom: `1px solid ${T.line}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/wmv-logo.gif"
              alt="Where's My Vibe"
              width={28}
              height={28}
              style={{ objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: serif,
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 14,
                color: T.ink,
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}
            >
              Where&rsquo;s My Vibe
            </span>
          </Link>
        </header>

        <main style={{ flex: 1 }}>{children}</main>

        <MarketingFooter />
      </div>
    </div>
  );
}

function MarketingFooter() {
  const cities = ALL_CITIES as readonly string[];
  return (
    <footer style={{ borderTop: `1px solid ${T.line}`, padding: '24px 18px 32px', marginTop: 40 }}>
      <div
        style={{
          fontFamily: mono,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: T.inkFaint,
          marginBottom: 12,
        }}
      >
        Explore
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginBottom: 20 }}>
        {cities.map((slug) => {
          const cfg = getCityConfig(slug);
          return (
            <Link key={slug} href={`/${slug}`} style={{ color: T.inkMuted, fontSize: 12, textDecoration: 'none' }}>
              Tonight in {cfg.displayName}
            </Link>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginBottom: 20 }}>
        {VIBES_DATA.map((v) => (
          <Link
            key={v.id}
            href={`/${cities[0]}/vibe/${v.id}`}
            style={{ color: T.inkFaint, fontSize: 12, textDecoration: 'none' }}
          >
            {v.label}
          </Link>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
        <Link href="/how-it-works" style={{ color: T.inkFaint, fontSize: 12, textDecoration: 'none' }}>
          How it works
        </Link>
        <Link href="/faq" style={{ color: T.inkFaint, fontSize: 12, textDecoration: 'none' }}>
          FAQ
        </Link>
        <Link href="/list-your-venue" style={{ color: T.inkFaint, fontSize: 12, textDecoration: 'none' }}>
          List your venue
        </Link>
      </div>
    </footer>
  );
}
