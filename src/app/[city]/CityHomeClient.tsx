'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useVenueData } from '@/contexts/VenueDataContext';
import { getCityConfig, type CitySlug } from '@/config/cities.config';
import { getCityDateString } from '@/lib/city-date';
import {
  Heart,
  ArrowUpRight,
  Search,
  ChevronRight,
} from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';
import HomeMasthead from '@/components/navigation/HomeMasthead';
import NavPill from '@/components/navigation/NavPill';
import EventMedia from '@/components/shared/EventMedia';
import { VIBES, matchesVibe } from '@/config/vibes';
import { getEventCategories } from '@/lib/category-utils';
import { getCategoryColor, getHexColor, getDisplayName } from '@/lib/category-mappings';

// ── THEME TOKENS ─────────────────────────────────────────────────────
const T = {
  bg: '#0a0a14',
  surface: '#14141f',
  surfaceAlt: '#1c1c2a',
  overlay: 'rgba(255,255,255,0.04)',

  ink: '#f5f2ed',
  inkMuted: '#a8a2b8',
  inkFaint: '#5f5a70',
  inkInverse: '#0a0a14',

  line: '#2a2638',
  lineFaint: 'rgba(255,255,255,0.08)',
  crosshair: 'rgba(255,255,255,0.06)',

  accent: '#f4c430',
  accentSoft: 'rgba(244, 196, 48,0.18)',
  live: '#ef4444',
  pink: '#ec4899',

  chipLight: '#f5f2ed',
};

const mono = "var(--font-geist-sans), ui-monospace, monospace";
const serif = "var(--font-playfair), 'Playfair Display', Georgia, serif";

// ── VIBE GRID CONFIG ──────────────────────────────────────────────────
// VIBES + matchesVibe live in '@/config/vibes' so the homepage pill counts
// and the /[city]/vibe/[vibeId] listing page stay in sync.

const RADAR_DOTS = [
  { t: '22%', l: '32%', c: '#f4c430' },
  { t: '58%', l: '68%', c: '#22d3ee' },
  { t: '38%', l: '78%', c: '#f97316' },
  { t: '72%', l: '38%', c: '#84cc16' },
  { t: '50%', l: '22%', c: '#f472b6' },
  { t: '28%', l: '58%', c: '#ec4899' },
  { t: '68%', l: '82%', c: '#f4c430' },
];

// Deal chip labels/colors — mirrors MobileEventCard's dealConfig.
const DEAL_LABELS: Record<string, { label: string; rgb: string }> = {
  ladies_night: { label: 'Ladies Night', rgb: '236, 72, 153' },
  '2for1': { label: 'Buy 1 Get 1', rgb: '16, 185, 129' },
  happy_hour: { label: 'Happy Hour', rgb: '251, 191, 36' },
  discount: { label: 'Discount', rgb: '59, 130, 246' },
  free_entry: { label: 'Free Entry', rgb: '34, 197, 94' },
  special_offer: { label: 'Special Offer', rgb: '249, 115, 22' },
};

// ── HELPERS ───────────────────────────────────────────────────────────

function getCityHour(city: CitySlug | string): number {
  const offsetHours = getCityConfig(city).utcOffsetHours;
  const now = new Date();
  const cityMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + offsetHours * 60) % (24 * 60);
  return cityMinutes / 60;
}

function parseTimeHours(s: string): number | null {
  const m = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const p = m[3].toUpperCase();
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return h + min / 60;
}

function isLiveNow(
  eventDate: string | null | undefined,
  eventTime: string | null | undefined,
  todayStr: string,
  dubaiHour: number
): boolean {
  if (!eventDate) return false;
  const d = new Date(eventDate);
  const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  if (dateStr !== todayStr) return false;
  if (!eventTime) return false;

  const t = eventTime.trim().toLowerCase();
  if (t === 'all day') return true;

  const parts = eventTime.split('-').map(p => p.trim());
  const startH = parseTimeHours(parts[0] || '');
  if (startH === null) return false;

  let endH: number;
  const endPart = parts[1] || '';
  const eL = endPart.toLowerCase();
  if (eL.includes('late') || eL.includes('sunrise') || eL.includes('sunset')) {
    endH = startH + 6;
  } else {
    const parsed = parseTimeHours(endPart);
    if (parsed === null) return dubaiHour >= startH;
    endH = parsed < startH ? parsed + 24 : parsed;
  }

  const h = dubaiHour < startH ? dubaiHour + 24 : dubaiHour;
  return h >= startH && h < endH;
}

