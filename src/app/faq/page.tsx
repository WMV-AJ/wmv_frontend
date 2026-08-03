import type { Metadata } from 'next';
import MarketingShell from '@/components/marketing/MarketingShell';
import JsonLd from '@/components/seo/JsonLd';
import { FAQ_ITEMS } from '@/content/faq';
import FaqAccordion from './FaqAccordion';
import { RadarRings } from '@/components/marketing/visuals';
import { T, serif } from '@/lib/theme/tokens';

export const metadata: Metadata = {
  title: "FAQ | Where's My Vibe",
  description:
    "Everything about Where's My Vibe: where the event data comes from, how fresh it is, which cities are live, and how venues get featured.",
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };

  return (
    <MarketingShell>
      <JsonLd data={faqSchema} />
      <div style={{ padding: '32px 18px 8px', position: 'relative', overflow: 'hidden' }}>
        <RadarRings size={220} right={-70} top={-50} />
        <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 30, color: T.ink, margin: '0 0 6px', position: 'relative' }}>
          Questions, <span style={{ color: T.accent }}>answered.</span>
        </h1>
        <p style={{ color: T.inkMuted, fontSize: 13, lineHeight: 1.6, margin: '0 0 26px' }}>
          The short version: it&rsquo;s free, the data comes from the venues&rsquo; own
          posts, and it refreshes daily.
        </p>
        <FaqAccordion items={FAQ_ITEMS} />
      </div>
    </MarketingShell>
  );
}
