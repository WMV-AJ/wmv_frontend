'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCityConfig, type CitySlug } from '@/config/cities.config';
import { getCityDateString } from '@/lib/city-date';
import {
  Heart,
  Map as MapIcon,
  ArrowUpRight,
  Music,
  Sparkles,
  Waves,
  UtensilsCrossed,
  GlassWater,
  Droplet,
  Mic as MicVocal,
  List,
} from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';
import AuthCornerWidget from '@/components/auth/AuthCornerWidget';

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

  accent: '#a78bfa',
  accentSoft: 'rgba(167,139,250,0.18)',
  live: '#ef4444',
  pink: '#ec4899',

  chipLight: '#f5f2ed',
};

const mono = "var(--font-geist-sans), ui-monospace, monospace";
const serif = "var(--font-playfair), 'Playfair Display', Georgia, serif";

// ── VIBE GRID CONFIG ──────────────────────────────────────────────────
const VIBES = [
  { id: 'clubs',  label: 'Clubs',        color: '#a78bfa', Icon: Music,          keywords: ['nightclub', 'club', 'dance'],  categories: ['Club Night'] },
  { id: 'brunch', label: 'Brunch',        color: '#34d399', Icon: UtensilsCrossed,keywords: ['brunch'],                      categories: ['Brunch'] },
  { id: 'rooftops',label: 'Rooftops',     color: '#f472b6', Icon: Sparkles,       keywords: ['rooftop', 'terrace'],          categories: [] },
  { id: 'ladies', label: 'Ladies Night',  color: '#ec4899', Icon: Heart,          keywords: ['ladies night', 'ladies'],      categories: ['Ladies Night'] },
  { id: 'beach',  label: 'Beach Clubs',   color: '#22d3ee', Icon: Waves,          keywords: ['beach', 'pool'],               categories: ['Pool Party'] },
  { id: 'happy',  label: 'Happy Hour',    color: '#f59e0b', Icon: GlassWater,     keywords: ['happy hour'],                  categories: ['Happy Hour'] },
  { id: 'pool',   label: 'Pool Party',    color: '#06b6d4', Icon: Droplet,        keywords: ['pool party'],                  categories: ['Pool Party', 'Day Party & Afterwork'] },
  { id: 'live',   label: 'Live Music',    color: '#84cc16', Icon: MicVocal,       keywords: ['live music', 'live'],          categories: ['Live Performance'] },
];

const RADAR_DOTS = [
  { t: '22%', l: '32%', c: '#a78bfa' },
  { t: '58%', l: '68%', c: '#22d3ee' },
  { t: '38%', l: '78%', c: '#f97316' },
  { t: '72%', l: '38%', c: '#84cc16' },
  { t: '50%', l: '22%', c: '#f472b6' },
  { t: '28%', l: '58%', c: '#ec4899' },
  { t: '68%', l: '82%', c: '#a78bfa' },
];

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

