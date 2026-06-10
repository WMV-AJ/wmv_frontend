// ── VIBE CONFIG ───────────────────────────────────────────────────────
// Single source of truth for the homepage "Pick your vibe" pills AND the
// /[city]/vibe/[vibeId] listing page. Keeping the list + matching logic here
// guarantees the count shown on a pill equals the number of events the
// listing page renders for that vibe.
import {
  Music,
  Sparkles,
  Waves,
  UtensilsCrossed,
  GlassWater,
  Droplet,
  Mic as MicVocal,
  Heart,
  type LucideIcon,
} from 'lucide-react';

export interface VibeConfig {
  id: string;
  label: string;
  color: string;
  Icon: LucideIcon;
  keywords: string[];
  categories: string[];
}

export const VIBES: VibeConfig[] = [
  { id: 'clubs',   label: 'Clubs',        color: '#a78bfa', Icon: Music,          keywords: ['nightclub', 'club', 'dance'], categories: ['Club Night'] },
  { id: 'brunch',  label: 'Brunch',       color: '#34d399', Icon: UtensilsCrossed, keywords: ['brunch'],                     categories: ['Brunch'] },
  { id: 'rooftops',label: 'Rooftops',     color: '#f472b6', Icon: Sparkles,       keywords: ['rooftop', 'terrace'],         categories: [] },
  { id: 'ladies',  label: 'Ladies Night', color: '#ec4899', Icon: Heart,          keywords: ['ladies night', 'ladies'],     categories: ['Ladies Night'] },
  { id: 'beach',   label: 'Beach Clubs',  color: '#22d3ee', Icon: Waves,          keywords: ['beach', 'pool'],              categories: ['Pool Party'] },
  { id: 'happy',   label: 'Happy Hour',   color: '#f59e0b', Icon: GlassWater,     keywords: ['happy hour'],                 categories: ['Happy Hour'] },
  { id: 'pool',    label: 'Pool Party',   color: '#06b6d4', Icon: Droplet,        keywords: ['pool party'],                 categories: ['Pool Party', 'Day Party & Afterwork'] },
  { id: 'live',    label: 'Live Music',   color: '#84cc16', Icon: MicVocal,       keywords: ['live music', 'live'],         categories: ['Live Performance'] },
];

export function getVibeById(id: string | null | undefined): VibeConfig | undefined {
  if (!id) return undefined;
  return VIBES.find(v => v.id === id);
}

// Does a venue/event record match a vibe? Mirrors the original inline logic
// from the homepage: keyword match against event_vibe + venue category +
// venue_highlights, OR an event_categories primary match.
/* eslint-disable @typescript-eslint/no-explicit-any */
export function matchesVibe(venue: any, vibe: VibeConfig): boolean {
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
