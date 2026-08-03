'use client';

// Landing page = fast intro + marketing home on one route.
//
// First visit: the 3.4s intro plays (skippable, tap-anywhere), body scroll is
// locked, and on completion the page releases into a scrollable marketing
// home whose hero background IS the settled final frame (map + dots + HUD).
// Returning visitors and prefers-reduced-motion render the settled frame
// statically and can scroll immediately.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingOverlay } from '@/components/landing/LandingOverlay';
import { useIntroGate } from '@/components/landing/useIntroGate';
import type { StageHandle } from '@/lib/landing/Stage';
import { DUR } from '@/lib/landing/constants';
import { DEFAULT_CITY, getCityConfig, type CitySlug } from '@/config/cities.config';
import { VIBES } from '@/config/vibes';
import EventMedia from '@/components/shared/EventMedia';
import { trackEvent } from '@/lib/analytics/track';
import { isUpcomingInCity } from '@/lib/city-date';
import { SourceChips, PipelineTimeline, StoryCollage } from '@/components/marketing/visuals';
import { T, serif, mono, FRAME_MAX_WIDTH } from '@/lib/theme/tokens';

export default function LandingClient() {
  const { state, markDone } = useIntroGate();
  const stageRef = useRef<StageHandle>(null);
  const [city, setCity] = useState<CitySlug>(DEFAULT_CITY);

  // Remember the last city the visitor actually browsed (written by the city
  // home) so the marketing content follows them on return visits.
  useEffect(() => {
    try {
      const last = window.localStorage.getItem('wmv_last_city');
      if (last) setCity(last);
    } catch { /* ignore */ }
  }, []);

  const skip = () => {
    const at = stageRef.current?.getTime() ?? 0;
    trackEvent('intro_skipped', { at_seconds: Math.round(at * 10) / 10 });
    stageRef.current?.skipTo(DUR.TOTAL);
    markDone();
  };

  const playing = state === 'playing';

  return (
    // The app's globals lock html/body to the viewport (overflow: hidden), so
    // this page owns its scrolling: fixed full-viewport container, scrollable
    // once the intro settles (which doubles as the intro scroll-lock).
    <main
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: playing ? 'hidden' : 'auto',
        WebkitOverflowScrolling: 'touch',
        background: T.bg,
      }}
    >
      {/* ── HERO: the animation canvas is the backdrop ─────────────── */}
      <section
        style={{ position: 'relative', height: '100dvh', overflow: 'hidden', background: '#000' }}
        onClick={playing ? skip : undefined}
      >
        <LandingHero
          settled={state === 'done'}
          stageRef={stageRef}
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
              background: 'rgba(10,10,26,0.6)', border: `1px solid ${T.lineFaint}`,
              color: T.inkMuted, fontFamily: mono, fontSize: 11, letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Skip →
          </button>
        )}

        <LandingOverlay onCityChange={setCity} />

        {/* Scroll cue once settled */}
        {state === 'done' && (
          <div
            style={{
              position: 'absolute', bottom: 88, left: '50%', transform: 'translateX(-50%)',
              color: T.inkFaint, fontFamily: mono, fontSize: 10, letterSpacing: '0.2em',
              textTransform: 'uppercase', pointerEvents: 'none',
              animation: 'wmv-bob 2s ease-in-out infinite',
            }}
          >
            ↓ there&rsquo;s more
          </div>
        )}
        <style>{`@keyframes wmv-bob { 0%,100% { transform: translate(-50%, 0) } 50% { transform: translate(-50%, 6px) } }`}</style>
      </section>

      {/* ── MARKETING SECTIONS ─────────────────────────────────────── */}
      <div
        style={{
          maxWidth: FRAME_MAX_WIDTH, margin: '0 auto', padding: '0 18px',
          opacity: playing ? 0 : 1, transition: 'opacity 0.6s ease',
        }}
      >
        <ProblemSection />
        <HowItWorksMini />
        <TonightStrip city={city} />
        <VibeTiles city={city} />
        <DualCta city={city} />
        <VenueOwnersBand />
        <LandingFooter />
      </div>
    </main>
  );
}

