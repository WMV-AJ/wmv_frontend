// /about: who runs the site, what it does and how. This is the page other
// sites and AI assistants use to work out what "Where's My Vibe" is, so it
// states plain facts and pulls every number from the live data.
import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingShell from '@/components/marketing/MarketingShell';
import JsonLd from '@/components/seo/JsonLd';
import { COMPARISONS } from '@/content/compare';
import { LEGAL } from '@/content/legal';
import { getActiveCities, getCityEvents, getCityServerConfig } from '@/lib/server-data';
import { buildOrganizationSchema } from '@/lib/seo-schema';
import { cityToday, onDates, toSeoEvents, upcoming } from '@/lib/seo-events';
import { T, displayFont } from '@/lib/theme/tokens';

const TITLE = "About Where's My Vibe";
const DESCRIPTION =
  "Where's My Vibe is a free website that maps what is on tonight in Dubai, Bangalore, Mumbai and Delhi by reading what venues post publicly each day. Who runs it and how it works.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/about', type: 'website', images: ['/og-image-v2.png'] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og-image-v2.png'] },
};

const h2Style = { fontSize: 16, fontWeight: 600, color: T.ink, margin: '28px 0 8px' } as const;
const bodyStyle = { fontSize: 14, lineHeight: 1.6, color: T.inkMuted, margin: '0 0 10px' } as const;
const linkStyle = { color: T.ink, textDecoration: 'underline' } as const;

interface CityLine {
  slug: string;
  name: string;
  tonight: number;
  upcoming: number;
}

async function cityLines(): Promise<CityLine[]> {
  const cities = await getActiveCities();
  return Promise.all(cities.map(async ({ slug }) => {
    const [cfg, raw] = await Promise.all([getCityServerConfig(slug), getCityEvents(slug)]);
    const today = cityToday(cfg);
    const events = upcoming(toSeoEvents(raw, cfg), today);
    return { slug, name: cfg.displayName, tonight: onDates(events, [today]).length, upcoming: events.length };
  }));
}

export default async function AboutPage() {
  const cities = await cityLines();
  const cityNames = cities.map((c) => c.name);
  const namedCities = cityNames.length > 1
    ? `${cityNames.slice(0, -1).join(', ')} and ${cityNames[cityNames.length - 1]}`
    : cityNames[0];

  return (
    <MarketingShell>
      <JsonLd data={buildOrganizationSchema()} />
      <article style={{ padding: '28px 18px 8px' }}>
        <h1 style={{ fontFamily: displayFont, fontSize: 28, lineHeight: 1.15, color: T.ink, margin: '0 0 10px' }}>
          About Where&rsquo;s My Vibe
        </h1>
        <p style={{ ...bodyStyle, color: T.ink }}>
          Where&rsquo;s My Vibe is a free website that shows what is on tonight and this week in {namedCities}. It
          reads what venues post publicly every day and puts each event on a map and in lists by the kind of night:
          club nights, live music, brunches, comedy, ladies&rsquo; nights and more.
        </p>

        <h2 style={h2Style}>Why it exists</h2>
        <p style={bodyStyle}>
          Venues announce most of their nights in Instagram stories, and a story disappears after 24 hours. Unless you
          happened to watch the right accounts that day, you never saw it. Where&rsquo;s My Vibe started as a way to
          stop screenshotting stories into a group chat, and became one place that reads all of them.
        </p>

        <h2 style={h2Style}>How it works</h2>
        <p style={bodyStyle}>
          Every day the site collects what venues publish: Instagram stories and posts, ticket listings and venue
          websites. Software, including AI, reads each one and pulls out the event name, date, time and price when the
          venue stated them. Duplicates are merged and the result is placed on the map. Each listing links back to
          the venue&rsquo;s own post. <Link href="/how-it-works" style={linkStyle}>More on how it works</Link>.
        </p>

        <h2 style={h2Style}>What it does not do</h2>
        <p style={bodyStyle}>
          Where&rsquo;s My Vibe does not sell tickets, take bookings or charge venues to appear. Listings can be wrong
          when a venue&rsquo;s post is unclear, so check the venue&rsquo;s post before you travel.
        </p>

        <h2 style={h2Style}>Cities</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {cities.map((city) => (
            <li key={city.slug} style={{ ...bodyStyle, marginBottom: 6 }}>
              <Link href={`/${city.slug}`} style={linkStyle}>{city.name}</Link>: {city.tonight} things on today,{' '}
              {city.upcoming} listed from today onward.
            </li>
          ))}
        </ul>

        <h2 style={h2Style}>Who runs it</h2>
        <p style={bodyStyle}>
          Where&rsquo;s My Vibe is built and run by Arpit Jhamb, an independent founder. It is free to use and needs
          no account.
        </p>

        <h2 style={h2Style}>Contact and corrections</h2>
        <p style={bodyStyle}>
          To report a wrong listing, ask a question or correct something on this site, email{' '}
          <a href={`mailto:${LEGAL.contactEmail}`} style={linkStyle}>{LEGAL.contactEmail}</a> or message{' '}
          <a href="https://www.instagram.com/wheres.my.vibe/" rel="noopener" style={linkStyle}>@wheres.my.vibe</a> on
          Instagram. Venues can ask to be added on the{' '}
          <Link href="/list-your-venue" style={linkStyle}>list your venue</Link> page.
        </p>

        <h2 style={h2Style}>How it compares</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {COMPARISONS.map((page) => (
            <li key={page.slug} style={{ ...bodyStyle, marginBottom: 6 }}>
              <Link href={`/compare/${page.slug}`} style={linkStyle}>{page.heading}</Link>
            </li>
          ))}
        </ul>
      </article>
    </MarketingShell>
  );
}
