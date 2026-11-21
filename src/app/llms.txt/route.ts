// /llms.txt: a plain-text guide to the site for AI assistants and agents.
// Built from the live city registry so it never lists a city that is not live.
import { VIBES_DATA } from '@/config/vibes-data';
import { getActiveCities } from '@/lib/server-data';

const BASE = 'https://wheresmyvibe.com';

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const cities = await getActiveCities();
  const cityNames = cities.map((c) => c.displayName).join(', ');
  const vibeIds = VIBES_DATA.map((v) => v.id).join(', ');

  const lines = [
    "# Where's My Vibe",
    '',
    `> Where's My Vibe is a free website that shows what is on tonight and this week in ${cityNames}. It reads what venues post publicly (Instagram stories and posts, ticket listings, venue websites) every day and puts each event on a map and in lists by type of night. It does not sell tickets; each event links back to the venue's own post.`,
    '',
    'Listings are rebuilt daily. An event page gives the event name, venue, area, date, time and price when the venue stated them. Anyone can read the site without an account.',
    '',
    '## Cities',
    ...cities.flatMap((c) => [
      `- [${c.displayName}: what is on](${BASE}/${c.slug}): today's events and links to every list below`,
    ]),
    '',
    '## URL patterns',
    `- ${BASE}/{city}/tonight — everything on today in that city`,
    `- ${BASE}/{city}/this-weekend — Friday to Sunday`,
    `- ${BASE}/{city}/free-events — events the venue lists as free entry`,
    `- ${BASE}/{city}/vibe/{vibe} — one type of night; vibe is one of: ${vibeIds}`,
    `- ${BASE}/{city}/area/{area} — one neighbourhood, e.g. ${BASE}/dubai/area/dubai-marina`,
    `- ${BASE}/{city}/event/{id} — one event`,
    `- ${BASE}/{city}/map — the interactive map`,
    `- {city} is one of: ${cities.map((c) => c.slug).join(', ')}`,
    '',
    '## About',
    `- [About Where's My Vibe](${BASE}/about): what it is, who runs it and how to send corrections`,
    `- [How it works](${BASE}/how-it-works): where the data comes from and how often it is refreshed`,
    `- [FAQ](${BASE}/faq)`,
    `- [List your venue](${BASE}/list-your-venue)`,
    `- [Privacy](${BASE}/privacy)`,
    `- [Sitemap](${BASE}/sitemap.xml)`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