/* ── Section label helper ─────────────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
      color: T.inkFaint, marginBottom: 14,
    }}>{children}</div>
  );
}

/* ── 2. Problem → solution ────────────────────────────────────────── */
function ProblemSection() {
  return (
    <section style={{ padding: '56px 0 40px', borderBottom: `1px solid ${T.line}`, position: 'relative' }}>
      <Label>The problem</Label>
      <h2 style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 30, lineHeight: 1.15, color: T.ink, margin: 0 }}>
        47 stories deep<br />and still no plan.
      </h2>
      <div style={{ margin: '24px 0 22px' }}>
        <StoryCollage />
      </div>
      <p style={{ color: T.inkMuted, fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>
        Every venue posts tonight&rsquo;s lineup to Instagram — and Instagram buries it.
        You scroll, you screenshot, you text the group chat, and by the time everyone
        agrees, the guestlist closed.
      </p>
      <p style={{ color: T.ink, fontSize: 14, lineHeight: 1.6, marginTop: 12, fontWeight: 600 }}>
        We watch every venue&rsquo;s stories so you don&rsquo;t have to. One map.
        Tonight only. Zero scroll.
      </p>
    </section>
  );
}

/* ── 3. How it works mini — sources + connected pipeline ──────────── */
function HowItWorksMini() {
  const router = useRouter();
  return (
    <section style={{ padding: '40px 0', borderBottom: `1px solid ${T.line}` }}>
      <Label>What we scan, daily</Label>
      <div style={{ marginBottom: 26 }}>
        <SourceChips compact />
      </div>
      <Label>How it works</Label>
      <PipelineTimeline
        steps={[
          { n: '01', title: 'We scan', color: '#ec4899', desc: 'Instagram stories, posts, ticketing feeds and venue sites — refreshed daily.' },
          { n: '02', title: 'AI sorts', color: '#eab308', desc: 'Every event gets a vibe: brunch, club night, rooftop, ladies night, live music…' },
          { n: '03', title: 'You go', color: '#f4c430', desc: 'One live map and list of what’s actually on tonight. Pick, tap, out the door.' },
        ]}
      />
      <button
        onClick={() => {
          trackEvent('marketing_cta_click', { cta: 'how_it_works', source: 'landing' });
          router.push('/how-it-works');
        }}
        style={{
          background: 'none', border: 'none', color: T.accent, fontFamily: mono,
          fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer', padding: 0,
        }}
      >
        The full story →
      </button>
    </section>
  );
}

/* ── 4. Live tonight strip (real data, lazy-fetched) ──────────────── */
/* eslint-disable @typescript-eslint/no-explicit-any */
function TonightStrip({ city }: { city: CitySlug }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement | null>(null);
  const [events, setEvents] = useState<any[] | null>(null);
  const fetchedForRef = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const load = () => {
      if (fetchedForRef.current === city) return;
      fetchedForRef.current = city;
      fetch(`/api/venues?city=${encodeURIComponent(city)}`)
        .then((r) => r.json())
        .then((j) => {
          if (!j.success || !Array.isArray(j.data)) return;
          const seen = new Set<string>();
          const list = j.data.filter((v: any) => {
            if (!v.event_date || !v.event_id) return false;
            if (!isUpcomingInCity(v.event_date, city)) return false;
            if (seen.has(String(v.event_id))) return false;
            seen.add(String(v.event_id));
            return true;
          }).slice(0, 6);
          setEvents(list);
        })
        .catch(() => setEvents([]));
    };
    if (typeof IntersectionObserver === 'undefined') { load(); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { load(); io.disconnect(); }
    }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [city]);

  const cityName = getCityConfig(city).displayName;

  return (
    <section ref={ref} style={{ padding: '40px 0', borderBottom: `1px solid ${T.line}` }}>
      <Label>Live right now</Label>
      <h3 style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: T.ink, margin: '0 0 16px' }}>
        Tonight in {cityName} — while you&rsquo;re reading this
      </h3>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
        {(events ?? Array.from({ length: 4 }).map(() => null)).map((e: any, i: number) => (
          <div
            key={e?.event_id ?? i}
            onClick={() => {
              if (!e?.event_id) return;
              trackEvent('landing_cta_click', { cta: 'tonight_strip', event_id: e.event_id });
              router.push(`/${city}/event/${e.event_id}`);
            }}
            style={{
              position: 'relative', flexShrink: 0, width: 132, aspectRatio: '3/4',
              borderRadius: 8, overflow: 'hidden', background: T.surfaceAlt,
              border: `1px solid ${T.line}`, cursor: e ? 'pointer' : 'default',
            }}
          >
            {e && (
              <>
                <EventMedia
                  src={e.media_url_1}
                  mediaType={e.media_type_1}
                  poster={e.media_type_2 !== 'video' ? e.media_url_2 : null}
                  alt={e.name || ''}
                  sizes="132px"
                  fill
                  lazyVideo
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, transparent 45%, rgba(10,10,20,0.9))',
                }} />
                <div style={{
                  position: 'absolute', left: 8, right: 8, bottom: 8,
                  color: T.ink, fontSize: 11, fontWeight: 600, lineHeight: 1.3,
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>{e.name}</div>
              </>
            )}
          </div>
        ))}
        {events && events.length > 0 && (
          <div
            onClick={() => {
              trackEvent('landing_cta_click', { cta: 'tonight_strip_more' });
              router.push(`/${city}/map`);
            }}
            style={{
              flexShrink: 0, width: 132, aspectRatio: '3/4', borderRadius: 8,
              border: `1px dashed ${T.accent}66`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: T.accent,
              fontFamily: mono, fontSize: 12, textAlign: 'center', padding: 10,
            }}
          >
            see the<br />whole map →
          </div>
        )}
      </div>
    </section>
  );
}

