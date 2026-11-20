import type { MetadataRoute } from 'next';
import { VIBES_DATA, matchesVibe } from '@/config/vibes-data';
import { getActiveCities, getCityEvents, getCityServerConfig } from '@/lib/server-data';
import { slugifyArea } from '@/lib/areas';
import { cityToday, onDates, THIN_PAGE_MIN_EVENTS, toSeoEvents, upcoming, weekendDates } from '@/lib/seo-events';

// Re-generate at most hourly; event and area sets change through the day.
export const revalidate = 3600;

const BASE = 'https://wheresmyvibe.com';

type Entry = MetadataRoute.Sitemap[number];

/** List pages go in only when they hold enough events to be worth indexing (matches their noindex rule). */
function listEntry(url: string, count: number, lastModified: Date, priority: number): Entry[] {
  return count >= THIN_PAGE_MIN_EVENTS ? [{ url, lastModified, changeFrequency: 'daily', priority }] : [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cities = await getActiveCities();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/how-it-works`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/list-your-venue`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/data-deletion`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  for (const { slug } of cities) {
    const [cfg, raw] = await Promise.all([getCityServerConfig(slug), getCityEvents(slug)]);
    const today = cityToday(cfg);
    const events = upcoming(toSeoEvents(raw, cfg), today);

    entries.push(
      { url: `${BASE}/${slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
      { url: `${BASE}/${slug}/map`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
      ...listEntry(`${BASE}/${slug}/tonight`, onDates(events, [today]).length, now, 0.9),
      ...listEntry(`${BASE}/${slug}/this-weekend`, onDates(events, weekendDates(today)).length, now, 0.9),
      ...listEntry(`${BASE}/${slug}/free-events`, events.filter((e) => e.free).length, now, 0.8),
    );

    // City × vibe pages ("Brunches in Dubai").
    for (const vibe of VIBES_DATA) {
      const count = events.filter((e) => matchesVibe(e.raw, vibe)).length;
      entries.push(...listEntry(`${BASE}/${slug}/vibe/${vibe.id}`, count, now, 0.8));
    }

    // City × area pages, from the areas that actually have events. Static
    // config only knows Dubai's neighbourhoods.
    const perArea = new Map<string, number>();
    for (const event of events) {
      if (!event.area) continue;
      const areaSlug = slugifyArea(event.area);
      if (areaSlug) perArea.set(areaSlug, (perArea.get(areaSlug) ?? 0) + 1);
    }
    for (const [areaSlug, count] of perArea) {
      entries.push(...listEntry(`${BASE}/${slug}/area/${areaSlug}`, count, now, 0.7));
    }

    // One page per upcoming event. Past events drop out on their own.
    for (const event of events) {
      const updated = event.raw.event_updated_at || event.raw.event_created_at;
      const lastModified = updated && !Number.isNaN(new Date(updated).getTime()) ? new Date(updated) : now;
      entries.push({ url: `${BASE}/${slug}/event/${event.id}`, lastModified, changeFrequency: 'weekly', priority: 0.5 });
    }
  }

  return entries;
}
