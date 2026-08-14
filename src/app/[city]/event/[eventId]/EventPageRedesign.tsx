'use client';

// ─────────────────────────────────────────────────────────────────────────────
// EventPageRedesign — redesigned event detail screen.
//
// Drop-in replacement for the render body of
// src/app/[city]/event/[eventId]/EventPageClient.tsx. It keeps that file's data
// contract (same /api/event payload, same EventRecord + RelatedEvent shapes,
// same helpers) and only changes the presentation:
//
//   • hero is full-bleed media with the title, category, area and the venue
//     rating + review count sitting on top of it
//   • the old icon-per-row info list becomes a 3-column WHEN / ENTRY / DOOR
//     spec strip
//   • both media slots render as a two-up pair under the friends row
//   • AI confidence is folded into a plain-English "Where this came from" card
//   • Original post and Directions sit side by side
//   • fixed bottom action bar: Instagram · Directions · Call · Share + one
//     primary CTA that falls back Book → Call venue → Directions depending on
//     swipe_link_url / venue_phone
//   • "You may also like" closes the page
//
// Conventions followed from the existing codebase:
//   • 'use client', inline styles + a few Tailwind utility classes
//   • lucide-react icons
//   • theme tokens from @/lib/theme/tokens (T, serif)
//   • EventMedia / videoThumbUrl for all media
//   • formatPrice from @/config/cities.config
//   • 430px max-width phone column, fixed inset-0 scroll container
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Bookmark, Share2, Star, Music, MapPin, Sparkles, Phone,
  Instagram, Navigation, Ticket, Maximize2, ArrowUpRight, Globe, Tag,
} from 'lucide-react';
import { getEventCategories } from '@/lib/category-utils';
import { getCategoryColor, getHexColor, getDisplayName } from '@/lib/category-mappings';
import { T, serif } from '@/lib/theme/tokens';
import { formatPrice } from '@/config/cities.config';
import { formatDateLabel, formatTimeClean, isEventHappeningNow } from '@/lib/time-utils';
import EventMedia, { videoThumbUrl } from '@/components/shared/EventMedia';

// ── Types (mirror EventPageClient.tsx) ───────────────────────────────────────

export interface EventRecord {
  venue_id: number;
  venue_name: string;
  venue_name_original: string;
  venue_area: string;
  venue_address: string;
  venue_phone: string;
  venue_website: string;
  venue_category: string;
  venue_rating: number;
  venue_rating_count: number;
  venue_highlights: string;
  venue_atmosphere: string;
  venue_final_instagram: string;
  event_id: string;
  event_date: string;
  event_name: string;
  event_time: string;
  artist: string;
  music_genre: string;
  event_vibe: string;
  ticket_price: string;
  special_offers: string;
  website_social?: string;
  confidence_score: number;
  analysis_notes: string;
  event_categories: any;
  attributes: any;
  media_url_1: string;
  media_type_1: string;
  media_url_2: string;
  media_type_2: string;
  deals: any;
  instagram_id: string;
  swipe_link_url?: string | null;
  venue_lat?: number;
  venue_lng?: number;
  scanned_at?: string | null;
}

export interface RelatedEvent {
  event_id: string;
  event_name: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_name_original: string;
  venue_area: string;
  media_url_1: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event_categories?: any;
}