/* ── 6. Vibe tiles teaser ─────────────────────────────────────────── */
function VibeTiles({ city }: { city: CitySlug }) {
  const router = useRouter();
  return (
    <section style={{ padding: '40px 0', borderBottom: `1px solid ${T.line}` }}>
      <Label>Pick your vibe</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {VIBES.map((v) => (
          <button
            key={v.id}
            onClick={() => {
              trackEvent('vibe_pill_click', { vibe: v.id, source: 'landing' });
              router.push(`/${city}/vibe/${v.id}`);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px',
              background: T.surface, border: `1px solid ${T.line}`, borderRadius: 8,
              color: T.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
            }}
          >
            <v.Icon size={15} style={{ color: v.color, flexShrink: 0 }} />
            {v.label}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ── 7. Dual CTA ──────────────────────────────────────────────────── */
function DualCta({ city }: { city: CitySlug }) {
  const router = useRouter();
  const go = (to: 'map' | 'cards') => {
    trackEvent('landing_cta_click', { cta: to, source: 'dual_cta' });
    router.push(`/${city}/${to}`);
  };
  return (
    <section style={{ padding: '40px 0', borderBottom: `1px solid ${T.line}`, textAlign: 'center' }}>
      <h3 style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 24, color: T.ink, margin: '0 0 6px' }}>
        The night is already happening.
      </h3>
      <p style={{ color: T.inkMuted, fontSize: 13, margin: '0 0 20px' }}>How do you want to see it?</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button
          onClick={() => go('map')}
          style={{
            padding: '14px 26px', borderRadius: 999, background: T.accent, color: T.inkInverse,
            fontFamily: mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', border: 'none', cursor: 'pointer',
          }}
        >
          See the map
        </button>
        <button
          onClick={() => go('cards')}
          style={{
            padding: '14px 26px', borderRadius: 999, background: 'transparent', color: T.ink,
            fontFamily: mono, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', border: `1px solid ${T.line}`, cursor: 'pointer',
          }}
        >
          Browse the list
        </button>
      </div>
    </section>
  );
}

/* ── 8. Venue owners band ─────────────────────────────────────────── */
function VenueOwnersBand() {
  const router = useRouter();
  return (
    <section style={{ padding: '32px 0', borderBottom: `1px solid ${T.line}` }}>
      <Label>Run a venue?</Label>
      <p style={{ color: T.inkMuted, fontSize: 13, lineHeight: 1.55, margin: '0 0 10px' }}>
        Your stories are probably already on our radar. Make sure they&rsquo;re seen at
        the exact moment people decide where tonight happens.
      </p>
      <button
        onClick={() => {
          trackEvent('marketing_cta_click', { cta: 'list_venue', source: 'landing' });
          router.push('/list-your-venue');
        }}
        style={{
          background: 'none', border: 'none', color: T.accent, fontFamily: mono,
          fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer', padding: 0,
        }}
      >
        Claim the spotlight →
      </button>
    </section>
  );
}

/* ── 9. Footer ────────────────────────────────────────────────────── */
function LandingFooter() {
  const router = useRouter();
  const links: Array<[string, string]> = [
    ['How it works', '/how-it-works'],
    ['FAQ', '/faq'],
    ['List your venue', '/list-your-venue'],
  ];
  return (
    <footer style={{ padding: '28px 0 44px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
        {links.map(([label, href]) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: T.inkFaint, fontSize: 12,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ color: T.inkFaint, fontFamily: mono, fontSize: 10, marginTop: 16, letterSpacing: '0.08em' }}>
        WHERE&rsquo;S MY VIBE — WE WATCH THE STORIES. YOU PICK A VIBE.
      </div>
    </footer>
  );
}
