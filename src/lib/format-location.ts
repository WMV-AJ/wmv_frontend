/**
 * Middle-shorten a venue location string so the START and END survive —
 * the tail is the area name ("…, Indiranagar"), which is the part users
 * actually navigate by, so plain end-ellipsis was cutting the wrong side.
 *
 * "HAL 2nd Stage, Doopanahalli, Indiranagar" → "HAL 2nd Stage, …, Indiranagar"
 */
export function shortenLocation(loc: string | null | undefined, max = 34): string {
  if (!loc) return '';
  const clean = loc.trim();
  if (clean.length <= max) return clean;

  const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const start = parts[0];
    const end = parts[parts.length - 1];
    const joined = parts.length > 2 ? `${start}, …, ${end}` : `${start}, ${end}`;
    if (joined.length <= max) return joined;
    // Still too long — trim the start, always keep the end intact.
    const room = Math.max(max - end.length - 5, 6);
    return `${start.slice(0, room)}…, ${end}`;
  }

  // Single un-comma'd string: cut the middle out.
  const head = Math.ceil((max - 1) * 0.45);
  return `${clean.slice(0, head)}…${clean.slice(-(max - 1 - head))}`;
}

/**
 * Keep only the last N comma-separated parts of an address.
 *
 * The map card shows a real street address, and the feed's are long:
 * "Unit No 206, The Collection, UB City, 24, Vittal Mallya Rd, KG Halli,
 *  D' Souza Layout, Ashok Nagar, Bengaluru, Karnataka 560001, India"
 * runs to five lines and dominates the card. The tail is the part people
 * actually orient by, so the head is dropped rather than middle-elided.
 *
 * → "Ashok Nagar, Bengaluru, Karnataka 560001, India"
 */
export function lastAddressParts(addr: string | null | undefined, keep = 4): string {
  if (!addr) return '';
  const parts = addr.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length <= keep) return parts.join(', ');
  return parts.slice(-keep).join(', ');
}
