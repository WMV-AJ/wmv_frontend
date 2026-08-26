import type { Metadata } from 'next';
import MarketingShell from '@/components/marketing/MarketingShell';
import CtaButton from '@/components/marketing/CtaButton';
import { SourceChips, RadarRings } from '@/components/marketing/visuals';
import { getActiveCities } from '@/lib/server-data';
import { T, serif, mono } from '@/lib/theme/tokens';

export const metadata: Metadata = {
  title: "List your venue | Where's My Vibe",
  description:
    "Your venue's events, seen at the exact moment people decide where tonight happens. How venues get on Where's My Vibe — and how to claim your spot.",
  alternates: { canonical: '/list-your-venue' },
};

const CONTACT_EMAIL = 'hello@wheresmyvibe.com';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
      color: T.inkFaint, marginBottom: 12,
    }}>{children}</div>
  );
}

export default async function ListYourVenuePage() {
  const cities = await getActiveCities();
  const cityNames = cities.map((c) => c.displayName).join(', ');

  return (
    <MarketingShell>
      <div style={{ padding: '32px 18px 8px', position: 'relative', overflow: 'hidden' }}>
        <RadarRings size={260} right={-80} top={-40} />
        <h1 style={{ fontFamily: serif, fontSize: 30, lineHeight: 1.15, color: T.ink, margin: '0 0 10px', position: 'relative' }}>
          Your venue is already<br />
          <span style={{ color: T.accent, textShadow: `0 0 34px ${T.accent}40` }}>on the radar. Own it.</span>
        </h1>
        <p style={{ color: T.inkMuted, fontSize: 14, lineHeight: 1.6, margin: '0 0 34px' }}>
          If you post your events publicly, chances are we&rsquo;re already scanning
          them. Claiming your venue makes sure nothing gets missed — and puts your
          events in front of people at the exact moment they decide where tonight
          happens.
        </p>

        <section style={{ paddingBottom: 28, borderBottom: `1px solid ${T.line}`, marginBottom: 28 }}>
          <Label>Why it matters</Label>
          {[
            ['Decision-moment reach', 'People open the map when they’re choosing where to go — not idly scrolling. That’s the highest-intent audience a venue can get.'],
            ['Tonight-scoped', 'The product defaults to tonight. Your Tuesday event competes with tonight’s events, not with a month of noise.'],
            [`Multi-city`, `Live in ${cityNames} — with more cities coming.`],
          ].map(([t, d]) => (
            <div key={t} style={{ marginBottom: 14 }}>
              <div style={{ color: T.ink, fontSize: 14, fontWeight: 700 }}>{t}</div>
              <p style={{ color: T.inkMuted, fontSize: 13, lineHeight: 1.6, margin: '3px 0 0' }}>{d}</p>
            </div>
          ))}
        </section>

        <section style={{ paddingBottom: 28, borderBottom: `1px solid ${T.line}`, marginBottom: 28 }}>
          <Label>How venues get on WMV</Label>
          <p style={{ color: T.inkMuted, fontSize: 13, lineHeight: 1.65, margin: '0 0 16px' }}>
            Organically: our pipeline scans these public channels daily. If your events
            are posted, they appear. Claiming your venue lets you verify your details,
            make sure every event is captured, and talk to us about featured placement.
          </p>
          <SourceChips compact />
        </section>

        <section style={{ padding: '4px 0 36px' }}>
          <Label>Claim your spot</Label>
          <p style={{ color: T.inkMuted, fontSize: 13, lineHeight: 1.6, margin: '0 0 18px' }}>
            One message, no forms. Tell us the venue name and city — we&rsquo;ll take
            it from there.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <CtaButton
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('List my venue on WMV')}`}
              external
              event="venue_lead_click"
              eventProps={{ channel: 'email' }}
            >
              Email us
            </CtaButton>
            <CtaButton
              href="https://instagram.com/wheresmyvibe.app"
              external
              variant="ghost"
              event="venue_lead_click"
              eventProps={{ channel: 'instagram' }}
            >
              DM on Instagram
            </CtaButton>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
