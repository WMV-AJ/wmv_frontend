// Single source of truth for the comparison pages under /compare.
//
// These pages make public statements about other companies, so every entry
// follows three rules:
//   1. Describe what the other service is in terms its own site would accept.
//   2. Say what it is built for, never what it "lacks". Absence is only
//      claimed about Where's My Vibe itself.
//   3. Carry the date the facts were last checked and the pages they came from.
// Re-check `checkedOn` facts before editing a page. Community features (chat,
// "who's going") are not live on Where's My Vibe and must not be listed.

export interface CompareRow {
  label: string;
  wmv: string;
  them: string;
}

export interface CompareFaq {
  q: string;
  a: string;
}

export interface CompareSource {
  label: string;
  url: string;
}

export interface Comparison {
  slug: string;
  /** The other service's name as it writes it. */
  competitor: string;
  /** Cities whose live counts are shown on the page. */
  cities: string[];
  title: string;
  description: string;
  heading: string;
  /** The answer in two or three sentences. */
  summary: string;
  /** What the other service is, in neutral terms. */
  theyAre: string;
  useThemWhen: string[];
  useUsWhen: string[];
  rows: CompareRow[];
  faq: CompareFaq[];
  /** ISO date the competitor facts were last checked. */
  checkedOn: string;
  sources: CompareSource[];
}

const CHECKED_ON = '2026-11-21';

const WMV_LISTING = "Read automatically from what venues post publicly: Instagram stories and posts, ticket listings and venue websites";
const WMV_TICKETS = "Does not sell tickets. Each listing links to the venue's own post or ticket page";
const WMV_COST = 'Free, in the browser, with no account needed';

const SHARED_FAQ: CompareFaq[] = [
  {
    q: "Is Where's My Vibe free?",
    a: "Yes. The map, the lists and every event page are free to read without an account.",
  },
  {
    q: "Does Where's My Vibe sell tickets?",
    a: "No. It shows what is on and links to the venue's own post or ticket page, so you book wherever the venue sells.",
  },
  {
    q: "How do events get onto Where's My Vibe?",
    a: "The site reads what venues post publicly every day, including Instagram stories and posts, ticket listings and venue websites, and turns each one into a dated listing. Venues do not pay to appear.",
  },
];

