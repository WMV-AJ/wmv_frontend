// One-line feeling + a fallback photo per event category (event_categories
// primary, as stored in the DB). Used by the home page's "Today's vibes"
// fan, which is built from the categories actually on today — so this has
// to cover any primary the pipeline emits; unknown ones fall back cleanly.

const TAGLINES: Record<string, string> = {
  'Food & Dining': 'Somewhere good to eat tonight, and a reason to go.',
  'Happy Hour': 'A good drink, an easy conversation, another round.',
  'Club Night': 'A floor to disappear into. One more song before you leave.',
  'Ladies Night': 'The right room. The right people. Your kind of night.',
  'Sports Viewing': 'Big screen, loud room, everyone on the same side.',
  'Pool Party': 'Open skies and weekend energy, whenever you need it.',
  'Brunch': 'A long table, good company, and nowhere else to be.',
  'Live Performance': 'For the nights you remember because you heard them live.',
  'Day Party & Afterwork': 'Clock off early. The night starts in daylight.',
  'Comedy Night': 'A room full of strangers laughing at the same thing.',
  'Standup Comedy': 'A room full of strangers laughing at the same thing.',
  'Business Event': 'Useful rooms: talks, meetups and people worth meeting.',
  'Pop Up': 'Here for a moment only. Catch it while it lasts.',
  'Activities': 'Something to do with your hands, not just your phone.',
  'Tasting Event': 'Small pours, new flavours, someone to explain them.',
  'Workshop': 'Learn a thing, make a thing, leave with a thing.',
  'Cocktail Bar Night': 'Low light, a good bartender, one more round.',
  'Karaoke': 'Pick a song. Commit to it. Nobody is judging.',
  'Pub Night': 'A pint, a table, and nothing to prove.',
  'Family & Kids': 'Plans the whole family actually wants to go to.',
  'Bollywood Night': 'Every song you know every word to.',
};

const FALLBACK_IMAGES: Record<string, string> = {
  'Food & Dining': '/home3/brunch.webp',
  'Happy Hour': '/home3/cocktails.webp',
  'Cocktail Bar Night': '/home3/cocktails.webp',
  'Tasting Event': '/home3/cocktails.webp',
  'Club Night': '/home3/club-entry.webp',
  'Bollywood Night': '/home3/club-entry.webp',
  'Ladies Night': '/home3/friends-night.webp',
  'Pool Party': '/home3/pool-terrace.webp',
  'Day Party & Afterwork': '/home3/beach-terrace.webp',
  'Brunch': '/home3/brunch.webp',
  'Live Performance': '/home3/live-performance.webp',
  'Karaoke': '/home3/live-performance.webp',
  'Comedy Night': '/home3/live-performance.webp',
  'Standup Comedy': '/home3/live-performance.webp',
  'Pop Up': '/home3/rooftop.webp',
};

export function getCategoryTagline(primary: string): string {
  return TAGLINES[primary] ?? 'On in the city today.';
}

export function getCategoryFallbackImage(primary: string): string {
  return FALLBACK_IMAGES[primary] ?? '/home3/friends-night.webp';
}
