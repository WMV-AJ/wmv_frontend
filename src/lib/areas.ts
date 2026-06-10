// Helpers for the per-area listing page (/[city]/area/[areaSlug]).
// Areas aren't a static config like vibes — they're just `venue.area` strings
// derived from the data — so we slugify for clean URLs and reverse-look-up the
// real area name from the loaded venues.

export function slugifyArea(area: string): string {
  return area
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Find the original area label whose slug matches `slug`, from loaded venues. */
export function findAreaBySlug(
  venues: Array<{ area?: string | null }>,
  slug: string,
): string | undefined {
  for (const v of venues) {
    if (v.area && slugifyArea(v.area) === slug) return v.area;
  }
  return undefined;
}

/** Title-case a slug for display before venue data has loaded. */
export function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
