// Single source of truth for the event/venue media fallback.
//
// Previously four components hotlinked third-party placeholder URLs
// (gstatic/musement/audleytravel) — an extra DNS+TLS handshake on every
// broken image, and assets we don't control. This is a 5KB branded local
// asset served from our own origin (see public/placeholder-event.jpg).
export const PLACEHOLDER_IMAGE = '/placeholder-event.jpg';
