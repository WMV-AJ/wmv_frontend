// Layout for the plain-text legal pages (/privacy, /data-deletion): a title,
// the last-updated date and titled sections. A server component with static
// text, so the pages read without JavaScript.
import MarketingShell from '@/components/marketing/MarketingShell';
import { T, bodyFont, displayFont } from '@/lib/theme/tokens';
import { LEGAL } from '@/content/legal';

const TEXT: React.CSSProperties = { color: T.inkMuted, fontFamily: bodyFont, fontSize: 14, lineHeight: 1.65, margin: '0 0 12px' };

export const legalLinkStyle: React.CSSProperties = { color: T.ink, textDecoration: 'underline' };

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 30 }}>
      <h2 style={{ fontFamily: displayFont, fontSize: 19, lineHeight: 1.25, color: T.ink, margin: '0 0 10px' }}>{title}</h2>
      {children}
    </section>
  );
}

export function LegalText({ children }: { children: React.ReactNode }) {
  return <p style={TEXT}>{children}</p>;
}

export function LegalList({ items, ordered = false }: { items: React.ReactNode[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag style={{ ...TEXT, paddingLeft: 20, listStyle: ordered ? 'decimal' : 'disc' }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: 7 }}>{item}</li>)}
    </Tag>
  );
}

export default function LegalPage({ title, intro, children }: { title: string; intro: React.ReactNode; children: React.ReactNode }) {
  return (
    <MarketingShell>
      <article style={{ padding: '32px 18px 40px' }}>
        <h1 style={{ fontFamily: displayFont, fontSize: 30, lineHeight: 1.15, color: T.ink, margin: '0 0 6px' }}>{title}</h1>
        <p style={{ color: T.inkFaint, fontFamily: bodyFont, fontSize: 12, margin: '0 0 18px' }}>Last updated: {LEGAL.lastUpdated}</p>
        <p style={TEXT}>{intro}</p>
        {children}
      </article>
    </MarketingShell>
  );
}