export const COMPARISONS: Comparison[] = [
  {
    slug: 'wmv-vs-platinumlist',
    competitor: 'Platinumlist',
    cities: ['dubai'],
    title: "Platinumlist vs Where's My Vibe: buying tickets vs finding your night",
    description: "Platinumlist sells tickets for events in the UAE. Where's My Vibe maps what Dubai venues announce each day, ticketed or not. How the two differ and when to use each.",
    heading: "Platinumlist vs Where's My Vibe",
    summary: "Platinumlist is where you buy a ticket for an event in the UAE. Where's My Vibe is where you find out what is on tonight in Dubai, including nights that were only announced on a venue's Instagram story and have no ticket at all. Many people will use both: one to decide, the other to pay.",
    theyAre: "Platinumlist describes itself as a ticketing platform for events, attractions and experiences in the UAE, Saudi Arabia and Bahrain. It sells tickets for concerts, shows, sport, business events and attractions, and offers ticketing tools to organisers.",
    useThemWhen: [
      'You already know the concert, show or attraction you want and need to buy a ticket.',
      'You want big ticketed events weeks or months ahead.',
    ],
    useUsWhen: [
      'You have not decided what to do tonight and want to see everything in one place.',
      "You want the ladies' nights, brunches, happy hours and resident DJ nights that venues announce on Instagram and do not ticket.",
      'You want to browse by area on a map.',
    ],
    rows: [
      { label: 'Built for', wmv: 'Finding what is on tonight and this week', them: 'Selling tickets for events and attractions' },
      { label: 'How events get listed', wmv: WMV_LISTING, them: 'An organiser lists the event for sale on the platform' },
      { label: 'Tickets', wmv: WMV_TICKETS, them: 'Sold on the platform' },
      { label: 'Cost to you', wmv: WMV_COST, them: 'Free to browse; you pay for tickets' },
    ],
    faq: [
      {
        q: 'Is Where\'s My Vibe a Platinumlist alternative?',
        a: "For buying tickets, no. Where's My Vibe does not sell them. It is an alternative way to find out what is on in Dubai, and it includes nights that are free to enter or were never ticketed.",
      },
      ...SHARED_FAQ,
    ],
    checkedOn: CHECKED_ON,
    sources: [
      { label: 'Platinumlist, UAE ticketing', url: 'https://platinumlist.net/for-organisers/uae-ticketing/' },
      { label: 'Platinumlist Dubai', url: 'https://dubai.platinumlist.net/' },
    ],
  },
  {
    slug: 'wmv-vs-timeout-dubai',
    competitor: 'Time Out Dubai',
    cities: ['dubai'],
    title: "Time Out Dubai vs Where's My Vibe: the editor's picks vs the whole map",
    description: "Time Out Dubai and What's On are written by editors. Where's My Vibe lists what Dubai venues announce each day. How the two differ and when to use each.",
    heading: "Time Out Dubai vs Where's My Vibe",
    summary: "Time Out Dubai and What's On are magazines: editors choose what to feature and write about it. Where's My Vibe is a live list: it reads what Dubai venues post every day and shows all of it on a map. Read the magazines for reviews and ideas, and open the map to see everything on tonight.",
    theyAre: "Time Out Dubai and What's On Dubai are editorial city guides. They publish restaurant and bar reviews, news, and roundups such as things to do this week, chosen and written by their editors.",
    useThemWhen: [
      'You want a review or a recommendation from a writer who has been there.',
      'You are planning ahead and want ideas for the month.',
    ],
    useUsWhen: [
      'You want the full list for tonight, including small nights no editor wrote about.',
      'You want to see what is on near you on a map.',
      "You want the detail straight from the venue's own post, with a link to it.",
    ],
    rows: [
      { label: 'Built for', wmv: 'Seeing everything on tonight and this week', them: 'Reviews, news and curated roundups' },
      { label: 'How events get listed', wmv: WMV_LISTING, them: 'Chosen and written up by editors' },
      { label: 'How often it changes', wmv: 'Rebuilt every day', them: 'When editors publish' },
      { label: 'Cost to you', wmv: WMV_COST, them: 'Free to read' },
    ],
    faq: [
      {
        q: "Does Where's My Vibe review venues?",
        a: "No. It reports what venues say is on. For an opinion on whether a place is good, an editorial guide is the better source.",
      },
      ...SHARED_FAQ,
    ],
    checkedOn: CHECKED_ON,
    sources: [
      { label: 'Time Out Dubai', url: 'https://www.timeoutdubai.com/' },
      { label: "What's On Dubai", url: 'https://whatson.ae/' },
    ],
  },
  {
    slug: 'bookmyshow-alternative',
    competitor: 'BookMyShow',
    cities: ['bangalore', 'mumbai'],
    title: "Looking for a BookMyShow alternative? It depends what you are looking for",
    description: "BookMyShow sells tickets for movies, concerts and shows in India. Where's My Vibe maps what venues in Bangalore and Mumbai announce each day, ticketed or not.",
    heading: 'A BookMyShow alternative for finding what is on',
    summary: "If you want to buy a ticket for a film or a concert you have already chosen, BookMyShow does that well and Where's My Vibe does not do it at all. If you want to find out what is on tonight in Bangalore or Mumbai, including pub gigs, karaoke nights and free-entry nights that venues only posted on Instagram, that is what Where's My Vibe is for.",
    theyAre: "BookMyShow is an Indian ticketing platform for movies, concerts, plays, sport and other live events.",
    useThemWhen: [
      'You want movie tickets.',
      'You have picked a concert, play or match and need to book seats.',
    ],
    useUsWhen: [
      'You have a free evening and no plan yet.',
      "You want the nights venues run themselves: live bands, DJ nights, quiz and karaoke, ladies' nights.",
      'You want to see what is on in your part of the city on a map.',
    ],
    rows: [
      { label: 'Built for', wmv: 'Finding what is on tonight and this week', them: 'Booking tickets for movies and live events' },
      { label: 'How events get listed', wmv: WMV_LISTING, them: 'An organiser or cinema lists the event for sale' },
      { label: 'Tickets', wmv: WMV_TICKETS, them: 'Sold on the platform' },
      { label: 'Movies', wmv: 'Not covered', them: 'Covered' },
      { label: 'Cost to you', wmv: WMV_COST, them: 'Free to browse; you pay for tickets' },
    ],
    faq: [
      {
        q: "Can I book movie tickets on Where's My Vibe?",
        a: "No. Where's My Vibe covers nights out at venues, such as live music, club nights, comedy and brunches. It does not list films or sell tickets.",
      },
      ...SHARED_FAQ,
    ],
    checkedOn: CHECKED_ON,
    sources: [{ label: 'BookMyShow', url: 'https://in.bookmyshow.com/' }],
  },
  {
    slug: 'wmv-vs-district',
    competitor: 'District',
    cities: ['bangalore', 'mumbai'],
    title: "District vs Where's My Vibe: a booking app vs a discovery map",
    description: "District by Zomato books movies, tables and event tickets. Where's My Vibe maps what venues in Bangalore and Mumbai announce each day. How the two differ.",
    heading: "District vs Where's My Vibe",
    summary: "District, from the company behind Zomato, is an app for booking: movie tickets, restaurant tables and tickets to events. Where's My Vibe is for the step before booking. It shows what venues in Bangalore and Mumbai have announced for tonight, including nights with nothing to book.",
    theyAre: "District is a going-out app from Eternal, the company behind Zomato. Its site lists movies, events, dining, stores and activities, with booking and payment in the app.",
    useThemWhen: [
      'You want to book a film, a table or an event ticket and pay in one app.',
      'You want dining offers when you pay your bill.',
    ],
    useUsWhen: [
      'You want to see what is on tonight before deciding where to go.',
      'You are after venue nights that have no ticket, such as a live band at a brewery or a karaoke night.',
      'You want a map of tonight for your area.',
    ],
    rows: [
      { label: 'Built for', wmv: 'Finding what is on tonight and this week', them: 'Booking movies, dining and events' },
      { label: 'How events get listed', wmv: WMV_LISTING, them: 'Listed on the platform for booking' },
      { label: 'Tickets and tables', wmv: WMV_TICKETS, them: 'Booked and paid for in the app' },
      { label: 'Where you use it', wmv: 'Any browser', them: 'Mobile app and website' },
      { label: 'Cost to you', wmv: WMV_COST, them: 'Free app; you pay for what you book' },
    ],
    faq: [
      {
        q: "Is Where's My Vibe an alternative to District?",
        a: "Not for booking. Where's My Vibe does not take bookings or payments. It is a different tool for a different moment: deciding what to do tonight.",
      },
      ...SHARED_FAQ,
    ],
    checkedOn: CHECKED_ON,
    sources: [
      { label: 'District', url: 'https://www.district.in/' },
      { label: 'Eternal, District', url: 'https://eternal.com/our-businesses/district' },
    ],
  },
  {
    slug: 'wmv-vs-sortmyscene',
    competitor: 'SortMyScene',
    cities: ['bangalore', 'mumbai'],
    title: "SortMyScene vs Where's My Vibe: nightlife tickets vs every kind of night",
    description: "SortMyScene handles guest lists, tables and tickets for nightlife in India. Where's My Vibe maps what venues announce each day across every kind of night out.",
    heading: "SortMyScene vs Where's My Vibe",
    summary: "SortMyScene is a nightlife app: it finds club nights and music events and gets you in, through guest lists, table bookings and tickets. Where's My Vibe covers a wider spread of nights, from brunches and comedy to quiz nights and live bands, and stops at telling you what is on. It does not handle entry.",
    theyAre: "SortMyScene describes itself as a one-stop shop for nightlife in India, covering guest-list entry, table bookings and tickets, with a focus on music events and club nights.",
    useThemWhen: [
      'You want to get on a guest list or book a table at a club.',
      'You are looking for electronic music events and want to buy the ticket in the same place.',
    ],
    useUsWhen: [
      'You want more than club nights: brunches, comedy, live bands, workshops, sports screenings.',
      "You want every venue's night in one list, whether or not it sells tickets anywhere.",
      'You want to browse by area on a map.',
    ],
    rows: [
      { label: 'Built for', wmv: 'Finding what is on tonight across every kind of night out', them: 'Nightlife discovery with guest lists, tables and tickets' },
      { label: 'How events get listed', wmv: WMV_LISTING, them: 'Listed on the platform by organisers and venues' },
      { label: 'Entry', wmv: WMV_TICKETS, them: 'Guest lists, table bookings and tickets in the app' },
      { label: 'Cost to you', wmv: WMV_COST, them: 'Free app; you pay for tickets and tables' },
    ],
    faq: [
      {
        q: "Can Where's My Vibe put me on a guest list?",
        a: "No. It links to the venue's own post, where the venue says how entry works. For guest lists and table bookings, use the venue directly or an app built for that.",
      },
      ...SHARED_FAQ,
    ],
    checkedOn: CHECKED_ON,
    sources: [
      { label: 'SortMyScene', url: 'https://sortmyscene.com/events' },
      { label: 'SortMyScene on the App Store', url: 'https://apps.apple.com/in/app/sort-my-scene/id1575427755' },
    ],
  },
  {
    slug: 'wmv-vs-google-maps',
    competitor: 'Google Maps',
    cities: ['dubai', 'bangalore'],
    title: "Google Maps shows places. Where's My Vibe shows what is happening in them",
    description: "Google Maps tells you where a venue is and when it is open. Where's My Vibe tells you what that venue has on tonight. How the two fit together.",
    heading: "Google Maps vs Where's My Vibe",
    summary: "Google Maps answers where a place is, whether it is open and how to get there. Where's My Vibe answers a different question: what is on there tonight. A bar's map pin looks the same on a quiet Tuesday and on the night it has a touring DJ, and that difference is what Where's My Vibe shows.",
    theyAre: "Google Maps is a mapping service. For a venue it shows the location, opening hours, photos, reviews and directions.",
    useThemWhen: [
      'You know where you are going and need directions.',
      'You want reviews, photos and opening hours for a place.',
    ],
    useUsWhen: [
      'You want to know which venues near you have something on tonight.',
      'You want to filter the map by the kind of night: live music, club night, brunch, comedy.',
      "You want the event details from the venue's own post.",
    ],
    rows: [
      { label: 'Built for', wmv: 'What is on tonight and this week', them: 'Places, directions and reviews' },
      { label: 'What a pin tells you', wmv: "Tonight's event, time and price where the venue stated them", them: 'Location, hours, rating and photos' },
      { label: 'Where the information comes from', wmv: WMV_LISTING, them: 'Business listings, Google data and user reviews' },
      { label: 'Cost to you', wmv: WMV_COST, them: 'Free' },
    ],
    faq: [
      {
        q: "Does Where's My Vibe replace Google Maps?",
        a: "No. Use Where's My Vibe to choose where to go tonight, then open the venue in your maps app for directions. Each event page has a directions link.",
      },
      ...SHARED_FAQ,
    ],
    checkedOn: CHECKED_ON,
    sources: [{ label: 'Google Maps', url: 'https://www.google.com/maps' }],
  },
];

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
