import type { Metadata } from 'next';
import MarketingShell from '@/components/marketing/MarketingShell';
import CtaButton from '@/components/marketing/CtaButton';
import { SourceChips, PipelineTimeline, StoryCollage, RadarRings } from '@/components/marketing/visuals';
import { getActiveCities } from '@/lib/server-data';
import { DEFAULT_CITY } from '@/config/cities.config';
import { T, serif, mono } from '@/lib/theme/tokens';

export const metadata: Metadata = {
  title: "How it works | Where's My Vibe",
  description:
    "We scan every venue's Instagram stories, posts, ticketing feeds and websites daily, AI-sort them into vibes, and put tonight on one live map. Here's exactly how.",
  alternates: { canonical: '/how-it-works' },
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
      color: T.inkFaint, marginBottom: 12,
    }}>{children}</div>
  );
}

export default async function HowItWorksPage() {
  const cities = await getActiveCities();

  return (
    <MarketingShell>
      <div style={{ padding: '32px 18px 8px', position: 'relative', overflow: 'hidden' }}>
        <RadarRings size={280} right={-90} top={-40} />

        {/* Hero */}
        <div style={{ position: 'relative' }}>
          <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 30, lineHeight: 1.15, color: T.ink, margin: '0 0 10px' }}>
            We watch the stories<br />
            <span style={{ color: T.accent, textShadow: `0 0 34px ${T.accent}40` }}>so you don&rsquo;t have to.</span>
          </h1>
          <p style={{ color: T.inkMuted, fontSize: 14, lineHeight: 1.6, margin: '0 0 30px', maxWidth: 340 }}>
            Everything happening tonight is already public — scattered across a few
            hundred Instagram accounts, ticketing sites and venue pages. We pull it
            into one place, every day.
          </p>
        </div>

        {/* The problem, with the story-card collage */}
        <section style={{ paddingBottom: 32, borderBottom: `1px solid ${T.line}`, marginBottom: 32 }}>
          <Label>The problem: discovery fatigue</Label>
          <div style={{ margin: '20px 0 26px' }}>
            <StoryCollage />
          </div>
          <p style={{ color: T.inkMuted, fontSize: 13, lineHeight: 1.65, margin: 0 }}>
            Venues announce events where their followers are: Instagram stories that
            vanish in 24 hours. Unless you follow every venue in the city — and catch
            every story before it expires — you&rsquo;re choosing from whatever the
            algorithm happened to show you. That&rsquo;s not discovery, that&rsquo;s luck.
          </p>
        </section>

        {/* What we scan — the source board */}
        <section style={{ paddingBottom: 32, borderBottom: `1px solid ${T.line}`, marginBottom: 32 }}>
          <Label>What we scan, every day</Label>
          <SourceChips />
        </section>

        {/* The pipeline */}
        <section style={{ paddingBottom: 26, borderBottom: `1px solid ${T.line}`, marginBottom: 32 }}>
          <Label>The pipeline</Label>
          <PipelineTimeline
            steps={[
              { n: '01', title: 'Scan', color: '#ec4899', desc: 'Hundreds of venues per city: Instagram stories and posts, ticketing feeds, event sites and the venues’ own websites.' },
              { n: '02', title: 'Read', color: '#eab308', desc: 'AI reads each post the way you would — event name, date, time, artists, offers, price — including text inside story images.' },
              { n: '03', title: 'Sort', color: '#10b981', desc: 'Each event is classified into vibes (brunch, club night, rooftop, ladies night, live music…) and pinned to its venue on the map.' },
              { n: '04', title: 'Serve', color: '#f4c430', desc: 'One live map and list, scoped to tonight by default. Filter by vibe, date or area — and go.' },
            ]}
          />
        </section>

        {/* Cities */}
        <section style={{ paddingBottom: 30, borderBottom: `1px solid ${T.line}`, marginBottom: 30 }}>
          <Label>Live now</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cities.map((c) => (
              <a
                key={c.slug}
                href={`/${c.slug}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '10px 16px', borderRadius: 999, background: T.surface,
                  border: `1px solid ${T.accent}55`, color: T.ink, fontSize: 13,
                  fontWeight: 600, textDecoration: 'none',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, boxShadow: `0 0 8px ${T.accent}` }} />
                {c.displayName}
              </a>
            ))}
            <span style={{
              padding: '10px 16px', borderRadius: 999, border: `1px dashed ${T.line}`,
              color: T.inkFaint, fontSize: 13,
            }}>
              more soon
            </span>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '4px 0 36px', textAlign: 'center' }}>
          <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 20, color: T.ink, margin: '0 0 18px' }}>
            Tonight is already mapped.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <CtaButton href={`/${DEFAULT_CITY}`} event="marketing_cta_click" eventProps={{ cta: 'explore', source: 'how_it_works' }}>
              Explore tonight
            </CtaButton>
            <CtaButton href="/list-your-venue" variant="ghost" event="marketing_cta_click" eventProps={{ cta: 'list_venue', source: 'how_it_works' }}>
              I run a venue
            </CtaButton>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
