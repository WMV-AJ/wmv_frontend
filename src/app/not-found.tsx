import Link from 'next/link';
import { T, bodyFont, displayFont } from '@/lib/theme/tokens';
import { DEFAULT_CITY } from '@/config/cities.config';

const LINK: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 44, padding: '0 18px',
  border: `1px solid ${T.line}`, color: T.ink, fontFamily: bodyFont, fontSize: 12, fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none',
};

export default function NotFound() {
  return (
    <main style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, padding: 24 }}>
      <div style={{ maxWidth: 340, textAlign: 'center' }}>
        <p style={{ color: T.inkFaint, fontFamily: bodyFont, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 10px' }}>
          Error 404
        </p>
        <h1 style={{ fontFamily: displayFont, fontSize: 28, lineHeight: 1.15, color: T.ink, margin: '0 0 10px' }}>
          This page doesn&rsquo;t exist
        </h1>
        <p style={{ color: T.inkMuted, fontFamily: bodyFont, fontSize: 14, lineHeight: 1.6, margin: '0 0 22px' }}>
          The address may be mistyped, or the event may have ended and been removed.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          <Link href="/" className="wmv-invert" style={{ ...LINK, border: 'none' }}>Home</Link>
          <Link href={`/${DEFAULT_CITY}/map`} style={LINK}>Map</Link>
          <Link href={`/${DEFAULT_CITY}/cards`} style={LINK}>List</Link>
        </div>
      </div>
    </main>
  );
}