// ── COMPONENT ─────────────────────────────────────────────────────────
export default function CityHome() {
  const router = useRouter();
  const params = useParams();
  const city = (params?.city as string) || 'dubai';

  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [venues, setVenues] = useState<any[]>([]);
  const [totalVenues, setTotalVenues] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [tonightVisible, setTonightVisible] = useState(4);

  const toggle = (id: string) =>
    setLiked(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  useEffect(() => {
    Promise.all([
      fetch(`/api/venues?city=${encodeURIComponent(city)}`).then(r => r.json()),
      fetch(`/api/venue-count?city=${encodeURIComponent(city)}`).then(r => r.json()),
    ])
      .then(([venues, vc]) => {
        if (venues.success && Array.isArray(venues.data)) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          setVenues(venues.data.filter((v: any) => {
            if (!v.event_date) return true;
            const d = new Date(v.event_date);
            return isNaN(d.getTime()) || d >= todayStart;
          }));
        }
        if (vc.count) setTotalVenues(vc.count);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [city]);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setFeaturedIndex(prev => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

  const todayStr = getCityDateString(city);
  const dubaiHour = getCityHour(city);

  const todayVenues = venues.filter(v => {
    const d = v.event_date ? new Date(v.event_date) : null;
    if (!d) return false;
    const ds = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return ds === todayStr;
  });
  const statsVibes = todayVenues.filter(v => {
    if (!v.event_time) return false;
    const t = v.event_time.trim().toLowerCase();
    if (t === 'all day') return true;
    const parts = v.event_time.split('-').map((p: string) => p.trim());
    const startH = parseTimeHours(parts[0] || '');
    return startH !== null && startH >= 18;
  }).length;
  const statsLive = venues.filter(v => isLiveNow(v.event_date, v.event_time, todayStr, dubaiHour)).length;

  const storiesData = (() => {
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
        venue: v.name || 'Venue',
        user: v.final_instagram ? v.final_instagram.replace(/^@/, '') : (v.name || 'venue').toLowerCase().replace(/\s+/g, ''),
        color: '#a78bfa',
        mediaUrl: v.media_url_1 || null,
        mediaType: v.media_type_1 || null,
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
    .sort((a: any, b: any) => {
      const sa = parseTimeHours((a.event_time || '').split('-')[0]?.trim() || '') ?? 99;
      const sb = parseTimeHours((b.event_time || '').split('-')[0]?.trim() || '') ?? 99;
      if (sa !== sb) return sa - sb;
      const ra = a.rating ?? 0, rb = b.rating ?? 0;
      if (ra !== rb) return rb - ra;
      return (a.venue_id ?? 0) - (b.venue_id ?? 0);
    });

  const now = new Date();
  const dubaiNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const weekendDays: string[] = [];
  for (let i = 0; i <= 7; i++) {
    const d = new Date(dubaiNow);
    d.setUTCDate(d.getUTCDate() + i);
    const dow = d.getUTCDay();
    if (dow === 5 || dow === 6) {
      const ds = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      if (!weekendDays.includes(ds)) weekendDays.push(ds);
      if (weekendDays.length === 2) break;
    }
  }
  const weekendMap = new Map<string, any>();
  venues.forEach(v => {
    const d = v.event_date ? new Date(v.event_date) : null;
    if (!d) return;
    const ds = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    if (!weekendDays.includes(ds)) return;
    const key = `${v.venue_id}-${ds}`;
    if (!weekendMap.has(key)) weekendMap.set(key, { ...v, _ds: ds });
  });
  const weekendEvents = Array.from(weekendMap.values()).sort((a, b) => {
    if (a._ds !== b._ds) return a._ds < b._ds ? -1 : 1;
    const at = a.event_time || '';
    const bt = b.event_time || '';
    return at.localeCompare(bt);
  });

  const areaMap = new Map<string, number>();
  venues.forEach(v => {
    if (v.area) areaMap.set(v.area, (areaMap.get(v.area) || 0) + 1);
  });
  const areas = Array.from(areaMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, count }));

  const vibeGrid = VIBES.map(v => {
    const count = venues.filter(venue => {
      const vibeArr: string[] = Array.isArray(venue.event_vibe) ? venue.event_vibe : [];
      const catArr: string[] = Array.isArray(venue.venue_category) ? venue.venue_category
        : typeof venue.category === 'string' ? [venue.category] : [];
      const highlightsText = (() => {
        try {
          const raw = venue.venue_highlights;
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          return Array.isArray(parsed) ? parsed.flatMap((o: any) => Object.keys(o)).join(' ') : '';
        } catch { return ''; }
      })();
      const haystack = [...vibeArr, ...catArr, highlightsText].join(' ').toLowerCase();
      const keywordMatch = v.keywords.some(kw => haystack.includes(kw));
      // event_categories primary match
      const evCats = (() => {
        try {
          const raw = venue.event_categories;
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          return Array.isArray(parsed) ? parsed.map((c: any) => c?.primary || '').filter(Boolean) : [];
        } catch { return []; }
      })();
      const categoryMatch = v.categories.length > 0 && evCats.some((p: string) => v.categories.includes(p));
      return keywordMatch || categoryMatch;
    }).length;
    return { ...v, count };
  });

  const skeletonStyle = (w: string | number, h: string | number | undefined, extra?: React.CSSProperties): React.CSSProperties => ({
    width: w,
    height: h,
    background: 'linear-gradient(90deg, #1c1c2a 25%, #2a2638 50%, #1c1c2a 75%)',
    backgroundSize: '200% 100%',
    animation: 'wmv-shimmer 1.4s infinite',
    borderRadius: 2,
    ...extra,
  });

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
        <div style={{
          padding: '14px 18px 12px',
          borderBottom: `1px solid ${T.line}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/wmv-logo.gif"
              alt="Where's My Vibe"
              style={{
                width: 28, height: 28, objectFit: 'cover',
                borderRadius: '50%', flexShrink: 0,
              }}
            />
            <div>
              <div style={{
                fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: 14,
                color: T.ink, letterSpacing: '-0.01em', lineHeight: 1,
              }}>Where&rsquo;s My Vibe</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => {
                trackEvent('nav_view_change', { from: 'home', to: 'map', source: 'header' });
                router.push(`/${city}/map`);
              }}
              className="w-8 h-8 md:w-6 md:h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ border: `1px solid ${T.line}`, background: T.surface, cursor: 'pointer', padding: 0 }}
              aria-label="Map"
            >
              <MapIcon className="w-3.5 h-3.5 md:w-3 md:h-3" style={{ color: T.inkMuted }} />
            </button>
            <button
              onClick={() => {
                trackEvent('nav_view_change', { from: 'home', to: 'cards', source: 'header' });
                router.push(`/${city}/cards`);
              }}
              className="w-8 h-8 md:w-6 md:h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ border: `1px solid ${T.line}`, background: T.surface, cursor: 'pointer', padding: 0 }}
              aria-label="Cards"
            >
              <List className="w-3.5 h-3.5 md:w-3 md:h-3" style={{ color: T.inkMuted }} />
            </button>
            {/* Auth state: real avatar when signed in, sign-in icon otherwise. */}
            <AuthCornerWidget />
          </div>
        </div>

        {/* Hero — radar + title */}
        <div style={{ position: 'relative', padding: '20px 18px 0' }}>
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

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.live }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.live, animation: 'wmv-pulse 1.5s infinite', display: 'inline-block' }} />
              Scanning · updated 2m ago
            </div>
            <h1 style={{
              fontFamily: serif, fontStyle: 'italic', fontWeight: 400,
              fontSize: 60, lineHeight: 0.92, margin: '14px 0 0',
              letterSpacing: '-0.035em', color: T.ink,
            }}>
              Where&rsquo;s<br />
              <span style={{ color: T.accent }}>my vibe</span>
            </h1>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 500, letterSpacing: '0.8px', textTransform: 'uppercase', color: T.inkMuted, marginTop: 14, maxWidth: 220, lineHeight: 1.5 }}>
              {getCityConfig(city).displayName}&rsquo;s nightlife, pulled live from Instagram &amp; the web.
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

        {/* Stats strip */}
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
              { n: statsVibes, l: 'Vibes tonight' },
              { n: totalVenues, l: 'Venues' },
              { n: statsLive, l: 'Live now', live: true },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '14px 10px',
                borderLeft: i > 0 ? `1px solid ${T.line}` : 'none',
              }}>
                <div style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 36, color: (s as any).live ? T.live : T.accent, lineHeight: 1 }}>
                  {s.n}
                </div>
                <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: T.inkMuted, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {(s as any).live && <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.live, animation: 'wmv-pulse 1.5s infinite', display: 'inline-block' }} />}
                  {s.l}
                </div>
              </div>
            ))
          }
        </div>

        {/* § A — Fresh from instagram */}
        <div style={{ padding: '22px 18px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${T.line}`, paddingBottom: 8, marginBottom: 10,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', paddingLeft: 4 }}>
              Fresh from instagram
            </div>
          </div>

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
                  {s.mediaUrl && s.mediaType === 'video' ? (
                    <video
                      src={s.mediaUrl}
                      autoPlay muted loop playsInline
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : s.mediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.mediaUrl}
                      alt=""
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
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

        {/* § B — Tonight */}
        <div style={{ padding: '28px 18px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${T.line}`, paddingBottom: 8, marginBottom: 14,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', paddingLeft: 4 }}>
              Tonight in {getCityConfig(city).displayName}
            </div>
            <span style={{ fontFamily: mono, fontSize: 10, color: T.accent, fontWeight: 600 }}>
              {loading ? '—' : `${tonightEvents.length} EVENTS`}
            </span>
          </div>

          {loading ? (
            <>
              <div style={{ ...skeletonStyle('100%', undefined), aspectRatio: '4/3', marginBottom: 14 }} />
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
              {(() => {
                const fi = tonightEvents.length > 0 ? featuredIndex % tonightEvents.length : 0;
                const e = tonightEvents[fi];
                const hasVideo = e.media_type_1 === 'video' && e.media_url_1;
                const hasImage = e.media_url_1 && e.media_type_1 !== 'video';
                return (
                  <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', marginBottom: 14, background: `linear-gradient(135deg, #1c1c2a, #0a0a14)`, cursor: e.event_id ? 'pointer' : 'default' }} onClick={() => {
                    if (!e.event_id) return;
                    trackEvent('view_event', { event_id: e.event_id, venue_id: e.venue_id, place_id: e.place_id, event_date: e.event_date, source: 'tonight_featured' });
                    router.push(`/${city}/event/${e.event_id}`);
                  }}>
                    {hasVideo ? (
                      <video src={e.media_url_1} autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.1)' }} />
                    ) : hasImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.media_url_1} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.1)' }} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, #a78bfa22, #ec489922, #0a0a14)` }} />
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(10,10,20,0.92))' }} />
                    <div style={{ position: 'absolute', top: 10, left: 10 }}>
                      <span style={{ background: T.chipLight, color: T.inkInverse, fontFamily: mono, fontSize: 9, fontWeight: 700, padding: '3px 6px', letterSpacing: '0.8px' }}>FEATURED</span>
                    </div>
                    <button
                      onClick={(ev) => { ev.stopPropagation(); toggle(String(e.venue_id)); }}
                      style={{
                        position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 0,
                        background: T.surface, border: `1.5px solid ${T.line}`, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                      }}
                      aria-label="Like"
                    >
                      <Heart style={{ width: 15, height: 15, color: liked.has(String(e.venue_id)) ? T.pink : T.ink, fill: liked.has(String(e.venue_id)) ? T.pink : 'transparent' }} />
                    </button>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 }}>
                      <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: T.accent, letterSpacing: '1px', textTransform: 'uppercase' }}>
                        {e.area || ''}{e.event_time ? ` · ${e.event_time}` : ''}
                      </div>
                      <div style={{
                        fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 32,
                        color: T.ink, lineHeight: 0.95, marginTop: 4, letterSpacing: '-0.02em',
                      }}>
                        {e.name || e.venue}
                      </div>
                      {e.event_name && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                          {e.event_name}
                        </div>
                      )}
                      {/* Progress dots */}
                      <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                        {tonightEvents.map((_, idx) => (
                          <div
                            key={idx}
                            onClick={(ev) => { ev.stopPropagation(); setFeaturedIndex(idx); }}
                            style={{
                              width: idx === fi ? 16 : 4, height: 4,
                              background: idx === fi ? T.accent : 'rgba(255,255,255,0.3)',
                              borderRadius: 2, cursor: 'pointer',
                              transition: 'width 0.3s ease, background 0.3s ease',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {tonightEvents.slice(0, tonightVisible).map((e, i) => {
                const hasVideo = e.media_type_1 === 'video' && e.media_url_1;
                const hasImage = e.media_url_1 && e.media_type_1 !== 'video';
                const rawCat = e.category;
                const catLabel = (() => {
                  if (!rawCat) return '';
                  if (typeof rawCat === 'string' && rawCat.trim().startsWith('[')) {
                    try { const arr = JSON.parse(rawCat); return Array.isArray(arr) ? arr[0] : rawCat; } catch {}
                  }
                  if (Array.isArray(rawCat)) return rawCat[0] || '';
                  return rawCat;
                })();
                return (
                <div key={e.event_id || e.venue_id || i} style={{
                  display: 'grid', gridTemplateColumns: '22px 72px 1fr auto', gap: 10,
                  padding: '10px 0', borderTop: `1px solid ${T.lineFaint}`, alignItems: 'center',
                  minHeight: 88,
                  cursor: e.event_id ? 'pointer' : 'default',
                }} onClick={() => {
                  if (!e.event_id) return;
                  trackEvent('view_event', { event_id: e.event_id, venue_id: e.venue_id, place_id: e.place_id, event_date: e.event_date, source: 'tonight_list' });
                  router.push(`/${city}/event/${e.event_id}`);
                }}>
                  {/* Number */}
                  <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: T.accent }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  {/* Thumbnail — left */}
                  <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, background: `linear-gradient(135deg, #1c1c2a, #0a0a14)`, border: `1px solid ${T.line}`, overflow: 'hidden', borderRadius: 4 }}>
                    {hasVideo ? (
                      <video src={e.media_url_1} autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : hasImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.media_url_1} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${T.accent}22, ${T.bg})` }} />
                    )}
                  </div>
                  {/* Text */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, color: T.inkMuted, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                      {e.area || ''}{catLabel ? ` · ${catLabel}` : ''}
                    </div>
                    <div style={{
                      fontFamily: serif, fontStyle: 'italic', fontSize: 18, fontWeight: 400,
                      color: T.ink, letterSpacing: '-0.015em', lineHeight: 1.1, marginTop: 2,
                    }}>
                      {e.name || e.venue}
                    </div>
                    {/* Always reserve this row — keeps height consistent across cards */}
                    <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 3, minHeight: 16 }}>
                      {e.event_name || ''}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 2, fontFamily: mono, fontSize: 9, color: T.inkMuted, fontWeight: 500, letterSpacing: '0.5px', minHeight: 13 }}>
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
              {tonightVisible < tonightEvents.length && (
                <button
                  onClick={() => setTonightVisible(v => v + 4)}
                  style={{
                    width: '100%', marginTop: 10, padding: '10px 0',
                    border: `1px solid ${T.line}`, background: 'transparent',
                    fontFamily: mono, fontSize: 10, fontWeight: 600,
                    letterSpacing: '1px', textTransform: 'uppercase',
                    color: T.accent, cursor: 'pointer',
                  }}
                >
                  See More · {tonightEvents.length - tonightVisible} remaining
                </button>
              )}
              {tonightVisible > 4 && (
                <button
                  onClick={() => setTonightVisible(4)}
                  style={{
                    width: '100%', marginTop: 6, padding: '10px 0',
                    border: `1px solid ${T.line}`, background: 'transparent',
                    fontFamily: mono, fontSize: 10, fontWeight: 600,
                    letterSpacing: '1px', textTransform: 'uppercase',
                    color: T.inkMuted, cursor: 'pointer',
                  }}
                >
                  See Less
                </button>
              )}
            </>
          ) : (
            <div style={{ fontFamily: mono, fontSize: 10, color: T.inkMuted, padding: '20px 0', textAlign: 'center' }}>
              No events found for tonight
            </div>
          )}
        </div>

        {/* § C — Pick your vibe */}
        <div style={{ padding: '28px 18px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${T.line}`, paddingBottom: 8, marginBottom: 10,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', paddingLeft: 4 }}>
              Pick your vibe
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
            {vibeGrid.map((v) => {
              const Icon = v.Icon;
              return (
                <div key={v.id} style={{
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

        {/* § D — Weekend Vibes */}
        <div style={{ padding: '28px 18px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${T.line}`, paddingBottom: 8, marginBottom: 12,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', paddingLeft: 4 }}>
              Weekend Vibes
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ flexShrink: 0, width: 180 }}>
                  <div style={{ ...skeletonStyle(180, undefined), aspectRatio: '3/4' }} />
                  <div style={{ ...skeletonStyle(140, 10), marginTop: 8 }} />
                </div>
              ))
              : weekendEvents.length > 0
                ? weekendEvents.map((e, idx) => {
                  const d = new Date(e.event_date);
                  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                  const dayLabel = days[d.getUTCDay()];
                  const dateNum = d.getUTCDate();
                  const hasVideo = e.media_type_1 === 'video' && e.media_url_1;
                  const hasImage = e.media_url_1 && e.media_type_1 !== 'video';
                  const color = ['#a78bfa', '#22d3ee', '#f472b6', '#84cc16'][idx % 4];
                  return (
                    <div key={`${e.venue_id}-${e._ds}`} style={{ flexShrink: 0, width: 180, cursor: e.event_id ? 'pointer' : 'default' }} onClick={() => {
                      if (!e.event_id) return;
                      trackEvent('view_event', { event_id: e.event_id, venue_id: e.venue_id, place_id: e.place_id, event_date: e.event_date, source: 'weekend_carousel' });
                      router.push(`/${city}/event/${e.event_id}`);
                    }}>
                      <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: `linear-gradient(135deg, ${color}22, #0a0a14)` }}>
                        {hasVideo ? (
                          <video src={e.media_url_1} autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : hasImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={e.media_url_1} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : null}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(10,10,20,0.85))' }} />
                        <div style={{
                          position: 'absolute', top: 8, left: 8, background: T.chipLight, color: T.inkInverse,
                          padding: '4px 8px', fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
                        }}>{dayLabel} {dateNum}</div>
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
                        <div style={{ fontSize: 10, color: T.inkMuted, marginTop: 6, lineHeight: 1.3 }}>
                          {e.event_name}
                        </div>
                      )}
                    </div>
                  );
                })
                : (
                  <div style={{ fontFamily: mono, fontSize: 10, color: T.inkMuted, padding: '20px 0' }}>
                    No weekend events found
                  </div>
                )
            }
          </div>
        </div>

        {/* § E — Areas */}
        <div style={{ padding: '28px 18px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${T.line}`, paddingBottom: 8, marginBottom: 4,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', paddingLeft: 4 }}>
              Areas
            </div>
          </div>
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
              <div key={a.label} style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 12,
                padding: '11px 0', borderBottom: `1px solid ${T.lineFaint}`,
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
              </div>
            ))
          }
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

    </main>
  );
}