function utcDateKey(eventDate: string): string | null {
  const d = new Date(eventDate);
  if (isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPrimaryCat(e: any): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cats = getEventCategories(e as any);
  return cats[0]?.primary ?? null;
}

// ── SMALL BUILDING BLOCKS ─────────────────────────────────────────────

function SectionHeader({ label, right, onClick }: {
  label: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${T.line}`, paddingBottom: 8, marginBottom: 12,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        {label}
      </div>
      {right}
    </div>
  );
}

// Horizontal rail with a right-edge fade + chevron so it's obvious the row
// scrolls. Affordance hides once the user reaches the end (or when the
// content doesn't overflow at all).
function HScrollRail({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [showHint, setShowHint] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    const overflowing = el.scrollWidth > el.clientWidth + 8;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    setShowHint(overflowing && !atEnd);
  };

  // Re-measure whenever the rendered children change (data arriving).
  useEffect(() => { update(); });

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={ref}
        onScroll={update}
        style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', scrollSnapType: 'x mandatory', paddingBottom: 4 }}
      >
        {children}
      </div>
      {showHint && (
        <>
          <div style={{
            position: 'absolute', top: 0, bottom: 4, right: 0, width: 44,
            pointerEvents: 'none',
            background: `linear-gradient(to left, ${T.bg}, transparent)`,
          }} />
          <button
            aria-label="Scroll right"
            onClick={() => ref.current?.scrollBy({ left: (ref.current?.clientWidth ?? 200) * 0.8, behavior: 'smooth' })}
            style={{
              position: 'absolute', top: '50%', right: 4, transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: '50%', padding: 0,
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <ChevronRight size={15} color="#fff" />
          </button>
        </>
      )}
    </div>
  );
}

// Colored event-category pill — same palette as the list/map CategoryPills.
function CategoryPillTag({ primary, small }: { primary: string; small?: boolean }) {
  const hex = getHexColor(getCategoryColor(primary));
  return (
    <span style={{
      display: 'inline-block', padding: small ? '2px 7px' : '3px 9px', borderRadius: 999,
      background: `${hex}1f`, border: `1px solid ${hex}66`, color: hex,
      fontFamily: mono, fontSize: small ? 8 : 9, fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {getDisplayName(primary)}
    </span>
  );
}

// ── COMPONENT ─────────────────────────────────────────────────────────
export default function CityHome() {
  const router = useRouter();
  const params = useParams();
  const city = (params?.city as string) || 'dubai';

  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [totalVenues, setTotalVenues] = useState<number>(0);
  const [searchQ, setSearchQ] = useState('');
  const heroRef = useRef<HTMLDivElement | null>(null);

  // Venue data comes from the shared VenueDataProvider (root layout) — this
  // page used to fire its own /api/venues fetch concurrently with the
  // provider's, doubling upstream load on every home visit (the thundering
  // herd behind the intermittent 503s).
  const { allVenues, isLoadingVenues } = useVenueData();
  const loading = isLoadingVenues;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const venues = useMemo<any[]>(() => {
    // "Upcoming" is anchored to the CITY's calendar day, not the viewer's:
    // a viewer in IST at 00:30 looking at Dubai (UTC+4, still yesterday
    // evening there) must NOT have Dubai's tonight filtered out as "past".
    // Event dates are compared as UTC date-parts (they parse as UTC midnight).
    const cityToday = getCityDateString(city); // YYYY-MM-DD in the city's tz
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (allVenues as any[]).filter((v) => {
      if (!v.event_date) return true;
      const ds = utcDateKey(v.event_date);
      return !ds || ds >= cityToday;
    });
  }, [allVenues, city]);

  const toggle = (id: string) =>
    setLiked(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  useEffect(() => {
    fetch(`/api/venue-count?city=${encodeURIComponent(city)}`)
      .then(r => r.json())
      .then(vc => { if (vc.count) setTotalVenues(vc.count); })
      .catch(console.error);
    // Landing page + marketing sections follow the visitor's last city.
    try { window.localStorage.setItem('wmv_last_city', city); } catch { /* ignore */ }
  }, [city]);

  const todayStr = getCityDateString(city);
  const dubaiHour = getCityHour(city);

  const todayVenues = venues.filter(v => {
    if (!v.event_date) return false;
    return utcDateKey(v.event_date) === todayStr;
  });

  const storiesData = (() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const venueMap = new Map<number, any>();
    todayVenues.forEach(v => {
      if (!venueMap.has(v.venue_id)) venueMap.set(v.venue_id, v);
    });
    return Array.from(venueMap.values())
      .sort((a, b) => {
        const liveA = isLiveNow(a.event_date, a.event_time, todayStr, dubaiHour) ? 1 : 0;
        const liveB = isLiveNow(b.event_date, b.event_time, todayStr, dubaiHour) ? 1 : 0;
        if (liveA !== liveB) return liveB - liveA;
        const startA = parseTimeHours((a.event_time || '').split('-')[0]?.trim() || '') ?? 99;
        const startB = parseTimeHours((b.event_time || '').split('-')[0]?.trim() || '') ?? 99;
        if (startA !== startB) return startA - startB;
        const ra = a.rating ?? 0, rb = b.rating ?? 0;
        if (ra !== rb) return rb - ra;
        return (a.venue_id ?? 0) - (b.venue_id ?? 0);
      })
      .slice(0, 8)
      .map(v => ({
        id: String(v.venue_id ?? v.event_id ?? Math.random()),
        event_id: v.event_id,
        venue_id: v.venue_id,
        place_id: v.place_id,
        event_date: v.event_date,
        venue: v.name || 'Venue',
        user: v.final_instagram ? v.final_instagram.replace(/^@/, '') : (v.name || 'venue').toLowerCase().replace(/\s+/g, ''),
        color: '#f4c430',
        mediaUrl: v.media_url_1 || null,
        mediaType: v.media_type_1 || null,
        // Sibling image doubles as the poster when slot 1 is a video.
        posterUrl: v.media_type_2 !== 'video' ? (v.media_url_2 || null) : null,
        isLive: isLiveNow(v.event_date, v.event_time, todayStr, dubaiHour),
      }));
  })();

  const tonightEvents = todayVenues
    .filter(v => {
      if (!v.event_time) return false;
      const t = v.event_time.trim().toLowerCase();
      if (t === 'all day') return true;
      const parts = v.event_time.split('-').map((p: string) => p.trim());
      const startH = parseTimeHours(parts[0] || '');
      return startH !== null && startH >= 18;
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => {
      const sa = parseTimeHours((a.event_time || '').split('-')[0]?.trim() || '') ?? 99;
      const sb = parseTimeHours((b.event_time || '').split('-')[0]?.trim() || '') ?? 99;
      if (sa !== sb) return sa - sb;
      const ra = a.rating ?? 0, rb = b.rating ?? 0;
      if (ra !== rb) return rb - ra;
      return (a.venue_id ?? 0) - (b.venue_id ?? 0);
    });

  const tonightVenueCount = new Set(tonightEvents.map(e => e.venue_id)).size;

  // Events running RIGHT NOW (city clock), deduped by event.
  const happeningNow = (() => {
    const seen = new Set<string>();
    return venues
      .filter(v => isLiveNow(v.event_date, v.event_time, todayStr, dubaiHour))
      .filter(v => {
        const k = String(v.event_id ?? v.venue_id);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) =>
        (parseTimeHours((a.event_time || '').split('-')[0]?.trim() || '') ?? 99) -
        (parseTimeHours((b.event_time || '').split('-')[0]?.trim() || '') ?? 99));
  })();

  // Tonight's events that carry a deal. NOTE: home rows have `special_offers`
  // (the `event_offers` rename happens later in the stacked-card adapter).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dealsTonight = tonightEvents.filter((e: any) => {
    if (Array.isArray(e.deals) && e.deals.length > 0) return true;
    const so = e.special_offers ? String(e.special_offers) : '';
    return !!so && !so.toLowerCase().includes('no special');
  });

  // THIS weekend only (Fri/Sat/Sun of the current week, city-anchored).
  // Once the weekend is underway, only the remaining days show — e.g. on a
  // Saturday you get Saturday + Sunday, never next week's Friday.
  const weekendByDay = (() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const anchor = new Date(`${todayStr}T00:00:00Z`);
    const dow = anchor.getUTCDay();
    // Offset from today to THIS weekend's Friday (negative once the weekend
    // has started: Sat → -1, Sun → -2).
    const fridayOffset = dow === 6 ? -1 : dow === 0 ? -2 : 5 - dow;
    return [0, 1, 2]
      .map(i => {
        const d = new Date(anchor);
        d.setUTCDate(d.getUTCDate() + fridayOffset + i);
        const ds = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        return { ds, label: `${dayNames[d.getUTCDay()]} · ${d.getUTCDate()} ${monthNames[d.getUTCMonth()]}` };
      })
      .filter(({ ds }) => ds >= todayStr) // drop weekend days already past
      .map(({ ds, label }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = new Map<string, any>();
        venues.forEach(v => {
          if (!v.event_date || utcDateKey(v.event_date) !== ds) return;
          const key = `${v.venue_id}-${ds}`;
          if (!map.has(key)) map.set(key, v);
        });
        const events = Array.from(map.values()).sort((a, b) => (a.event_time || '').localeCompare(b.event_time || ''));
        return { ds, label, events };
      });
  })();

  const areaMap = new Map<string, number>();
  venues.forEach(v => {
    if (v.area) areaMap.set(v.area, (areaMap.get(v.area) || 0) + 1);
  });
  const areas = Array.from(areaMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, count }));

  const vibeGrid = VIBES.map(v => ({
    ...v,
    count: venues.filter(venue => matchesVibe(venue, v)).length,
  }));

  const skeletonStyle = (w: string | number, h: string | number | undefined, extra?: React.CSSProperties): React.CSSProperties => ({
    width: w,
    height: h,
    background: 'linear-gradient(90deg, #1c1c2a 25%, #2a2638 50%, #1c1c2a 75%)',
    backgroundSize: '200% 100%',
    animation: 'wmv-shimmer 1.4s infinite',
    borderRadius: 2,
    ...extra,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEvent = (e: any, source: string) => {
    if (!e.event_id) return;
    trackEvent('view_event', { event_id: e.event_id, venue_id: e.venue_id, place_id: e.place_id, event_date: e.event_date, source });
    router.push(`/${city}/event/${e.event_id}`);
  };

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        background: T.bg,
        color: T.ink,
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes wmv-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes wmv-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes wmv-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <div style={{ maxWidth: 430, margin: '0 auto', paddingBottom: 40 }}>

        {/* Masthead */}
        <HomeMasthead city={city} from="home" />

        {/* Hero — radar + title */}
        <div ref={heroRef} style={{ position: 'relative', padding: '20px 18px 0' }}>
          <div style={{
            position: 'absolute', top: 6, right: -70, width: 300, height: 300,
            pointerEvents: 'none', opacity: 0.9,
          }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                position: 'absolute', inset: `${i * 24}px`, borderRadius: '50%',
                border: `1px solid rgba(255,255,255,${0.14 - i * 0.022})`,
              }} />
            ))}
            <div style={{
              position: 'absolute', top: '50%', left: '50%', width: 12, height: 12,
              marginTop: -6, marginLeft: -6, borderRadius: '50%',
              background: T.accent, boxShadow: `0 0 16px ${T.accent}80`,
              animation: 'wmv-pulse 2s infinite',
            }} />
            {RADAR_DOTS.map((d, i) => (
              <div key={i} style={{
                position: 'absolute', top: d.t, left: d.l, width: 7, height: 7, borderRadius: '50%',
                background: d.c, boxShadow: `0 0 10px ${d.c}`,
                animation: `wmv-pulse 2s infinite ${i * 0.25}s`,
              }} />
            ))}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: `conic-gradient(from 0deg, transparent 82%, ${T.accent}33 95%, ${T.accent}66 100%)`,
              animation: 'wmv-spin 4s linear infinite',
            }} />
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: T.crosshair }} />
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: T.crosshair }} />
          </div>

          {/* Warm gold glow behind the headline */}
          <div aria-hidden style={{
            position: 'absolute', left: -60, top: -20, width: 320, height: 300,
            background: `radial-gradient(ellipse 60% 50% at 35% 40%, ${T.accent}14, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Live badge with the city's actual day + date */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.live }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.live, animation: 'wmv-pulse 1.5s infinite', display: 'inline-block' }} />
              Live · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
            {/* City-first headline — the city IS the product */}
            <h1 style={{
              fontFamily: serif, fontStyle: 'italic', fontWeight: 400,
              fontSize: 54, lineHeight: 0.94, margin: '14px 0 0',
              letterSpacing: '-0.035em', color: T.ink,
            }}>
              Tonight in<br />
              <span style={{
                color: T.accent,
                textShadow: `0 0 40px ${T.accent}40`,
              }}>{getCityConfig(city).displayName}</span>
            </h1>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 500, letterSpacing: '0.8px', textTransform: 'uppercase', color: T.inkMuted, marginTop: 14, maxWidth: 230, lineHeight: 1.5 }}>
              Every venue&rsquo;s stories — scanned, sorted &amp; mapped live.
            </div>
            {/* Source ticker: what feeds the radar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 12, maxWidth: 250 }}>
              {[
                ['IG stories', '#ec4899'],
                ['IG posts', '#eab308'],
                ['Ticketing', '#10b981'],
                ['Venue sites', '#f97316'],
              ].map(([label, color]) => (
                <span key={label} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 8px', borderRadius: 999,
                  border: `1px solid ${color}44`, background: `${color}12`,
                  fontFamily: mono, fontSize: 8, fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase', color: T.inkMuted,
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: color as string, boxShadow: `0 0 6px ${color}` }} />
                  {label}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => {
                  trackEvent('nav_view_change', { from: 'home', to: 'map', source: 'hero_cta' });
                  router.push(`/${city}/map`);
                }}
                style={{
                  fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
                  textTransform: 'uppercase', cursor: 'pointer', border: 'none',
                  padding: '7px 11px', borderRadius: 7, lineHeight: 1,
                  background: T.accent, color: '#0a0a14',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}
              >
                Explore on Maps
                <ArrowUpRight size={11} strokeWidth={2.5} style={{ flexShrink: 0 }} />
              </button>
              <button
                onClick={() => {
                  trackEvent('nav_view_change', { from: 'home', to: 'cards', source: 'hero_cta' });
                  router.push(`/${city}/cards`);
                }}
                style={{
                  fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
                  textTransform: 'uppercase', cursor: 'pointer', lineHeight: 1,
                  padding: '7px 11px', borderRadius: 7,
                  background: 'transparent', color: T.accent,
                  border: `1px solid ${T.accent}`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}
              >
                Today&rsquo;s Vibe
                <ArrowUpRight size={11} strokeWidth={2.5} style={{ flexShrink: 0 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats strip — real numbers only */}
        <div style={{
          margin: '14px 18px 0',
          borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        }}>
          {loading
            ? [0, 1, 2].map(i => (
              <div key={i} style={{ padding: '14px 10px', borderLeft: i > 0 ? `1px solid ${T.line}` : 'none' }}>
                <div style={skeletonStyle(48, 36)} />
                <div style={{ ...skeletonStyle(60, 10), marginTop: 8 }} />
              </div>
            ))
            : [
              { n: tonightEvents.length, l: 'Events tonight' },
              { n: totalVenues, l: 'Venues tracked' },
              { n: tonightVenueCount, l: 'Venues live', live: true },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '14px 10px',
                borderLeft: i > 0 ? `1px solid ${T.line}` : 'none',
              }}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <div style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 36, color: (s as any).live ? T.live : T.accent, lineHeight: 1 }}>
                  {s.n}
                </div>
                <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: T.inkMuted, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(s as any).live && <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.live, animation: 'wmv-pulse 1.5s infinite', display: 'inline-block' }} />}
                  {s.l}
                </div>
              </div>
            ))
          }
        </div>

        {/* Search — lands on the list view for today */}
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            const q = searchQ.trim();
            trackEvent('home_search_submit', { city, q });
            router.push(`/${city}/cards?date=today${q ? `&q=${encodeURIComponent(q)}` : ''}`);
          }}
          style={{
            margin: '12px 18px 0', display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 10,
            background: T.surface, border: `1px solid ${T.line}`,
          }}
        >
          <Search size={15} style={{ color: T.inkMuted, flexShrink: 0 }} />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search venues, events…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.ink, fontFamily: mono, fontSize: 12, minWidth: 0 }}
          />
          <button type="submit" style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: T.accent,
          }}>
            Go
          </button>
        </form>

        {/* § Happening now — live right now, hidden when empty */}
        {(loading || happeningNow.length > 0) && (
          <div style={{ padding: '26px 18px 0' }}>
            <SectionHeader
              label={<>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.live, animation: 'wmv-pulse 1.5s infinite', display: 'inline-block' }} />
                Happening now
              </>}
              right={<span style={{ fontFamily: mono, fontSize: 10, color: T.live, fontWeight: 600 }}>{loading ? '—' : `${happeningNow.length} LIVE`}</span>}
            />
            <HScrollRail>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ flex: '0 0 130px', aspectRatio: '3/4', ...skeletonStyle('100%', undefined) }} />
                ))
                : happeningNow.map((e) => (
                  <div
                    key={e.event_id || e.venue_id}
                    onClick={() => openEvent(e, 'happening_now')}
                    style={{
                      flex: '0 0 130px', width: 130, minWidth: 130, maxWidth: 130,
                      scrollSnapAlign: 'start', position: 'relative',
                      aspectRatio: '3/4', overflow: 'hidden', borderRadius: 6,
                      background: `linear-gradient(135deg, ${T.live}22, ${T.bg})`,
                      border: `1px solid ${T.line}`, cursor: e.event_id ? 'pointer' : 'default',
                    }}
                  >
                    {e.media_url_1 && (
                      <EventMedia
                        src={e.media_url_1}
                        mediaType={e.media_type_1}
                        poster={e.media_type_2 !== 'video' ? e.media_url_2 : null}
                        alt={e.name || ''}
                        sizes="140px"
                        fill
                        lazyVideo
                      />
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(10,10,20,0.9))' }} />
                    <div style={{
                      position: 'absolute', top: 6, left: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: T.live, color: '#fff', fontFamily: mono, fontSize: 8, fontWeight: 700,
                      padding: '2px 5px', letterSpacing: '0.5px', borderRadius: 3,
                    }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', animation: 'wmv-pulse 1.5s infinite', display: 'inline-block' }} />
                      LIVE
                    </div>
                    <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6 }}>
                      <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 14, color: T.ink, lineHeight: 1.1 }}>
                        {e.name || ''}
                      </div>
                      {e.event_time && (
                        <div style={{ fontFamily: mono, fontSize: 8, color: T.inkMuted, marginTop: 3, letterSpacing: '0.5px' }}>
                          {e.event_time}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              }
            </HScrollRail>
          </div>
        )}

        {/* § Tonight in <city> */}
        <div style={{ padding: '26px 18px 0' }}>
          <SectionHeader
            label={`Tonight in ${getCityConfig(city).displayName}`}
            right={<span style={{ fontFamily: mono, fontSize: 10, color: T.accent, fontWeight: 600 }}>{loading ? '—' : `${tonightEvents.length} EVENTS`}</span>}
          />

          {loading ? (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ flex: '0 0 48%', aspectRatio: '3/4', ...skeletonStyle('100%', undefined) }} />
                ))}
              </div>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '22px 1fr auto', gap: 10, padding: '12px 0', borderTop: `1px solid ${T.lineFaint}`, alignItems: 'start' }}>
                  <div style={skeletonStyle(18, 12)} />
                  <div>
                    <div style={skeletonStyle(80, 10)} />
                    <div style={{ ...skeletonStyle(120, 16), marginTop: 6 }} />
                    <div style={{ ...skeletonStyle(100, 10), marginTop: 6 }} />
                  </div>
                  <div style={skeletonStyle(28, 28)} />
                </div>
              ))}
            </>
          ) : tonightEvents.length > 0 ? (
            <>
              {/* 2-up portrait scroller */}
              <div style={{ marginBottom: 14 }}>
                <HScrollRail>
                  {tonightEvents.map((e) => {
                    const cat = getPrimaryCat(e);
                    return (
                      <div
                        key={e.event_id || e.venue_id}
                        onClick={() => openEvent(e, 'tonight_scroller')}
                        style={{
                          flex: '0 0 48%', width: '48%', minWidth: '48%', maxWidth: '48%',
                          scrollSnapAlign: 'start', position: 'relative',
                          aspectRatio: '3/4', overflow: 'hidden', borderRadius: 6,
                          background: 'linear-gradient(135deg, #1c1c2a, #0a0a14)',
                          border: `1px solid ${T.line}`, cursor: e.event_id ? 'pointer' : 'default',
                        }}
                      >
                        {e.media_url_1 ? (
                          <EventMedia
                            src={e.media_url_1}
                            mediaType={e.media_type_1}
                            poster={e.media_type_2 !== 'video' ? e.media_url_2 : null}
                            alt={e.name || ''}
                            sizes="(max-width: 430px) 48vw, 206px"
                            fill
                            lazyVideo
                          />
                        ) : (
                          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${T.accent}22, ${T.bg})` }} />
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(10,10,20,0.92))' }} />
                        {cat && (
                          <div style={{ position: 'absolute', top: 8, left: 8 }}>
                            <CategoryPillTag primary={cat} small />
                          </div>
                        )}
                        <button
                          onClick={(ev) => { ev.stopPropagation(); toggle(String(e.venue_id)); }}
                          style={{
                            position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 4,
                            background: 'rgba(20,20,31,0.75)', border: `1px solid ${T.line}`, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                          }}
                          aria-label="Like"
                        >
                          <Heart style={{ width: 12, height: 12, color: liked.has(String(e.venue_id)) ? T.pink : T.ink, fill: liked.has(String(e.venue_id)) ? T.pink : 'transparent' }} />
                        </button>
                        <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
                          <div style={{
                            fontFamily: serif, fontStyle: 'italic', fontSize: 16, fontWeight: 400,
                            color: T.ink, lineHeight: 1.05, letterSpacing: '-0.015em',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {e.event_name || e.name}
                          </div>
                          <div style={{ fontFamily: mono, fontSize: 8, fontWeight: 600, color: T.accent, letterSpacing: '0.6px', textTransform: 'uppercase', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.name || ''}{e.event_time ? ` · ${e.event_time}` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </HScrollRail>
              </div>

              {/* List — first 4 */}
              {tonightEvents.slice(0, 4).map((e, i) => {
                const cat = getPrimaryCat(e);
                return (
                <div key={e.event_id || e.venue_id || i} style={{
                  display: 'grid', gridTemplateColumns: '22px 72px 1fr auto', gap: 10,
                  padding: '10px 0', borderTop: `1px solid ${T.lineFaint}`, alignItems: 'center',
                  minHeight: 88,
                  cursor: e.event_id ? 'pointer' : 'default',
                }} onClick={() => openEvent(e, 'tonight_list')}>
                  {/* Number */}
                  <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: T.accent }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  {/* Thumbnail — left */}
                  <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, background: `linear-gradient(135deg, #1c1c2a, #0a0a14)`, border: `1px solid ${T.line}`, overflow: 'hidden', borderRadius: 4 }}>
                    {e.media_url_1 ? (
                      <EventMedia
                        src={e.media_url_1}
                        mediaType={e.media_type_1}
                        poster={e.media_type_2 !== 'video' ? e.media_url_2 : null}
                        alt={e.name || ''}
                        sizes="96px"
                        fill
                        lazyVideo
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${T.accent}22, ${T.bg})` }} />
                    )}
                  </div>
                  {/* Text */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, color: T.inkMuted, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                      {e.area || ''}
                    </div>
                    <div style={{
                      fontFamily: serif, fontStyle: 'italic', fontSize: 18, fontWeight: 400,
                      color: T.ink, letterSpacing: '-0.015em', lineHeight: 1.1, marginTop: 2,
                    }}>
                      {e.name || e.venue}
                    </div>
                    {/* Always reserve this row — keeps height consistent across cards */}
                    <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 3, minHeight: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.event_name || ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, fontFamily: mono, fontSize: 9, color: T.inkMuted, fontWeight: 500, letterSpacing: '0.5px', minHeight: 15, flexWrap: 'wrap' }}>
                      {cat && <CategoryPillTag primary={cat} small />}
                      {e.event_time && <span>{e.event_time}</span>}
                      {e.rating && <span>★ {e.rating}</span>}
                    </div>
                  </div>
                  {/* Like — top right */}
                  <button
                    onClick={(ev) => { ev.stopPropagation(); toggle(String(e.venue_id)); }}
                    style={{ width: 28, height: 28, border: `1px solid ${T.line}`, background: T.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}
                    aria-label="Like"
                  >
                    <Heart style={{ width: 13, height: 13, color: liked.has(String(e.venue_id)) ? T.pink : T.ink, fill: liked.has(String(e.venue_id)) ? T.pink : 'transparent' }} />
                  </button>
                </div>
                );
              })}
              {/* See all → list view for today */}
              {tonightEvents.length > 4 && (
                <button
                  onClick={() => {
                    trackEvent('nav_view_change', { from: 'home', to: 'cards', source: 'tonight_see_all' });
                    router.push(`/${city}/cards?date=today`);
                  }}
                  style={{
                    width: '100%', marginTop: 10, padding: '10px 0',
                    border: `1px solid ${T.line}`, background: 'transparent',
                    fontFamily: mono, fontSize: 10, fontWeight: 600,
                    letterSpacing: '1px', textTransform: 'uppercase',
                    color: T.accent, cursor: 'pointer',
                  }}
                >
                  See all {tonightEvents.length} events tonight →
                </button>
              )}
            </>
          ) : (
            <div style={{ fontFamily: mono, fontSize: 10, color: T.inkMuted, padding: '20px 0', textAlign: 'center' }}>
              No events found for tonight
            </div>
          )}
        </div>

        {/* § Tonight's deals — hidden when empty */}
        {!loading && dealsTonight.length > 0 && (
          <div style={{ padding: '26px 18px 0' }}>
            <SectionHeader
              label={"Tonight's deals"}
              right={<span style={{ fontFamily: mono, fontSize: 10, color: T.accent, fontWeight: 600 }}>{dealsTonight.length} OFFERS</span>}
            />
            <HScrollRail>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {dealsTonight.map((e: any) => {
                const deal = Array.isArray(e.deals) && e.deals.length > 0 ? e.deals[0] : null;
                const cfg = DEAL_LABELS[deal?.type as string] || DEAL_LABELS.special_offer;
                const dealText = deal?.description || (e.special_offers ? String(e.special_offers) : '') || cfg.label;
                return (
                  <div
                    key={e.event_id || e.venue_id}
                    onClick={() => openEvent(e, 'deals_rail')}
                    style={{
                      flex: '0 0 210px', width: 210, minWidth: 210, maxWidth: 210,
                      boxSizing: 'border-box', overflow: 'hidden',
                      scrollSnapAlign: 'start',
                      padding: '12px 12px 14px', borderRadius: 8,
                      background: T.surface, border: `1px solid ${T.line}`,
                      cursor: e.event_id ? 'pointer' : 'default',
                      display: 'flex', flexDirection: 'column',
                    }}
                  >
                    {/* The actual deal, first — mono, swapped with the venue's serif */}
                    <div style={{
                      fontFamily: mono, fontSize: 10, fontWeight: 600, color: T.ink,
                      lineHeight: 1.45, letterSpacing: '0.4px', overflowWrap: 'anywhere',
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {dealText}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 8px', borderRadius: 999,
                        background: `rgba(${cfg.rgb}, 0.15)`, border: `1px solid rgba(${cfg.rgb}, 0.35)`,
                        color: `rgb(${cfg.rgb})`, fontFamily: mono, fontSize: 8, fontWeight: 700,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 7, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.event_name || ''}
                    </div>
                    {/* Venue — gold serif italic (took the deal's old font) */}
                    <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 15, color: T.accent, marginTop: 4, letterSpacing: '-0.01em', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.name || ''}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 8, color: T.inkMuted, marginTop: 3, letterSpacing: '0.5px' }}>
                      {e.event_time || ''}{deal?.timing ? ` · ${deal.timing}` : ''}
                    </div>
                  </div>
                );
              })}
            </HScrollRail>
          </div>
        )}

        {/* § Pick your vibe */}
        <div style={{ padding: '26px 18px 0' }}>
          <SectionHeader label="Pick your vibe" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
            {vibeGrid.map((v) => {
              const Icon = v.Icon;
              return (
                <div key={v.id}
                  onClick={() => {
                    trackEvent('vibe_pill_click', { vibe: v.id, city });
                    router.push(`/${city}/vibe/${v.id}`);
                  }}
                  style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 999,
                  border: `1px solid ${T.line}`, background: T.surface,
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', background: v.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon style={{ width: 13, height: 13, color: '#0a0a14' }} />
                  </div>
                  <span style={{
                    fontFamily: serif, fontStyle: 'italic', fontSize: 14, fontWeight: 400,
                    color: T.ink, letterSpacing: '-0.01em', lineHeight: 1, flex: 1,
                  }}>{v.label}</span>
                  <span style={{
                    fontFamily: mono, fontSize: 10, fontWeight: 700,
                    color: v.color, lineHeight: 1, flexShrink: 0,
                  }}>{loading ? '—' : v.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* § Weekend — one row per day (Fri / Sat / Sun) */}
        {(loading || weekendByDay.some(d => d.events.length > 0)) && (
          <div style={{ padding: '26px 18px 0' }}>
            <SectionHeader label="Weekend Vibes" />
            {loading ? (
              <div style={{ display: 'flex', gap: 10, overflowX: 'hidden' }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ flexShrink: 0, width: 180 }}>
                    <div style={{ ...skeletonStyle(180, undefined), aspectRatio: '3/4' }} />
                    <div style={{ ...skeletonStyle(140, 10), marginTop: 8 }} />
                  </div>
                ))}
              </div>
            ) : (
              weekendByDay.filter(d => d.events.length > 0).map(({ ds, label, events }) => (
                <div key={ds} style={{ marginBottom: 18 }}>
                  <div
                    onClick={() => {
                      trackEvent('home_weekend_day_click', { city, date: ds });
                      router.push(`/${city}/cards?date=${ds}`);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '4px 4px 8px', cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 17, color: T.ink, letterSpacing: '-0.01em' }}>
                      {label}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: mono, fontSize: 10, color: T.accent, fontWeight: 600 }}>
                      {events.length} events
                      <ArrowUpRight size={12} strokeWidth={2.2} />
                    </span>
                  </div>
                  <HScrollRail>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {events.map((e: any, idx: number) => {
                      const color = ['#f4c430', '#22d3ee', '#f472b6', '#84cc16'][idx % 4];
                      return (
                        <div
                          key={`${e.venue_id}-${ds}`}
                          onClick={() => openEvent(e, 'weekend_rail')}
                          style={{ flex: '0 0 180px', width: 180, minWidth: 180, maxWidth: 180, scrollSnapAlign: 'start', cursor: e.event_id ? 'pointer' : 'default' }}
                        >
                          <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', borderRadius: 6, background: `linear-gradient(135deg, ${color}22, #0a0a14)` }}>
                            {e.media_url_1 ? (
                              <EventMedia
                                src={e.media_url_1}
                                mediaType={e.media_type_1}
                                poster={e.media_type_2 !== 'video' ? e.media_url_2 : null}
                                alt={e.name || ''}
                                sizes="(max-width: 430px) 40vw, 172px"
                                fill
                                lazyVideo
                              />
                            ) : null}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(10,10,20,0.85))' }} />
                            <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
                              <div style={{ fontFamily: mono, fontSize: 8, fontWeight: 600, color: color, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                                {e.area || ''}
                              </div>
                              <div style={{
                                fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: T.ink, lineHeight: 1.05, marginTop: 2,
                              }}>{e.name || e.venue}</div>
                            </div>
                          </div>
                          {e.event_name && (
                            <div style={{ fontSize: 10, color: T.inkMuted, marginTop: 6, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                              {e.event_name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </HScrollRail>
                </div>
              ))
            )}
          </div>
        )}

        {/* § Areas */}
        <div style={{ padding: '26px 18px 0' }}>
          <SectionHeader label="Areas" />
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: `1px solid ${T.lineFaint}` }}>
                <div style={skeletonStyle(20, 10)} />
                <div style={skeletonStyle(120, 16)} />
                <div style={skeletonStyle(60, 10)} />
                <div style={skeletonStyle(13, 13)} />
              </div>
            ))
            : areas.map((a, i) => (
              <div key={a.label}
                onClick={() => {
                  trackEvent('area_row_click', { area: a.label, city });
                  // Map view seeds ?area= into its filters — a spatial pick
                  // belongs on the map, not the list.
                  router.push(`/${city}/map?area=${encodeURIComponent(a.label)}`);
                }}
                style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center', gap: 12,
                padding: '11px 0', borderBottom: `1px solid ${T.lineFaint}`, cursor: 'pointer',
              }}>
                <span style={{ fontFamily: mono, fontSize: 10, color: T.inkMuted, fontWeight: 500 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 18, color: T.ink, letterSpacing: '-0.01em' }}>
                  {a.label}
                </span>
                <span style={{ fontFamily: mono, fontSize: 10, color: T.accent, fontWeight: 600 }}>
                  {a.count} events
                </span>
                <ArrowUpRight size={13} strokeWidth={2} style={{ color: T.inkFaint, flexShrink: 0 }} />
              </div>
            ))
          }
        </div>

        {/* § Fresh from instagram — now at the bottom */}
        <div style={{ padding: '26px 18px 0' }}>
          <SectionHeader label="Fresh from instagram" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: '3/4', ...skeletonStyle('100%', undefined) }} />
              ))
              : storiesData.map((s, i) => (
                <div key={s.id} style={{
                  aspectRatio: '3 / 4', position: 'relative', overflow: 'hidden',
                  background: s.mediaUrl
                    ? T.bg
                    : `linear-gradient(${135 + i * 20}deg, ${s.color}, ${s.color}66, ${T.bg})`,
                  border: `1px solid ${T.line}`,
                  cursor: s.event_id ? 'pointer' : 'default',
                }} onClick={() => {
                  if (!s.event_id) return;
                  trackEvent('view_event', { event_id: s.event_id, venue_id: s.venue_id, place_id: s.place_id, event_date: s.event_date, source: 'stories_grid' });
                  router.push(`/${city}/event/${s.event_id}`);
                }}>
                  {s.mediaUrl ? (
                    // lazyVideo: <video> only mounts near the viewport; until
                    // then the sibling image (or placeholder) renders via the
                    // optimizer. No autoPlay on tiny grid tiles.
                    <EventMedia
                      src={s.mediaUrl}
                      mediaType={s.mediaType}
                      poster={s.posterUrl}
                      alt={s.venue}
                      sizes="(max-width: 430px) 25vw, 107px"
                      fill
                      lazyVideo
                    />
                  ) : null}
                  {s.isLive && (
                    <div style={{
                      position: 'absolute', top: 4, left: 4,
                      background: T.live, color: '#fff', fontFamily: mono, fontSize: 7, fontWeight: 700,
                      padding: '1.5px 3px', letterSpacing: '0.5px',
                    }}>LIVE</div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, padding: '5px 4px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    fontFamily: mono, fontSize: 8, fontWeight: 600, color: '#fff',
                    letterSpacing: '0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>@{s.user}</div>
                </div>
              ))
            }
          </div>
        </div>

        {/* The method */}
        <div style={{ padding: '24px 18px 0' }}>
          <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 14 }}>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
              The method
            </div>
            <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 20, fontWeight: 400, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              We watch stories.<br />You pick a vibe.<br />The city opens up.
            </div>
          </div>
        </div>
      </div>

      <NavPill city={city} active="home" />
    </main>
  );
}
