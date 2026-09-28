// Cities the city home leaves out of its pickers (atlas select + footer)
// while their data is stale — NEXT_PUBLIC_HOME_HIDDEN_CITIES, comma-separated
// slugs, set in the deploy workflow. Config, not code: no slug is named here
// (multi-city invariant). The routes themselves keep working, and the city
// being viewed is never hidden.

const HIDDEN = new Set(
  (process.env.NEXT_PUBLIC_HOME_HIDDEN_CITIES ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

export function isHomeCityHidden(slug: string, currentCity: string): boolean {
  return slug !== currentCity && HIDDEN.has(slug.toLowerCase());
}
