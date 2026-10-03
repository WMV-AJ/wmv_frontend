import type { ComponentType } from 'react';
import {
  Utensils, Laugh, Moon, Music2, Trophy, Sun, Clock, Waves, Sparkles, Coffee,
  // 046/047 city-specific category icons
  Martini, Beer, Wrench, Users, PartyPopper, Mic, Wine, Zap, Briefcase, Film,
  Tag, // generic fallback for unknown categories
} from 'lucide-react';

type IconComponent = ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>;

// Icon per primary category — keys match DB event_categories[].primary
// exactly. Shared by the filter pills and the map markers so they agree.
export const CATEGORY_ICONS: Record<string, IconComponent> = {
  'Food & Dining': Utensils,
  'Sports Viewing': Trophy,
  'Live Performance': Music2,
  'Club Night': Moon,
  'Day Party & Afterwork': Sun,
  'Happy Hour': Clock,
  'Pool Party': Waves,
  'Ladies Night': Sparkles,
  'Brunch': Coffee,
  'Comedy Night': Laugh,
  // 046/047 city-specific additions
  'Cocktail Bar Night': Martini,
  'Pub Night': Beer,
  'Workshop': Wrench,
  'Family & Kids': Users,
  'Activities': PartyPopper,
  'Karaoke': Mic,
  'Tasting Event': Wine,
  'Pop Up': Zap,
  'Business Event': Briefcase,
  'Bollywood Night': Film,
  'Standup Comedy': Mic,
};

export function getCategoryIcon(primary: string): IconComponent {
  return CATEGORY_ICONS[primary] ?? Tag;
}
