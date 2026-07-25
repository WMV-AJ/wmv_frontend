import type { MetadataRoute } from 'next';
import { VIBES_DATA } from '@/config/vibes-data';
import { getActiveCities, hasStaticCityConfig } from '@/lib/server-data';
import { getCityConfig } from '@/config/cities.config';
import { slugifyArea } from '@/lib/areas';

// Re-generate at most hourly; city/vibe/area sets change rarely.
export const revalidate = 3600;

const BASE = 'https://wheresmyvibe.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cities = await getActiveCities();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/how-it-works`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/list-your-venue`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  for (const { slug } of cities) {
    entries.push(
      { url: `${BASE}/${slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
      { url: `${BASE}/${slug}/map`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
      { url: `${BASE}/${slug}/cards`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    );

    // City × vibe SEO pages ("Brunches in Dubai") — the money pages.
    for (const vibe of VIBES_DATA) {
      entries.push({
        url: `${BASE}/${slug}/vibe/${vibe.id}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }

    // City × area pages — only for cities with a REAL static config entry;
    // dynamic cities fall back to the default city's config, whose areas[]
    // would be another city's neighbourhoods.
    if (hasStaticCityConfig(slug)) {
      for (const area of getCityConfig(slug).areas) {
        entries.push({
          url: `${BASE}/${slug}/area/${slugifyArea(area.name)}`,
          lastModified: now,
          changeFrequency: 'daily',
          priority: 0.7,
        });
      }
    }
  }

  // Individual events are deliberately excluded in v1: high churn, thin
  // content, and the event pages are client-rendered. Revisit post-SSR.
  return entries;
}
