// ── VIBE CONFIG (UI layer) ────────────────────────────────────────────
// Single source of truth for the homepage "Pick your vibe" pills AND the
// /[city]/vibe/[vibeId] listing page. Keeping the list + matching logic here
// guarantees the count shown on a pill equals the number of events the
// listing page renders for that vibe.
//
// The data + matching logic live icon-free in ./vibes-data.ts so server code
// (metadata, sitemap, JSON-LD) can import them without lucide-react. This
// module layers the Icon component on top for UI use.
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
import { VIBES_DATA, matchesVibe, type VibeData } from './vibes-data';

export { matchesVibe };
export type { VibeData };

export interface VibeConfig extends VibeData {
  Icon: LucideIcon;
}

const VIBE_ICONS: Record<string, LucideIcon> = {
  clubs: Music,
  brunch: UtensilsCrossed,
  rooftops: Sparkles,
  ladies: Heart,
  beach: Waves,
  happy: GlassWater,
  pool: Droplet,
  live: MicVocal,
};

export const VIBES: VibeConfig[] = VIBES_DATA.map((v) => ({
  ...v,
  Icon: VIBE_ICONS[v.id] ?? Sparkles,
}));

export function getVibeById(id: string | null | undefined): VibeConfig | undefined {
  if (!id) return undefined;
  return VIBES.find(v => v.id === id);
}