// Colored event-category pill — same palette as the list/map pills.
function CategoryPillTag({ primary }: { primary: string }) {
  const hex = getHexColor(getCategoryColor(primary));
  return (
    <span style={{
      display: 'inline-block', padding: '2px 7px', borderRadius: 999,
      background: `${hex}1f`, border: `1px solid ${hex}66`, color: hex,
      fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {getDisplayName(primary)}
    </span>
  );
}

// ── Design tokens used by this screen only ───────────────────────────────────
// Everything else comes from T in @/lib/theme/tokens:
//   bg #0a0a14 · surface #14141f · ink #f5f2ed · inkMuted #a8a2b8
//   inkFaint #5f5a70 · line #2a2638 · accent #f4c430 · live #ef4444

const MONEY = '#6ee7b7';       // entry price
const OK = '#4ade80';          // confidence bar, directions icon
const IG = '#E1306C';          // Instagram brand
const CALL = '#87ceeb';        // call icon (matches globals.css .date-icon sky)
const R_CARD = 14;             // inner card radius
const HERO_H = 360;
const BAR_H = 46;              // action-bar control height (>= 44px touch min)

const attrColors: Record<string, { bg: string; fg: string }> = {
  venue: { bg: 'rgba(107,114,128,0.16)', fg: 'rgb(156,163,175)' },
  energy: { bg: 'rgba(249,115,22,0.16)', fg: 'rgb(251,146,60)' },
  status: { bg: 'rgba(212,160,23,0.16)', fg: 'rgb(244,196,48)' },
  timing: { bg: 'rgba(59,130,246,0.16)', fg: 'rgb(96,165,250)' },
};

const dealConfig: Record<string, { label: string; bg: string; fg: string; border: string }> = {
  ladies_night: { label: 'Ladies Night', bg: 'rgba(236,72,153,0.15)', fg: 'rgb(244,114,182)', border: 'rgba(236,72,153,0.3)' },
  '2for1': { label: 'Buy 1 Get 1', bg: 'rgba(16,185,129,0.15)', fg: 'rgb(52,211,153)', border: 'rgba(16,185,129,0.3)' },
  happy_hour: { label: 'Happy Hour', bg: 'rgba(251,191,36,0.15)', fg: 'rgb(251,191,36)', border: 'rgba(251,191,36,0.3)' },
  discount: { label: 'Discount', bg: 'rgba(59,130,246,0.15)', fg: 'rgb(96,165,250)', border: 'rgba(59,130,246,0.3)' },
  free_entry: { label: 'Free Entry', bg: 'rgba(34,197,94,0.15)', fg: 'rgb(74,222,128)', border: 'rgba(34,197,94,0.3)' },
  special_offer: { label: 'Special Offer', bg: 'rgba(249,115,22,0.15)', fg: 'rgb(251,146,60)', border: 'rgba(249,115,22,0.3)' },
};

// ── Helpers (same parsing rules as EventPageClient.tsx) ──────────────────────

function parseTime(eventTime: string): { start: string; end: string } {
  if (!eventTime) return { start: '', end: '' };
  if (eventTime.includes(' - ')) {
    const [s, e] = eventTime.split(' - ');
    return { start: s?.trim() || '', end: e?.trim() || '' };
  }
  return { start: eventTime.trim(), end: '' };
}

function parseKeyedList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((o: any) => (typeof o === 'string' ? o : Object.keys(o)[0])).filter(Boolean);
    }
  } catch { /* not JSON */ }
  return [value];
}

function isVidUrl(u?: string | null) {
  return !!u && /\.(mp4|mov|webm)$/i.test(u);
}

