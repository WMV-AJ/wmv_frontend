'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useVenueData } from '@/contexts/VenueDataContext';
import { useCitiesVersion } from '@/contexts/CitiesProvider';
import { ALL_CITIES, getCityConfig, isValidCity, type CitySlug } from '@/config/cities.config';
import { getCityDateString } from '@/lib/city-date';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';
import HomeMasthead from '@/components/navigation/HomeMasthead';
import NavPill from '@/components/navigation/NavPill';
import { VIBES, matchesVibe } from '@/config/vibes';
import { T } from '@/lib/theme/tokens';
import { H4_LABEL, TILE_RULE, getCardAccent, accentFromHex } from '@/components/shared/card-style';
import HomeHero from '@/components/home/HomeHero';
import styles from '@/components/home/home.module.css';
import VibeFan, { type VibeFanItem } from '@/components/home/VibeFan';
import HowItWorks, { type HowStats } from '@/components/home/HowItWorks';
import CityAtlas from '@/components/home/CityAtlas';
import { HomeFaq, VenueCta, HomeFooter } from '@/components/home/HomeClosing';
import PlanBlock, { type PlanWhen, type PlanVibe } from '@/components/home/PlanBlock';
import { TileRail, TileList, RevealBlock, toTileItems } from '@/components/home/HomeTiles';
import {
  HomeSectionHeader,
  HScrollRail,
  DealCard,
  NumberedRow,
  primaryCategory,
  BTN_SECONDARY,
  BTN_SECONDARY_STYLE,
} from '@/components/home/HomeParts';

// Type, colour and components follow the map tile / list page system
// (@/components/shared/card-style, @/components/home/*). Fonts: Inter /
// Inter Tight via `font-inter` / `font-tight` (globals.css @font-face),
// preloaded in ./page.tsx.

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

