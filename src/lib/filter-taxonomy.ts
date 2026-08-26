/**
 * What the filter panel is allowed to offer, and how the raw column values
 * become something a person can pick from.
 *
 * Both lists here were previously derived by pushing whatever the database
 * happened to hold straight into a chip. That produced 172 area chips and 553
 * "special offers" for Bangalore alone — long enough that the panel became a
 * scroll rather than a filter.
 */

/**
 * The deal types Stage 3 writes, and what to call them on screen.
 *
 * Deliberately a fixed map rather than a prettified version of whatever string
 * arrives: an unknown type is dropped instead of becoming a chip nobody can
 * interpret. Measured on the live Bangalore data, these six cover every deal
 * present — special_offer 353, happy_hour 111, discount 105, ladies_night 40,
 * free_entry 21, cover_charge 10.
 */
export const DEAL_TYPE_LABELS: Record<string, string> = {
  happy_hour: 'Happy Hour',
  ladies_night: 'Ladies Night',
  free_entry: 'Free Entry',
  discount: 'Discount',
  '2for1': 'Buy 1 Get 1',
  bogo: 'Buy 1 Get 1',
  buy_one_get_one: 'Buy 1 Get 1',
  cover_charge: 'Cover Charge',
  special_offer: 'Special Offer',
};

/** The label a deal object should appear under, or null if we don't know it. */
export function dealLabel(deal: unknown): string | null {
  const type = (deal as { type?: unknown })?.type;
  return typeof type === 'string' ? DEAL_TYPE_LABELS[type] ?? null : null;
}

/** Every label an event qualifies for, deduplicated. */
export function dealLabelsOf(deals: unknown): string[] {
  if (!Array.isArray(deals)) return [];
  const out = new Set<string>();
  for (const d of deals) {
    const label = dealLabel(d);
    if (label) out.add(label);
  }
  return [...out];
}

/**
 * The neighbourhood a raw area string is actually in.
 *
 * `venue.area` holds Google's full sublocality chain, most specific first:
 *
 *   "4th Block, S.T. Bed, 4th Block, Koramangala"  ->  "Koramangala"
 *   "Yellappa Garden, Hanumanthappa Layout, Sivanchetti Gardens"
 *                                                  ->  "Sivanchetti Gardens"
 *
 * The last segment is the part a person would name if you asked where they
 * were going. Keeping the whole chain gave Bangalore 172 chips averaging 34
 * characters, of which Koramangala alone was twenty — including the one above,
 * which says "4th Block" twice.
 *
 * A string with no comma is already a locality and is returned unchanged.
 */
export function localityOf(rawArea: string): string {
  const parts = String(rawArea).split(',').map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : String(rawArea).trim();
}

/**
 * Raw area strings -> the localities to offer, commonest first.
 *
 * Frequency order, not alphabetical: a filter is a shortcut, and the useful
 * shortcuts are the ones that lead somewhere. Ties break alphabetically so the
 * order is stable between requests.
 *
 * Selecting a locality still matches every raw string inside it, because the
 * area filter compares with `includes()` — "Koramangala" matches all twenty of
 * its chains without the filter needing to know they exist.
 */
export function collapseAreas(rawAreas: string[]): string[] {
  const counts = new Map<string, number>();
  for (const raw of rawAreas) {
    const locality = localityOf(raw);
    if (!locality) continue;
    counts.set(locality, (counts.get(locality) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([locality]) => locality);
}
