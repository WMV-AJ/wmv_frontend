// Single source of truth for the FAQ page: the rendered accordion AND the
// FAQPage JSON-LD both read from here (answers must match exactly for
// Google rich-result eligibility).

export interface FaqItem {
  q: string;
  a: string;
  category: 'Using the app' | 'Data' | 'Cities' | 'Venues' | 'Privacy';
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'Using the app',
    q: "Is Where's My Vibe free?",
    a: 'Yes. Browsing the map, the list, every vibe page and every event is completely free. No account needed — signing in just lets you save favourites.',
  },
  {
    category: 'Using the app',
    q: 'Do I need to create an account?',
    a: 'No. The whole product works without an account. Google sign-in is optional and only adds favourites and a preferred city.',
  },
  {
    category: 'Data',
    q: 'Where does the event data come from?',
    a: "From the venues themselves: we scan venues' Instagram stories and posts, ticketing feeds, and venue websites daily, then AI classifies each event into vibes like brunch, club night, rooftop or ladies night.",
  },
  {
    category: 'Data',
    q: 'How fresh is the information?',
    a: 'The pipeline refreshes daily and the map is scoped to tonight by default. If a venue posted it, it shows up — usually within hours.',
  },
  {
    category: 'Data',
    q: 'Why is an event missing?',
    a: "If a venue didn't post the event anywhere public (stories, posts, their site or a ticketing feed), we can't see it. Venues can also reach out via the List Your Venue page to make sure they're covered.",
  },
  {
    category: 'Cities',
    q: 'Which cities are live?',
    a: "Dubai, Bangalore and Mumbai today, with more cities on the way. The city picker on the home page always shows what's live.",
  },
  {
    category: 'Venues',
    q: "I run a venue — how do I get featured?",
    a: "If you post your events publicly, you're probably already on the radar. Head to the List Your Venue page to claim your spot and make sure nothing gets missed.",
  },
  {
    category: 'Privacy',
    q: 'What do you track about me?',
    a: 'Only anonymous usage analytics, and only after you accept the cookie banner. No third-party advertising, and rejecting analytics changes nothing about the product.',
  },
];
