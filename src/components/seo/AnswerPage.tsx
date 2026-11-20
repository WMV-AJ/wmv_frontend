// Server-rendered pages that answer the questions people type into a search
// box or ask an assistant: "what's on in Dubai tonight", "this weekend",
// "free events". One component, three routes per city. The URL is stable and
// the content changes every day.
import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingShell from '@/components/marketing/MarketingShell';
import JsonLd from '@/components/seo/JsonLd';
import ServerEventList, { SeoIntro } from '@/components/seo/ServerEventList';
import { VIBES_DATA, matchesVibe } from '@/config/vibes-data';
import { getCityEvents, getCityServerConfig, type CityServerConfig } from '@/lib/server-data';
import { buildItemListSchema } from '@/lib/seo-schema';
import {
  cityToday, formatDay, formatLongDate, onDates, THIN_PAGE_MIN_EVENTS, toSeoEvents, upcoming, weekendDates,
  type SeoEvent,
} from '@/lib/seo-events';
import { T } from '@/lib/theme/tokens';

export type AnswerKind = 'tonight' | 'this-weekend' | 'free-events';

interface AnswerData {
  cfg: CityServerConfig;
  today: string;
  events: SeoEvent[];
  /** Every upcoming event in the city, for the links to other lists. */
  allUpcoming: SeoEvent[];
}

interface AnswerCopy {
  heading: string;
  title: string;
  description: string;
  answer: string;
  empty: string;
  listName: string;
}

async function loadAnswerData(city: string, kind: AnswerKind): Promise<AnswerData> {
  const [cfg, raw] = await Promise.all([getCityServerConfig(city), getCityEvents(city)]);
  const today = cityToday(cfg);
  const allUpcoming = upcoming(toSeoEvents(raw, cfg), today);
  const events =
    kind === 'tonight' ? onDates(allUpcoming, [today])
    : kind === 'this-weekend' ? onDates(allUpcoming, weekendDates(today))
    : allUpcoming.filter((e) => e.free);
  return { cfg, today, events, allUpcoming };
}

function copyFor(kind: AnswerKind, data: AnswerData): AnswerCopy {
  const { cfg, today, events } = data;
  const name = cfg.displayName;
  const count = events.length;
  const venues = new Set(events.map((e) => e.venue).filter(Boolean)).size;
  const source = `read from venues' own Instagram posts and updated on ${formatLongDate(today)}`;

  if (kind === 'tonight') {
    return {
      heading: `What's on in ${name} tonight`,
      title: `What's on in ${name} tonight | Where's My Vibe`,
      description: `Everything on in ${name} today: club nights, live music, brunches, comedy and happy hours, read daily from venues' own Instagram posts.`,
      answer: `Where's My Vibe lists ${count} things on in ${name} today, ${formatDay(today)}, across ${venues} venues, ${source}.`,
      empty: `Where's My Vibe has nothing listed in ${name} for today yet. The list is rebuilt every day from venues' own Instagram posts.`,
      listName: `What's on in ${name} tonight`,
    };
  }
  if (kind === 'this-weekend') {
    const days = weekendDates(today);
    const span = days.length > 1 ? `${formatDay(days[0])} to ${formatDay(days[days.length - 1])}` : formatDay(days[0]);
    return {
      heading: `What's on in ${name} this weekend`,
      title: `What's on in ${name} this weekend | Where's My Vibe`,
      description: `Everything on in ${name} this weekend, Friday to Sunday: club nights, brunches, live music and more, read daily from venues' own Instagram posts.`,
      answer: `Where's My Vibe lists ${count} things on in ${name} this weekend, ${span}, across ${venues} venues, ${source}.`,
      empty: `Where's My Vibe has nothing listed in ${name} for this weekend yet. Venues usually post their weekend plans from Wednesday.`,
      listName: `What's on in ${name} this weekend`,
    };
  }
  return {
    heading: `Free events in ${name}`,
    title: `Free events in ${name}: free-entry nights this week | Where's My Vibe`,
    description: `Events in ${name} that venues list as free entry, read daily from their own Instagram posts.`,
    answer: `Where's My Vibe lists ${count} events in ${name} that the venue describes as free entry, ${source}. Check the venue's post before you go, as free entry often has a cut-off time.`,
    empty: `Where's My Vibe has no events in ${name} marked as free entry right now. Venues do not always state the price, so the tonight list may still include free nights.`,
    listName: `Free events in ${name}`,
  };
}

