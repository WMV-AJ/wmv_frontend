// ── VIBE DATA (icon-free) ─────────────────────────────────────────────
// The vibe list + matching logic WITHOUT the lucide-react icon imports, so
// server-side code (generateMetadata, sitemap.ts, JSON-LD builders) can use
// vibes without pulling an icon library into the server bundle.
//
// UI code should keep importing from '@/config/vibes', which re-exports
// everything here and layers the Icon component on top.

export interface VibeData {
  id: string;
  label: string;
  color: string;
  keywords: string[];
  categories: string[];
  /** Plural noun used in SEO titles, e.g. "Brunches in Dubai". */
  seoNoun: string;
}

export const VIBES_DATA: VibeData[] = [
  { id: 'clubs',   label: 'Clubs',        color: '#f4c430', keywords: ['nightclub', 'club', 'dance'], categories: ['Club Night'],                       seoNoun: 'Club nights' },
  { id: 'brunch',  label: 'Brunch',       color: '#34d399', keywords: ['brunch'],                     categories: ['Brunch'],                           seoNoun: 'Brunches' },
  { id: 'rooftops',label: 'Rooftops',     color: '#f472b6', keywords: ['rooftop', 'terrace'],         categories: [],                                   seoNoun: 'Rooftop nights' },
  { id: 'ladies',  label: 'Ladies Night', color: '#ec4899', keywords: ['ladies night', 'ladies'],     categories: ['Ladies Night'],                     seoNoun: 'Ladies nights' },
  { id: 'beach',   label: 'Beach Clubs',  color: '#22d3ee', keywords: ['beach', 'pool'],              categories: ['Pool Party'],                       seoNoun: 'Beach club days' },
  { id: 'happy',   label: 'Happy Hour',   color: '#f59e0b', keywords: ['happy hour'],                 categories: ['Happy Hour'],                       seoNoun: 'Happy hours' },
  { id: 'pool',    label: 'Pool Party',   color: '#06b6d4', keywords: ['pool party'],                 categories: ['Pool Party', 'Day Party & Afterwork'], seoNoun: 'Pool parties' },
  { id: 'live',    label: 'Live Music',   color: '#84cc16', keywords: ['live music', 'live'],         categories: ['Live Performance'],                 seoNoun: 'Live music nights' },
];

export function getVibeDataById(id: string | null | undefined): VibeData | undefined {
  if (!id) return undefined;
  return VIBES_DATA.find(v => v.id === id);
}

// Does a venue/event record match a vibe? Mirrors the original inline logic
// from the homepage: keyword match against event_vibe + venue category +
// venue_highlights, OR an event_categories primary match.
/* eslint-disable @typescript-eslint/no-explicit-any */
export function matchesVibe(venue: any, vibe: Pick<VibeData, 'keywords' | 'categories'>): boolean {
  const vibeArr: string[] = Array.isArray(venue.event_vibe) ? venue.event_vibe : [];
  const catArr: string[] = Array.isArray(venue.venue_category)
    ? venue.venue_category
    : typeof venue.category === 'string' ? [venue.category] : [];

  const highlightsText = (() => {
    try {
      const raw = venue.venue_highlights;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed.flatMap((o: any) => Object.keys(o)).join(' ') : '';
    } catch { return ''; }
  })();

  const haystack = [...vibeArr, ...catArr, highlightsText].join(' ').toLowerCase();
  const keywordMatch = vibe.keywords.some(kw => haystack.includes(kw));

  const evCats = (() => {
    try {
      const raw = venue.event_categories;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed.map((c: any) => c?.primary || '').filter(Boolean) : [];
    } catch { return []; }
  })();
  const categoryMatch = vibe.categories.length > 0 && evCats.some((p: string) => vibe.categories.includes(p));

  return keywordMatch || categoryMatch;
}
