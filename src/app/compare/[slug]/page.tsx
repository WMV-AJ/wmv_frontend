// Comparison pages: /compare/{slug}. Copy and competitor facts live in
// src/content/compare.ts; this file only lays them out and adds the live
// count for each city the comparison covers.
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MarketingShell from '@/components/marketing/MarketingShell';
import JsonLd from '@/components/seo/JsonLd';
import { COMPARISONS, getComparison, type Comparison } from '@/content/compare';
import { getCityEvents, getCityServerConfig } from '@/lib/server-data';
import { cityToday, formatLongDate, onDates, toSeoEvents, upcoming } from '@/lib/seo-events';
import { T, displayFont } from '@/lib/theme/tokens';

interface Props {
  params: Promise<{ slug: string }>;
}

interface CityCount {
  slug: string;
  name: string;
  tonight: number;
}

async function liveCounts(cities: string[]): Promise<CityCount[]> {
  return Promise.all(cities.map(async (slug) => {
    const [cfg, raw] = await Promise.all([getCityServerConfig(slug), getCityEvents(slug)]);
    const today = cityToday(cfg);
    return { slug, name: cfg.displayName, tonight: onDates(upcoming(toSeoEvents(raw, cfg), today), [today]).length };
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getComparison(slug);
  if (!page) return {};
  const path = `/compare/${page.slug}`;
  return {
    title: `${page.title} | Where's My Vibe`,
    description: page.description,
    alternates: { canonical: path },
    openGraph: { title: page.title, description: page.description, url: path, type: 'article', images: ['/og-image-v2.png'] },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description, images: ['/og-image-v2.png'] },
  };
}

const h2Style = { fontSize: 16, fontWeight: 600, color: T.ink, margin: '28px 0 8px' } as const;
const bodyStyle = { fontSize: 14, lineHeight: 1.6, color: T.inkMuted, margin: 0 } as const;
const cellStyle = { padding: '8px 10px', fontSize: 12.5, lineHeight: 1.45, color: T.inkMuted, verticalAlign: 'top', borderTop: `1px solid ${T.line}` } as const;
const linkStyle = { color: T.ink, textDecoration: 'underline' } as const;

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      {items.map((item) => (
        <li key={item} style={{ ...bodyStyle, marginBottom: 6 }}>{item}</li>
      ))}
    </ul>
  );
}

function ComparisonTable({ page }: { page: Comparison }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
      <thead>
        <tr>
          <th style={{ ...cellStyle, borderTop: 'none', textAlign: 'left', color: T.ink }} scope="col"> </th>
          <th style={{ ...cellStyle, borderTop: 'none', textAlign: 'left', color: T.ink }} scope="col">Where&rsquo;s My Vibe</th>
          <th style={{ ...cellStyle, borderTop: 'none', textAlign: 'left', color: T.ink }} scope="col">{page.competitor}</th>
        </tr>
      </thead>
      <tbody>
        {page.rows.map((row) => (
          <tr key={row.label}>
            <th style={{ ...cellStyle, textAlign: 'left', color: T.ink, fontWeight: 600 }} scope="row">{row.label}</th>
            <td style={cellStyle}>{row.wmv}</td>
            <td style={cellStyle}>{row.them}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function ComparePage({ params }: Props) {
  const { slug } = await params;
  const page = getComparison(slug);
  if (!page) notFound();

  const counts = await liveCounts(page.cities);
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
  const others = COMPARISONS.filter((c) => c.slug !== page.slug);

  return (
    <MarketingShell>
      <JsonLd data={faqSchema} />
      <article style={{ padding: '28px 18px 8px' }}>
        <h1 style={{ fontFamily: displayFont, fontSize: 26, lineHeight: 1.15, color: T.ink, margin: '0 0 10px' }}>
          {page.heading}
        </h1>
        <p style={{ ...bodyStyle, color: T.ink }}>{page.summary}</p>

        <h2 style={h2Style}>At a glance</h2>
        <ComparisonTable page={page} />

        <h2 style={h2Style}>What {page.competitor} is</h2>
        <p style={bodyStyle}>{page.theyAre}</p>

        <h2 style={h2Style}>When to use {page.competitor}</h2>
        <BulletList items={page.useThemWhen} />

        <h2 style={h2Style}>When to use Where&rsquo;s My Vibe</h2>
        <BulletList items={page.useUsWhen} />

        <h2 style={h2Style}>What is on right now</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {counts.map((city) => (
            <li key={city.slug} style={{ ...bodyStyle, marginBottom: 6 }}>
              <Link href={`/${city.slug}/tonight`} style={linkStyle}>
                {city.tonight} things on in {city.name} today
              </Link>
              {' '}on Where&rsquo;s My Vibe, read from venues&rsquo; own posts.
            </li>
          ))}
        </ul>

        <h2 style={h2Style}>Questions</h2>
        {page.faq.map((item) => (
          <div key={item.q} style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.ink, margin: '0 0 4px' }}>{item.q}</h3>
            <p style={bodyStyle}>{item.a}</p>
          </div>
        ))}

        <h2 style={h2Style}>More comparisons</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {others.map((other) => (
            <li key={other.slug} style={{ ...bodyStyle, marginBottom: 6 }}>
              <Link href={`/compare/${other.slug}`} style={linkStyle}>{other.heading}</Link>
            </li>
          ))}
        </ul>

        <p style={{ ...bodyStyle, fontSize: 12, marginTop: 28 }}>
          Details about {page.competitor} were checked on {formatLongDate(page.checkedOn)} against{' '}
          {page.sources.map((source, index) => (
            <span key={source.url}>
              {index > 0 && ', '}
              <a href={source.url} rel="nofollow noopener" style={linkStyle}>{source.label}</a>
            </span>
          ))}
          . {page.competitor} is a trademark of its owner and is not affiliated with Where&rsquo;s My Vibe. If something
          here is out of date, <Link href="/about" style={linkStyle}>tell us</Link> and we will correct it.
        </p>
      </article>
    </MarketingShell>
  );
}