// ── COMPONENT ─────────────────────────────────────────────────────────
export default function CityHome() {
  const router = useRouter();
  const params = useParams();
  const city = (params?.city as string) || 'dubai';

  useCitiesVersion(); // re-render once the runtime city list arrives
  // The page scrolls inside <main>; section observers use it as their root.
  const mainRef = useRef<HTMLElement | null>(null);
  // Sections that open in place: all deals, all areas, which weekend day.
  const [showAllDeals, setShowAllDeals] = useState(false);
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [openWeekendDay, setOpenWeekendDay] = useState<string | null>(null);

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

  useEffect(() => {
    // Landing page + marketing sections follow the visitor's last city.
    try { window.localStorage.setItem('wmv_last_city', city); } catch { /* ignore */ }
  }, [city]);

  const todayStr = getCityDateString(city);
  const dubaiHour = getCityHour(city);

  const todayVenues = venues.filter(v => {
    if (!v.event_date) return false;
    return utcDateKey(v.event_date) === todayStr;
  });

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
    .map(([label, count]) => ({ label, count }));

  // Vibe fan: live count per vibe (same matchesVibe as /[city]/vibe/[id])
  // and a real upcoming event photo for each card. Photos are preferred over
  // video frames so the fan doesn't trigger 8 /api/video-thumb extractions.
  const vibeFan = useMemo<VibeFanItem[]>(() => {
    const isVideo = (url?: string, type?: string) => type === 'video' || /\.(mp4|mov|webm)(\?.*)?$/i.test(url || '');
    return VIBES.map((v) => {
      const matches = venues.filter((venue) => matchesVibe(venue, v));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const withPhoto = matches.find((m: any) =>
        (m.media_url_1 && !isVideo(m.media_url_1, m.media_type_1)) || (m.media_url_2 && !isVideo(m.media_url_2, m.media_type_2)));
      const src = withPhoto
        ? (withPhoto.media_url_1 && !isVideo(withPhoto.media_url_1, withPhoto.media_type_1) ? withPhoto.media_url_1 : withPhoto.media_url_2)
        : null;
      return {
        id: v.id,
        label: v.label,
        description: v.description,
        count: matches.length,
        accent: v.categories[0] ? getCardAccent(v.categories[0]) : accentFromHex(v.color),
        media: src ? { src } : null,
        fallbackImage: v.fallbackImage,
      };
    });
  }, [venues]);

  // The city's top event categories by count — colours the hero radar (and,
  // later on the page, the atlas pins).
  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    venues.forEach((v) => {
      const c = primaryCategory(v);
      if (c) counts.set(c, (counts.get(c) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c]) => c);
  }, [venues]);

  // How it works: live totals from the rows already loaded (no extra fetch).
  const howStats = useMemo<HowStats>(() => {
    const venueIds = new Set<string>();
    const eventIds = new Set<string>();
    const areaSet = new Set<string>();
    let latest = '';
    venues.forEach((v) => {
      if (v.venue_id != null) venueIds.add(String(v.venue_id));
      if (v.event_id != null) eventIds.add(String(v.event_id));
      if (v.area) areaSet.add(v.area);
      if (typeof v.scrape_date === 'string' && v.scrape_date > latest) latest = v.scrape_date;
    });
    let refreshed: string | null = null;
    if (latest) {
      try {
        refreshed = new Date(latest).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: getCityConfig(city).timezone });
      } catch { refreshed = null; }
    }
    return { venues: venueIds.size, events: eventIds.size, areas: areaSet.size, refreshed };
  }, [venues, city]);

  // FAQ, venue call to action and footer carry the brand gold.
  const brandAccent = accentFromHex(T.accent);

  // Section accent for How it works / the atlas: the city's #1 category.
  const cityAccent = topCategories[0] ? getCardAccent(topCategories[0]) : accentFromHex(T.accent);

  // Every live city. ALL_CITIES grows at runtime once /api/cities loads;
  // useCitiesVersion() re-renders the page when it does.
  const cityOptions: Array<[string, string]> = ALL_CITIES.map((slug) => [slug, getCityConfig(slug).displayName]);
  const switchCity = (slug: string) => {
    if (slug === city || !isValidCity(slug)) return;
    trackEvent('home_city_switch', { from: city, to: slug });
    try { window.localStorage.setItem('wmv_last_city', slug); } catch { /* ignore */ }
    router.push(`/${slug}`);
  };

  const cityConfig = getCityConfig(city);
  const cityName = cityConfig.displayName;
  // The city's calendar day, not the viewer's.
  const dateLabel = (() => {
    try {
      return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: cityConfig.timezone });
    } catch {
      return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    }
  })();

  const skeletonStyle = (w: string | number, h: string | number | undefined, extra?: React.CSSProperties): React.CSSProperties => ({
    width: w,
    height: h,
    background: 'linear-gradient(90deg, #1c1c2a 25%, #2a2638 50%, #1c1c2a 75%)',
    backgroundSize: '200% 100%',
    animation: 'wmv-shimmer 1.4s infinite',
    borderRadius: 2,
    ...extra,
  });

  // ── Plan block ("Plan a night in 2 taps") ───────────────────────────
  // WHEN = today, tomorrow, then the rest of this weekend — all city dates.
  const planWhens = useMemo<PlanWhen[]>(() => {
    const shift = (ds: string, n: number) => {
      const d = new Date(`${ds}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + n);
      return d.toISOString().slice(0, 10);
    };
    const dayOf = (ds: string) => new Date(`${ds}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
    const numOf = (ds: string) => String(new Date(`${ds}T00:00:00Z`).getUTCDate());
    const isWkd = (ds: string) => [0, 5, 6].includes(new Date(`${ds}T00:00:00Z`).getUTCDay());
    const tomorrow = shift(todayStr, 1);
    const out: PlanWhen[] = [
      { id: 'today', day: dayOf(todayStr), date: numOf(todayStr), label: 'Today', isToday: true, isWeekend: isWkd(todayStr) },
      { id: 'tomorrow', day: dayOf(tomorrow), date: numOf(tomorrow), label: 'Tomorrow', isToday: false, isWeekend: isWkd(tomorrow) },
    ];
    weekendByDay.forEach(({ ds }) => {
      if (ds === todayStr || ds === tomorrow) return;
      const lbl = new Date(`${ds}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
      out.push({ id: ds, day: dayOf(ds), date: numOf(ds), label: lbl, isToday: false, isWeekend: isWkd(ds) });
    });
    return out;
  // weekendByDay is rebuilt each render from venues + todayStr
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr, venues]);

  const planVibes = useMemo<PlanVibe[]>(() => VIBES.map((v) => ({
    id: v.id,
    label: v.label,
    Icon: v.Icon,
    hex: (v.categories[0] ? getCardAccent(v.categories[0]) : accentFromHex(v.color)).text,
    filterable: v.categories.length > 0,
  })), []);

  // Counts use the destination's own filter so the number on the button is
  // the number you land on: the list/map filter a vibe by its event
  // categories on the chosen city date; vibes without categories (Rooftops)
  // open their vibe page, which lists every upcoming match.
  const planCountFor = useMemo(() => {
    const cache = new Map<string, number>();
    const tomorrow = (() => { const d = new Date(`${todayStr}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); })();
    const uniq = (rows: any[]) => new Set(rows.map((r) => String(r.event_id ?? `${r.venue_id}-${r.event_date}-${r.event_time}`))).size; // eslint-disable-line @typescript-eslint/no-explicit-any
    return (whenId: string, vibeId: string | null): number => {
      const key = `${whenId}|${vibeId ?? ''}`;
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      const vibe = vibeId ? VIBES.find((v) => v.id === vibeId) : null;
      let n: number;
      if (vibe && vibe.categories.length === 0) {
        n = uniq(venues.filter((r) => matchesVibe(r, vibe)));
      } else {
        const ds = whenId === 'today' ? todayStr : whenId === 'tomorrow' ? tomorrow : whenId;
        const onDay = venues.filter((r) => r.event_date && utcDateKey(r.event_date) === ds);
        n = uniq(vibe
          ? onDay.filter((r) => (Array.isArray(r.event_categories) ? r.event_categories : []).some((c: { primary?: string }) => c?.primary && vibe.categories.includes(c.primary)))
          : onDay);
      }
      cache.set(key, n);
      return n;
    };
  }, [venues, todayStr]);

  const planGo = (target: 'cards' | 'map', whenId: string, vibe: PlanVibe | null) => {
    trackEvent('nav_view_change', { from: 'home', to: target, source: 'plan_block', when: whenId, vibe: vibe?.id ?? '' });
    if (vibe && !vibe.filterable) {
      router.push(target === 'cards' ? `/${city}/vibe/${vibe.id}` : `/${city}/map?date=${whenId}`);
      return;
    }
    router.push(`/${city}/${target}?date=${encodeURIComponent(whenId)}${vibe ? `&vibe=${vibe.id}` : ''}`);
  };

  // Tiles: happening-now first; tonight skips what's already shown there.
  const liveTiles = useMemo(() => toTileItems(happeningNow), [happeningNow]);
  const tonightTiles = useMemo(() => {
    const shown = new Set(liveTiles.slice(0, 6).map((t) => String(t.row.event_id)));
    return toTileItems(tonightEvents.filter((e) => !shown.has(String(e.event_id))));
  }, [tonightEvents, liveTiles]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEvent = (e: any, source: string) => {
    if (!e.event_id) return;
    trackEvent('view_event', { event_id: e.event_id, venue_id: e.venue_id, place_id: e.place_id, event_date: e.event_date, source });
    router.push(`/${city}/event/${e.event_id}`);
  };

  return (
    <main
      ref={mainRef}
      className="font-inter antialiased"
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        background: T.bg,
        color: T.ink,
      }}
    >
      <style>{`
        @keyframes wmv-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes wmv-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes wmv-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <div style={{ maxWidth: 430, margin: '0 auto', paddingBottom: 96 }}>

        <HomeMasthead city={city} from="home" />

        <HomeHero
          cityName={cityName}
          dateLabel={dateLabel}
          tonightCount={tonightEvents.length}
          liveCount={happeningNow.length}
          loading={loading}
          topCategories={topCategories}
        />

        {/* § Plan a night in 2 taps — the page's one clear path */}
        <PlanBlock
          whens={planWhens}
          vibes={planVibes}
          countFor={planCountFor}
          loading={loading || venues.length === 0}
          onChange={(when, vibe) => trackEvent('home_plan_change', { city, when, vibe: vibe ?? '' })}
          onGo={planGo}
        />

        {/* § Happening now — map tiles in a swipeable rail, hidden when empty */}
        {(loading || liveTiles.length > 0) && (
          <section className="px-[18px] pt-8">
            <HomeSectionHeader
              label={<>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: T.live, animation: 'wmv-pulse 1.5s infinite' }} />
                Happening now
              </>}
              count={loading ? '—' : `${liveTiles.length} live`}
            />
            {loading ? (
              <div className="flex gap-3 overflow-hidden">
                <div style={{ flex: '0 0 85%', ...skeletonStyle('100%', 176, { borderRadius: 16 }) }} />
              </div>
            ) : (
              <RevealBlock root={mainRef}>
                <TileRail
                  items={liveTiles.slice(0, 6)}
                  onOpen={(row) => openEvent(row, 'happening_now')}
                  trailing={liveTiles.length > 6 ? (
                    <button
                      onClick={() => {
                        trackEvent('nav_view_change', { from: 'home', to: 'cards', source: 'happening_now_all' });
                        router.push(`/${city}/cards?date=today`);
                      }}
                      className={BTN_SECONDARY}
                      style={BTN_SECONDARY_STYLE}
                    >
                      All {liveTiles.length} live now
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  ) : undefined}
                />
              </RevealBlock>
            )}
          </section>
        )}

        {/* § Tonight in <city> — three map tiles, then everything on the list */}
        <section className="px-[18px] pt-8">
          <HomeSectionHeader
            label={`Tonight in ${cityName}`}
            count={loading ? '—' : `${tonightEvents.length} events`}
          />
          {loading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map(i => <div key={i} style={skeletonStyle('100%', 176, { borderRadius: 16 })} />)}
            </div>
          ) : tonightEvents.length > 0 ? (
            <RevealBlock root={mainRef}>
              <TileList items={tonightTiles.slice(0, 3)} onOpen={(row) => openEvent(row, 'tonight_list')} />
              {tonightEvents.length > 3 && (
                <button
                  onClick={() => {
                    trackEvent('nav_view_change', { from: 'home', to: 'cards', source: 'tonight_see_all' });
                    router.push(`/${city}/cards?date=today`);
                  }}
                  className={`${BTN_SECONDARY} w-full mt-3`}
                  style={BTN_SECONDARY_STYLE}
                >
                  See all {tonightEvents.length} events tonight
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              )}
            </RevealBlock>
          ) : (
            <p className={`${H4_LABEL} text-silver-dim text-center py-5`}>No events found for tonight</p>
          )}
        </section>

        {/* § Tonight's deals — four offers, the rest open in place */}
        {!loading && dealsTonight.length > 0 && (
          <section className="px-[18px] pt-8">
            <HomeSectionHeader label="Tonight's deals" count={`${dealsTonight.length} offers`} />
            <RevealBlock root={mainRef}>
              <div className={styles.revealRail}>
                <HScrollRail>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(showAllDeals ? dealsTonight : dealsTonight.slice(0, 4)).map((e: any) => (
                    <DealCard key={e.event_id || e.venue_id} event={e} onOpen={() => openEvent(e, 'deals_rail')} />
                  ))}
                  {!showAllDeals && dealsTonight.length > 4 && (
                    <button
                      onClick={() => { setShowAllDeals(true); trackEvent('home_section_expand', { city, section: 'deals' }); }}
                      className={`${BTN_SECONDARY} self-center flex-shrink-0`}
                      style={BTN_SECONDARY_STYLE}
                    >
                      +{dealsTonight.length - 4} more
                    </button>
                  )}
                </HScrollRail>
              </div>
            </RevealBlock>
          </section>
        )}

        {/* § What kind of night is it? — vibe fan + index (from Home 4) */}
        <VibeFan
          city={city}
          cityName={cityName}
          items={vibeFan}
          loading={loading}
          kicker={{ index: 1, total: 3 }}
          onExplore={(vibeId, source) => {
            trackEvent('vibe_pill_click', { vibe: vibeId, city, source });
            // The index link navigates itself; the front fan card doesn't.
            if (source === 'fan_card') router.push(`/${city}/vibe/${vibeId}`);
          }}
        />

        {/* § This weekend — ruled day rows, one day open at a time */}
        {(loading || weekendByDay.some(d => d.events.length > 0)) && (() => {
          const days = weekendByDay.filter(d => d.events.length > 0);
          const openDs = openWeekendDay && days.some(d => d.ds === openWeekendDay) ? openWeekendDay : days[0]?.ds;
          return (
            <section className="px-[18px] pt-8">
              <HomeSectionHeader label="This weekend" />
              {loading ? (
                <div style={skeletonStyle('100%', 176, { borderRadius: 16 })} />
              ) : (
                <div style={{ borderBottom: `1px solid ${TILE_RULE}` }}>
                  {days.map(({ ds, label, events }) => {
                    const open = ds === openDs;
                    const accent = cityAccent.text;
                    return (
                      <div key={ds}>
                        {/* The expanded card's ruled date item: selected = accent top rule. */}
                        <div
                          className="flex items-center justify-between gap-3 py-3"
                          style={{ borderTop: `1px solid ${open ? accent : TILE_RULE}`, boxShadow: open ? `inset 0 1px 0 ${accent}` : undefined }}
                        >
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => { setOpenWeekendDay(ds); trackEvent('home_section_expand', { city, section: 'weekend', date: ds }); }}
                            className="flex-1 flex items-baseline gap-2.5 text-left min-w-0"
                          >
                            <span className={`${H4_LABEL}`} style={{ color: open ? accent : undefined }}>
                              <span className={open ? '' : 'text-silver-dim'}>{label.split(' · ')[0].slice(0, 3)}</span>
                            </span>
                            <span className={`font-inter font-[550] text-[15px] ${open ? 'text-pale' : 'text-silver'}`}>{label.split(' · ')[1] ?? label}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              trackEvent('home_weekend_day_click', { city, date: ds });
                              router.push(`/${city}/cards?date=${ds}`);
                            }}
                            className={`${H4_LABEL} inline-flex items-center gap-1 text-silver flex-shrink-0`}
                          >
                            {events.length} events
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {open && (
                          <RevealBlock root={mainRef} className="pb-4">
                            <TileRail items={toTileItems(events.slice(0, 6))} onOpen={(row) => openEvent(row, 'weekend_rail')} />
                          </RevealBlock>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })()}

        {/* § Areas — four, the rest open in place */}
        <section className="px-[18px] pt-8">
          <HomeSectionHeader label="Areas" count={loading ? '—' : `${areas.length} areas`} />
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid items-center gap-3 py-3" style={{ gridTemplateColumns: '20px 1fr auto', borderBottom: `1px solid ${TILE_RULE}` }}>
                <div style={skeletonStyle(18, 10)} />
                <div style={skeletonStyle(140, 16)} />
                <div style={skeletonStyle(60, 10)} />
              </div>
            ))
            : (showAllAreas ? areas : areas.slice(0, 4)).map((a, i) => (
              <NumberedRow key={a.label} index={i} label={a.label} meta={`${a.count} events`}
                onClick={() => {
                  trackEvent('area_row_click', { area: a.label, city });
                  // Map view seeds ?area= into its filters — a spatial pick
                  // belongs on the map, not the list.
                  router.push(`/${city}/map?area=${encodeURIComponent(a.label)}`);
                }} />
            ))}
          {!loading && !showAllAreas && areas.length > 4 && (
            <button
              type="button"
              onClick={() => { setShowAllAreas(true); trackEvent('home_section_expand', { city, section: 'areas' }); }}
              className={`${H4_LABEL} inline-flex items-center gap-1.5 mt-3 text-silver`}
            >
              All {areas.length} areas <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </section>

        {/* § How it works — Find / Sort / Go + live stats (from Home 4) */}
        <HowItWorks
          cityName={cityName}
          stats={howStats}
          loading={loading}
          accent={cityAccent}
          kicker={{ index: 2, total: 3 }}
          scrollRoot={mainRef}
        />

        {/* § Your city — picker + atlas (from Home 4) */}
        <CityAtlas
          city={city}
          cities={cityOptions}
          accent={cityAccent}
          pinCategories={topCategories}
          kicker={{ index: 3, total: 3 }}
          scrollRoot={mainRef}
          onChangeCity={switchCity}
        />

        {/* § Good to know, venue call to action, footer (from Home 4) */}
        <HomeFaq accent={brandAccent} onExpand={(q) => trackEvent('faq_expand', { q, source: 'home' })} />
        <VenueCta accent={brandAccent} onClick={() => trackEvent('venue_lead_click', { source: 'home_cta' })} />
        <HomeFooter
          city={city}
          cities={cityOptions}
          accent={brandAccent}
          onBackToTop={() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
        />
      </div>

      <NavPill city={city} active="home" />
    </main>
  );
}