/** "12 min ago" from an ISO timestamp; falls back to a neutral string. */
function agoLabel(iso?: string | null): string {
  if (!iso) return 'recently';
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs} hr ago` : `${Math.round(hrs / 24)} d ago`;
}

// ── Small presentational pieces ──────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
      color: T.ink, borderBottom: `1px solid ${T.line}`, paddingBottom: 8, marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

function SpecCell({
  label, value, note, valueColor = T.ink, first = false,
}: { label: string; value: string; note?: string; valueColor?: string; first?: boolean }) {
  return (
    <div style={{
      padding: first ? '14px 12px 14px 0' : '14px 12px',
      borderLeft: first ? 'none' : `1px solid ${T.line}`,
    }}>
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '1.3px', textTransform: 'uppercase', color: T.inkFaint }}>
        {label}
      </div>
      <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 18, lineHeight: 1.1, color: valueColor, marginTop: 6 }}>
        {value}
      </div>
      {note ? <div style={{ fontSize: 10, color: T.inkMuted, marginTop: 3 }}>{note}</div> : null}
    </div>
  );
}

function CircleAction({
  label, color, onClick, children,
}: { label: string; color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="active:scale-90 transition-transform"
      style={{
        width: BAR_H, height: BAR_H, borderRadius: '50%', flexShrink: 0,
        background: T.surface, border: `1px solid ${T.line}`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
      }}
    >
      {children}
    </button>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function EventPageRedesign({
  event, related = [],
}: { event: EventRecord; related?: RelatedEvent[] }) {
  const router = useRouter();
  const params = useParams();
  const city = (params?.city as string) || 'dubai';

  const [saved, setSaved] = useState(false);
  const [going, setGoing] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; isVideo: boolean } | null>(null);

  // Saves are device-local (localStorage) until accounts land.
  useEffect(() => {
    try {
      const raw = JSON.parse(window.localStorage.getItem('wmv_saved_events') || '[]');
      setSaved(Array.isArray(raw) && raw.includes(event.event_id));
    } catch { /* ignore */ }
  }, [event.event_id]);

  const toggleSaved = () => setSaved(prev => {
    const next = !prev;
    try {
      const raw = JSON.parse(window.localStorage.getItem('wmv_saved_events') || '[]');
      const arr: string[] = Array.isArray(raw) ? raw : [];
      const updated = next
        ? Array.from(new Set([...arr, event.event_id]))
        : arr.filter(id => id !== event.event_id);
      window.localStorage.setItem('wmv_saved_events', JSON.stringify(updated));
    } catch { /* ignore */ }
    return next;
  });

  const time = parseTime(event.event_time);
  const isLive = isEventHappeningNow(time.start, time.end, event.event_date);
  const venueName = event.venue_name_original || event.venue_name || 'Venue';
  const handle = (event.venue_final_instagram || venueName).replace(/^@/, '').toLowerCase();

  const heroUrl = event.media_url_1 || event.media_url_2;
  const heroIsVideo = event.media_type_1?.toUpperCase() === 'VIDEO' || isVidUrl(heroUrl);
  const hasSecondMedia = !!event.media_url_2 && event.media_url_2 !== event.media_url_1;
  const siblingImage = !isVidUrl(event.media_url_2) ? event.media_url_2 : (!isVidUrl(event.media_url_1) ? event.media_url_1 : undefined);

  const genres = event.music_genre ? event.music_genre.split(',').map(g => g.trim()).filter(Boolean) : [];
  const artists = event.artist ? event.artist.split(/[|,]/).map(a => a.trim()).filter(Boolean) : [];
  const vibes = event.event_vibe ? event.event_vibe.split('|').map(v => v.trim()).filter(Boolean) : [];
  const venueCategories = parseKeyedList(event.venue_category);
  const highlights = parseKeyedList(event.venue_highlights);
  const atmosphere = parseKeyedList(event.venue_atmosphere);
  const priceText = event.ticket_price ? formatPrice(event.ticket_price as any, city) : 'Free entry';
  const offerText = event.special_offers && !event.special_offers.toLowerCase().includes('no special')
    ? event.special_offers : '';

  const attrs = (() => {
    try {
      const parsed = typeof event.attributes === 'string' ? JSON.parse(event.attributes) : event.attributes;
      const out: { label: string; type: string }[] = [];
      (['venue', 'energy', 'status', 'timing'] as const).forEach(k => {
        (Array.isArray(parsed?.[k]) ? parsed[k] : []).forEach((label: string) => out.push({ label, type: k }));
      });
      return out;
    } catch { return []; }
  })();

  const deals = (() => {
    try {
      const parsed = typeof event.deals === 'string' ? JSON.parse(event.deals) : event.deals;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();

  // ── Primary CTA fallback chain: Book → Call venue → Directions ─────────────
  const hasBooking = !!event.swipe_link_url;
  const hasPhone = !!event.venue_phone;

  const openInstagram = () => {
    const ig = event.venue_final_instagram;
    if (!ig) return;
    window.open(ig.startsWith('http') ? ig : `https://instagram.com/${ig.replace('@', '')}`, '_blank');
  };
  const openDirections = () => {
    if (event.venue_lat && event.venue_lng) {
      const q = encodeURIComponent(venueName);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${event.venue_lat},${event.venue_lng}&query=${q}`, '_blank');
    } else if (event.venue_address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.venue_address)}`, '_blank');
    }
  };
  const call = () => { if (hasPhone) window.location.href = `tel:${event.venue_phone}`; };
  const book = () => {
    const url = event.swipe_link_url!;
    window.open(url.startsWith('http') ? url : `https://${url}`, '_blank', 'noopener,noreferrer');
  };
  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) { try { await navigator.share({ title: event.event_name, url }); return; } catch { /* cancelled */ } }
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  };

  const primary = hasBooking
    ? { label: 'Book', Icon: Ticket, onClick: book }
    : hasPhone
      ? { label: 'Call venue', Icon: Phone, onClick: call }
      : { label: 'Directions', Icon: Navigation, onClick: openDirections };

  const iconOnlyDirections = hasBooking || hasPhone;   // hidden when Directions is primary
  const iconOnlyCall = hasPhone && hasBooking;         // hidden when Call is primary

  return (
    <>
      {/* full-bleed backdrop so the gutters either side of the phone column are dark */}
      <div className="fixed inset-0" style={{ background: T.bg }} />

      <main
        className="fixed inset-0 overflow-hidden"
        style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: T.bg, color: T.ink }}
      >
        <div
          className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-thin"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
          <div style={{ paddingBottom: 104 }}>

            {/* ── HERO — full, uncropped media; title sits BELOW it ────────── */}
            <div style={{ position: 'relative', overflow: 'hidden', minHeight: heroUrl ? 120 : HERO_H, background: `linear-gradient(135deg, ${T.surfaceAlt}, ${T.bg})` }}>
              {heroUrl && (
                <EventMedia
                  src={heroUrl}
                  mediaType={event.media_type_1}
                  poster={siblingImage}
                  alt={event.event_name || 'Event'}
                  sizes="(max-width: 430px) 100vw, 430px"
                  width={860}
                  height={1075}
                  priority
                  videoAutoPlay
                  style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                />
              )}

              {/* light top scrim so the circle buttons stay legible */}
              <div
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 110, pointerEvents: 'none',
                  background: 'linear-gradient(180deg, rgba(10,10,20,0.5) 0%, transparent 100%)',
                }}
              />
              {/* bottom fade into the page so the title can start on the
                  image's last ~20% and read cleanly */}
              <div
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 230, pointerEvents: 'none',
                  background: `linear-gradient(180deg, transparent 0%, rgba(10,10,20,0.72) 38%, rgba(10,10,20,0.95) 72%, ${T.bg} 100%)`,
                }}
              />

              {/* back / save / share */}
              <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 3 }}>
                <button
                  onClick={() => router.back()}
                  aria-label="Back"
                  className="backdrop-blur-md active:scale-90 transition-transform"
                  style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(10,10,20,0.55)', border: '1px solid rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                >
                  <ArrowLeft className="w-[17px] h-[17px]" style={{ color: T.ink }} />
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={toggleSaved}
                    aria-label="Save"
                    aria-pressed={saved}
                    className="backdrop-blur-md active:scale-90 transition-transform"
                    style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(10,10,20,0.55)', border: '1px solid rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                  >
                    <Bookmark className="w-4 h-4" style={{ color: saved ? T.accent : T.ink }} fill={saved ? T.accent : 'transparent'} />
                  </button>
                  <button
                    onClick={share}
                    aria-label="Share"
                    className="backdrop-blur-md active:scale-90 transition-transform"
                    style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(10,10,20,0.55)', border: '1px solid rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                  >
                    <Share2 className="w-4 h-4" style={{ color: T.ink }} />
                  </button>
                </div>
              </div>

              {heroUrl && (
                <button
                  onClick={() => setLightbox({ url: heroUrl, isVideo: heroIsVideo })}
                  aria-label="Expand"
                  className="backdrop-blur-md"
                  style={{ position: 'absolute', top: 62, right: 16, width: 34, height: 34, borderRadius: '50%', background: 'rgba(10,10,20,0.55)', border: '1px solid rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, zIndex: 3 }}
                >
                  <Maximize2 className="w-4 h-4" style={{ color: T.ink }} />
                </button>
              )}

            </div>

            {/* title block — starts on the image's bottom ~20% (the hero's
                bottom fade keeps it readable) and flows below */}
            <div style={{ padding: '0 20px 0', marginTop: -104, position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {isLive && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 5, background: T.live, whiteSpace: 'nowrap' }}>
                      <span className="animate-pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
                      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '1.1px', color: '#fff' }}>ON NOW</span>
                    </span>
                  )}
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: T.accent, whiteSpace: 'nowrap' }}>
                    {event.event_categories?.[0]?.primary || event.venue_category}
                  </span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: T.inkFaint }} />
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: T.inkMuted, whiteSpace: 'nowrap' }}>
                    {event.venue_area}
                  </span>
                </div>

                <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 40, lineHeight: 0.96, letterSpacing: '-0.03em', margin: '12px 0 0', color: T.ink }}>
                  {event.event_name}
                </h1>

                {/* venue + rating + review count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: T.inkMuted }}>
                    at <span style={{ color: T.ink, fontWeight: 600 }}>{venueName}</span>
                  </span>
                  {event.venue_rating > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, background: 'rgba(10,10,20,0.5)', border: '1px solid rgba(255,255,255,0.16)', whiteSpace: 'nowrap' }}>
                      <Star className="w-[11px] h-[11px]" style={{ color: T.accent }} fill={T.accent} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{event.venue_rating.toFixed(1)}</span>
                      {event.venue_rating_count > 0 && (
                        <span style={{ fontSize: 11, color: T.inkMuted }}>({event.venue_rating_count.toLocaleString()})</span>
                      )}
                    </span>
                  )}
                </div>
            </div>

            {/* ── SPEC STRIP ───────────────────────────────────────────────── */}
            <div style={{ padding: '20px 20px 0' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`,
              }}>
                <SpecCell
                  first
                  label="When"
                  value={time.start ? formatTimeClean(time.start) : formatDateLabel(event.event_date)}
                  note={time.end ? `till ${formatTimeClean(time.end)}` : formatDateLabel(event.event_date)}
                />
                <SpecCell label="Entry" value={priceText || 'Free entry'} note={offerText || 'No offers listed'} valueColor={MONEY} />
                <SpecCell
                  label="Door"
                  value={attrs.find(a => a.type === 'status')?.label || 'Walk-in'}
                  note={attrs.find(a => a.type === 'timing')?.label || 'ID may be required'}
                />
              </div>
            </div>

            {/* ── FRIENDS GOING (needs a social graph; drop if not shipping) ── */}
            <div style={{ padding: '16px 20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: R_CARD, background: T.surface, border: `1px solid ${T.line}` }}>
                <div style={{ display: 'flex', flexShrink: 0 }}>
                  {[T.accent, '#22d3ee', '#f472b6'].map((c, i) => (
                    <span key={c} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: `1.5px solid ${T.surface}`, marginLeft: i ? -8 : 0 }} />
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>9 people you follow are going</div>
                  <div style={{ fontSize: 10, color: T.inkFaint, marginTop: 2 }}>Sara, Omar and 7 others saved this</div>
                </div>
                <button
                  onClick={() => setGoing(g => !g)}
                  aria-pressed={going}
                  style={{
                    flexShrink: 0, height: 32, padding: '0 14px', borderRadius: 999,
                    background: going ? T.accent : 'transparent',
                    color: going ? T.inkInverse : T.accent,
                    border: `1px solid ${going ? T.accent : 'rgba(244,196,48,0.5)'}`,
                    fontSize: 9, fontWeight: 800, letterSpacing: '1.1px', textTransform: 'uppercase',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {going ? 'Going' : "I'm in"}
                </button>
              </div>
            </div>

            {/* ── BOTH MEDIA SLOTS ─────────────────────────────────────────── */}
            {heroUrl && (
              <div style={{ padding: '18px 20px 0' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[event.media_url_1, hasSecondMedia ? event.media_url_2 : null].filter(Boolean).map((url, i) => {
                    const type = i === 0 ? event.media_type_1 : event.media_type_2;
                    const vid = type?.toUpperCase() === 'VIDEO' || isVidUrl(url as string);
                    return (
                      <div
                        key={url as string}
                        onClick={() => setLightbox({ url: url as string, isVideo: vid })}
                        style={{ position: 'relative', flex: 1, height: 168, borderRadius: R_CARD, overflow: 'hidden', border: `1px solid ${T.line}`, background: T.surface, cursor: 'pointer' }}
                      >
                        <EventMedia
                          src={url as string}
                          mediaType={type}
                          poster={siblingImage}
                          alt=""
                          sizes="(max-width: 430px) 50vw, 200px"
                          fill
                          lazyVideo
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 55%, rgba(10,10,20,0.75))' }} />
                        <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 8, fontWeight: 700, letterSpacing: '1.1px', textTransform: 'uppercase', color: T.ink }}>
                          {vid ? `Story · ${agoLabel(event.scanned_at)}` : 'Flyer · post'}
                        </div>
                        <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'rgba(10,10,20,0.55)', border: '1px solid rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Maximize2 className="w-[11px] h-[11px]" style={{ color: T.ink }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── THE NIGHT (artists / genres / attributes) ─────────────────── */}
            {(artists.length > 0 || genres.length > 0 || vibes.length > 0 || attrs.length > 0) && (
              <div style={{ padding: '22px 20px 0' }}>
                <SectionLabel>The night</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {artists.map(a => (
                    <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(212,160,23,0.14)', color: T.accent, border: '1px solid rgba(212,160,23,0.3)' }}>
                      <Music className="w-[11px] h-[11px]" />{a}
                    </span>
                  ))}
                  {genres.map(g => (
                    <span key={g} style={{ padding: '6px 11px', borderRadius: 999, fontSize: 12, color: T.inkMuted, border: '1px solid rgba(255,255,255,0.14)' }}>{g}</span>
                  ))}
                  {vibes.map(v => (
                    <span key={v} style={{ padding: '6px 11px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(236,72,153,0.14)', color: 'rgb(249,168,212)', border: '1px solid rgba(236,72,153,0.3)' }}>{v}</span>
                  ))}
                  {attrs.map(t => {
                    const c = attrColors[t.type] || attrColors.venue;
                    return (
                      <span key={`${t.type}-${t.label}`} style={{ padding: '6px 11px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: c.bg, color: c.fg }}>{t.label}</span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── OFFERS ───────────────────────────────────────────────────── */}
            {(deals.length > 0 || offerText) && (
              <div style={{ padding: '22px 20px 0' }}>
                <SectionLabel>Offers</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(deals.length > 0 ? deals : [{ type: 'special_offer', description: offerText, timing: '' }]).map((d: any, i: number) => {
                    const c = dealConfig[d.type] || { label: String(d.type || 'Offer').replace(/_/g, ' '), bg: 'rgba(255,255,255,0.1)', fg: T.inkMuted, border: 'rgba(255,255,255,0.2)' };
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: R_CARD, background: T.surface, border: `1px solid ${T.line}` }}>
                        <span style={{ flexShrink: 0, padding: '4px 9px', borderRadius: 5, fontSize: 8, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', background: c.bg, color: c.fg, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>
                          {c.label}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: T.ink, lineHeight: 1.4 }}>{d.description}</div>
                          {d.timing ? <div style={{ fontSize: 10, color: T.inkFaint, marginTop: 4 }}>{d.timing}</div> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── WHERE THIS CAME FROM (confidence, in words) ───────────────── */}
            <div style={{ padding: '22px 20px 0' }}>
              <SectionLabel>Where this came from</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: R_CARD, background: T.surface, border: `1px solid ${T.line}` }}>
                {/* mini radar — reuses the wmv-spin / wmv-pulse keyframes in globals.css */}
                <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(from 0deg, transparent 80%, ${T.accent}66 100%)`, animation: 'wmv-spin 4s linear infinite' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', width: 6, height: 6, margin: '-3px 0 0 -3px', borderRadius: '50%', background: T.accent, boxShadow: `0 0 8px ${T.accent}`, animation: 'wmv-pulse 2s infinite' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>Read from @{handle}&rsquo;s story</div>
                  <div style={{ fontSize: 10, color: T.inkFaint, marginTop: 3 }}>
                    Scanned {agoLabel(event.scanned_at)}
                    {event.confidence_score ? ` · ${event.confidence_score}% confident on the details` : ''}
                  </div>
                  {!!event.confidence_score && (
                    <div style={{ width: '100%', height: 3, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.08)', marginTop: 8 }}>
                      <div style={{ height: '100%', borderRadius: 999, background: OK, width: `${Math.min(event.confidence_score, 100)}%` }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Original post + Directions, side by side */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {event.instagram_id && (
                  <a
                    href={`https://www.instagram.com/p/${event.instagram_id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: R_CARD, background: T.surface, border: `1px solid ${T.line}`, textDecoration: 'none', boxSizing: 'border-box' }}
                  >
                    <Instagram className="w-[18px] h-[18px] flex-shrink-0" style={{ color: IG }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>Original post</div>
                      <div style={{ fontSize: 10, color: T.inkFaint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        instagram.com/p/{event.instagram_id}
                      </div>
                    </div>
                  </a>
                )}
                <button
                  onClick={openDirections}
                  style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: R_CARD, background: T.surface, border: `1px solid ${T.line}`, cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}
                >
                  <Navigation className="w-[18px] h-[18px] flex-shrink-0" style={{ color: OK }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>Directions</div>
                    <div style={{ fontSize: 10, color: T.inkFaint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.venue_area}</div>
                  </div>
                </button>
              </div>

              {/* Event website / social (was on the old page) */}
              {event.website_social && (
                <a
                  href={event.website_social.startsWith('http') ? event.website_social : `https://${event.website_social}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: R_CARD, background: T.surface, border: `1px solid ${T.line}`, textDecoration: 'none', marginTop: 8 }}
                >
                  <Globe className="w-[18px] h-[18px] flex-shrink-0" style={{ color: '#60a5fa' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: T.ink, fontWeight: 600 }}>Event site</div>
                    <div style={{ fontSize: 10, color: T.inkFaint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.website_social.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                    </div>
                  </div>
                </a>
              )}
            </div>

            {/* ── VENUE ────────────────────────────────────────────────────── */}
            <div style={{ padding: '22px 20px 0' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.ink, borderBottom: `1px solid ${T.line}`, paddingBottom: 8, marginBottom: 6 }}>
                Venue details
              </div>
              {event.venue_address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: `1px solid ${T.lineFaint}` }}>
                  <MapPin className="w-[15px] h-[15px] flex-shrink-0 mt-0.5" style={{ color: T.inkFaint }} />
                  <span style={{ fontSize: 13, color: T.inkMuted, lineHeight: 1.4 }}>{event.venue_address}</span>
                </div>
              )}
              {(highlights.length > 0 || atmosphere.length > 0) && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: `1px solid ${T.lineFaint}` }}>
                  <Sparkles className="w-[15px] h-[15px] flex-shrink-0 mt-0.5" style={{ color: T.inkFaint }} />
                  <span style={{ fontSize: 13, color: T.inkMuted, lineHeight: 1.4 }}>
                    {[...highlights, ...atmosphere].join(' · ')}
                  </span>
                </div>
              )}
              {venueCategories.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: `1px solid ${T.lineFaint}` }}>
                  <Tag className="w-[15px] h-[15px] flex-shrink-0 mt-0.5" style={{ color: T.inkFaint }} />
                  <span style={{ fontSize: 13, color: T.inkMuted, lineHeight: 1.4 }}>{venueCategories.join(', ')}</span>
                </div>
              )}
              {hasPhone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${T.lineFaint}` }}>
                  <Phone className="w-[15px] h-[15px] flex-shrink-0" style={{ color: T.inkFaint }} />
                  <span style={{ fontSize: 13, color: T.inkMuted }}>{event.venue_phone}</span>
                </div>
              )}
              {event.venue_website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
                  <Globe className="w-[15px] h-[15px] flex-shrink-0" style={{ color: T.inkFaint }} />
                  <a
                    href={event.venue_website.startsWith('http') ? event.venue_website : `https://${event.venue_website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13, color: '#60a5fa', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    onClick={e => e.stopPropagation()}
                  >
                    {event.venue_website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              )}
            </div>

            {/* ── YOU MAY ALSO LIKE ────────────────────────────────────────── */}
            {related.length > 0 && (
              <div style={{ padding: '22px 20px 0' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.ink, borderBottom: `1px solid ${T.line}`, paddingBottom: 8, marginBottom: 4 }}>
                  You may also like
                </div>
                {related.map(r => {
                  const rt = parseTime(r.event_time);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const rCat = getEventCategories(r as any)[0]?.primary ?? null;
                  return (
                    <div
                      key={r.event_id}
                      onClick={() => router.push(`/${city}/event/${r.event_id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.lineFaint}`, cursor: 'pointer' }}
                    >
                      {/* Thumbnail (as on the old page) */}
                      <div style={{ position: 'relative', width: 55, height: 55, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)' }}>
                        {r.media_url_1 ? (
                          <EventMedia
                            src={r.media_url_1}
                            alt={r.event_name || ''}
                            sizes="96px"
                            fill
                            lazyVideo
                          />
                        ) : (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Music className="w-5 h-5" style={{ color: T.inkFaint }} />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: T.accent, whiteSpace: 'nowrap' }}>
                            {formatDateLabel(r.event_date)}{rt.start ? ` · ${formatTimeClean(rt.start)}` : ''}
                          </span>
                          {rCat && <CategoryPillTag primary={rCat} />}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.event_name}
                        </div>
                        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13, color: T.inkMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.venue_name_original || r.venue_name}
                        </div>
                      </div>
                      <ArrowUpRight className="w-3 h-3 flex-shrink-0" style={{ color: T.inkFaint }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── FIXED ACTION BAR ───────────────────────────────────────────────
            Instagram · Directions · Call · Share + primary CTA.
            Primary falls back Book → Call venue → Directions; whichever is
            primary is removed from the circle row so nothing doubles up. */}
        <div
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20,
            padding: '12px 14px max(16px, env(safe-area-inset-bottom))',
            background: 'linear-gradient(180deg, rgba(10,10,20,0) 0%, rgba(10,10,20,0.94) 34%)',
          }}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: 6, borderRadius: 999,
              background: 'rgba(28,28,42,0.97)', border: `1px solid ${T.line}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
          {event.venue_final_instagram && (
            <CircleAction label="Instagram" color={IG} onClick={openInstagram}>
              <Instagram className="w-[18px] h-[18px]" />
            </CircleAction>
          )}
          {iconOnlyDirections && (
            <CircleAction label="Directions" color={OK} onClick={openDirections}>
              <Navigation className="w-[18px] h-[18px]" />
            </CircleAction>
          )}
          {iconOnlyCall && (
            <CircleAction label="Call" color={CALL} onClick={call}>
              <Phone className="w-[18px] h-[18px]" />
            </CircleAction>
          )}
          <CircleAction label="Share" color={T.inkMuted} onClick={share}>
            <Share2 className="w-[18px] h-[18px]" />
          </CircleAction>

          <button
            onClick={primary.onClick}
            style={{
              flex: 1, minWidth: 0, height: BAR_H, borderRadius: 999,
              background: T.accent, color: T.inkInverse, border: 'none',
              fontSize: 11, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 7, whiteSpace: 'nowrap', padding: '0 12px',
            }}
          >
            <primary.Icon className="w-[15px] h-[15px] flex-shrink-0" />
            {primary.label}
          </button>
          </div>
        </div>
      </main>

      {/* ── LIGHTBOX (same behaviour as EventPageClient.tsx) ─────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.95)' }}
          onClick={() => setLightbox(null)}
        >
          <div style={{ width: '100%', maxWidth: 430, padding: '0 16px' }} onClick={e => e.stopPropagation()}>
            {lightbox.isVideo ? (
              <video
                src={lightbox.url}
                className="w-full max-h-[85vh] rounded-lg"
                controls
                autoPlay
                loop
                playsInline
                poster={videoThumbUrl(lightbox.url, siblingImage)}
              />
            ) : (
              <img src={lightbox.url} alt={event.event_name} className="w-full max-h-[90vh] object-contain rounded-lg" style={{ touchAction: 'pinch-zoom' }} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