function faqFor(kind: AnswerKind, name: string): Array<{ q: string; a: string }> {
  const shared = [
    {
      q: 'Where does this list come from?',
      a: `Where's My Vibe reads what ${name} venues post publicly every day, including Instagram stories and posts, ticket listings and venue websites, and turns each one into a dated listing.`,
    },
    {
      q: "Does Where's My Vibe sell tickets?",
      a: "No. Every listing links back to the venue's own post or ticket page. The site is free and needs no account.",
    },
  ];
  if (kind === 'free-events') {
    return [
      {
        q: `How do you know an event in ${name} is free?`,
        a: 'A listing appears here only when the venue itself wrote "free entry" in its post. Conditions such as a guest list or an entry cut-off time are set by the venue.',
      },
      ...shared,
    ];
  }
  return [
    {
      q: 'How often is the list updated?',
      a: `The ${name} list is rebuilt every day. Venues often announce a night only on the day itself, so it grows through the afternoon.`,
    },
    ...shared,
  ];
}

export async function answerMetadata(city: string, kind: AnswerKind): Promise<Metadata> {
  const data = await loadAnswerData(city, kind);
  const copy = copyFor(kind, data);
  const path = `/${city}/${kind}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: path },
    // A near-empty list is not worth a place in the index.
    ...(data.events.length < THIN_PAGE_MIN_EVENTS ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title: copy.title, description: copy.description, url: path, type: 'website', images: ['/og-image-v2.png'] },
    twitter: { card: 'summary_large_image', title: copy.title, description: copy.description, images: ['/og-image-v2.png'] },
  };
}

const linkStyle = { color: T.ink, fontSize: 13, textDecoration: 'underline' } as const;
const subheadStyle = { fontSize: 15, fontWeight: 600, color: T.ink, margin: '0 0 8px' } as const;

export default async function AnswerPage({ city, kind }: { city: string; kind: AnswerKind }) {
  const data = await loadAnswerData(city, kind);
  const { cfg, events, allUpcoming } = data;
  const copy = copyFor(kind, data);
  const faq = faqFor(kind, cfg.displayName);
  const itemList = buildItemListSchema(events.map((e) => e.raw), city, copy.listName);
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
  const vibeLinks = VIBES_DATA
    .map((vibe) => ({ vibe, count: allUpcoming.filter((e) => matchesVibe(e.raw, vibe)).length }))
    .filter((entry) => entry.count > 0);
  const siblings: Array<{ kind: AnswerKind; label: string }> = [
    { kind: 'tonight', label: `Tonight in ${cfg.displayName}` },
    { kind: 'this-weekend', label: `This weekend in ${cfg.displayName}` },
    { kind: 'free-events', label: `Free events in ${cfg.displayName}` },
  ];

  return (
    <MarketingShell>
      {itemList && <JsonLd data={itemList} />}
      <JsonLd data={faqSchema} />
      <SeoIntro heading={copy.heading} answer={events.length > 0 ? copy.answer : copy.empty}>
        <p style={{ margin: '10px 0 0' }}>
          <Link href={`/${city}/map`} style={linkStyle}>Open the {cfg.displayName} map</Link>
        </p>
      </SeoIntro>

      <ServerEventList events={events} city={city} />

      <section style={{ padding: '8px 16px 16px' }}>
        <h2 style={subheadStyle}>More in {cfg.displayName}</h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
          {siblings.filter((s) => s.kind !== kind).map((s) => (
            <li key={s.kind}><Link href={`/${city}/${s.kind}`} style={linkStyle}>{s.label}</Link></li>
          ))}
          {vibeLinks.map(({ vibe, count }) => (
            <li key={vibe.id}>
              <Link href={`/${city}/vibe/${vibe.id}`} style={linkStyle}>{vibe.seoNoun} ({count})</Link>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ padding: '8px 16px 8px' }}>
        <h2 style={subheadStyle}>Questions</h2>
        {faq.map((item) => (
          <div key={item.q} style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: '0 0 4px' }}>{item.q}</h3>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: T.inkMuted, margin: 0 }}>{item.a}</p>
          </div>
        ))}
      </section>
    </MarketingShell>
  );
}
