'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useVenueData } from '@/contexts/VenueDataContext';
import { useCitiesVersion } from '@/contexts/CitiesProvider';
import { ALL_CITIES, getCityConfig, isValidCity, type CitySlug } from '@/config/cities.config';
import { getCityDateString } from '@/lib/city-date';
import { ArrowUpRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';
import HomeMasthead from '@/components/navigation/HomeMasthead';
import NavPill from '@/components/navigation/NavPill';
import { T } from '@/lib/theme/tokens';
import { HP, homePaletteVars } from '@/components/home/home-palette';
import { H4_LABEL, TILE_RULE, getCardAccent, accentFromHex } from '@/components/shared/card-style';
import HomeHero from '@/components/home/HomeHero';
import HomeSignal from '@/components/home/HomeSignal';
import { HF } from '@/components/home/home-fonts';
import { getShortDisplayName } from '@/lib/category-mappings';
import { getCategoryTagline, getCategoryFallbackImage, getVibeTileGroup } from '@/config/category-copy';
import { isHomeCityHidden } from '@/config/home-cities';
import HomeProblem, { type ProblemStory } from '@/components/home/HomeProblem';
import HomeThisWeek, { type WeekPick } from '@/components/home/HomeThisWeek';
import HomeVibeTiles, { type VibeTile } from '@/components/home/HomeVibeTiles';
import HomeMapOrList from '@/components/home/HomeMapOrList';
import VibeFan, { type VibeFanItem } from '@/components/home/VibeFan';
import HowItWorks, { type HowStats } from '@/components/home/HowItWorks';
import CityAtlas from '@/components/home/CityAtlas';
import { HomeFaq, VenueCta, HomeFooter } from '@/components/home/HomeClosing';
import {
  HomeSectionHeader,
  HScrollRail,
  EventTile,
  EventRow,
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

// A still photo for a row (never a video frame), or null.
function isVideoUrl(url?: string, type?: string): boolean {
  return type === 'video' || /\.(mp4|mov|webm)(\?.*)?$/i.test(url || '');
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function photoOf(r: any): string | null {
  return (r.media_url_1 && !isVideoUrl(r.media_url_1, r.media_type_1)) ? r.media_url_1
    : (r.media_url_2 && !isVideoUrl(r.media_url_2, r.media_type_2)) ? r.media_url_2 : null;
}

// Primary categories on a row, de-duplicated, in stored order.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function primariesOf(r: any): string[] {
  return Array.from(new Set(
    (Array.isArray(r.event_categories) ? r.event_categories : []).map((c: { primary?: string }) => c?.primary).filter(Boolean),
  ));
}

// True once a today event's end time has passed on the city clock. Events
// without a parsable end ("late", "sunrise", no end) or that run past
// midnight are never "over" today.
function hasEnded(eventTime: string | null | undefined, cityHour: number): boolean {
  if (!eventTime) return false;
  const parts = eventTime.split('-').map(p => p.trim());
  const startH = parseTimeHours(parts[0] || '');
  const endH = parseTimeHours(parts[1] || '');
  if (startH === null || endH === null || endH < startH) return false;
  return cityHour >= endH;
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
  const [liked, setLiked] = useState<Set<string>>(new Set());
  // The page scrolls inside <main>; section observers use it as their root.
  const mainRef = useRef<HTMLElement | null>(null);

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
    // Landing page + marketing sections follow the visitor's last city.
    try { window.localStorage.setItem('wmv_last_city', city); } catch { /* ignore */ }
  }, [city]);

  const todayStr = getCityDateString(city);
  const dubaiHour = getCityHour(city);

  const todayVenues = venues.filter(v => {
    if (!v.event_date) return false;
    return utcDateKey(v.event_date) === todayStr;
  });

  // All of today (city date), one row per event — the same set the list's
  // ?date=today shows, so "See all N" lands on N cards. Still-on / upcoming
  // first, then by start time; finished ones sink to the end.
  const todayEvents = (() => {
    const seen = new Set<string>();
    const startOf = (e: { event_time?: string }) =>
      parseTimeHours((e.event_time || '').split('-')[0]?.trim() || '') ?? 99;
    return todayVenues
      .filter(v => {
        const k = String(v.event_id ?? `${v.venue_id}-${v.event_time}`);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => {
        const ea = hasEnded(a.event_time, dubaiHour) ? 1 : 0;
        const eb = hasEnded(b.event_time, dubaiHour) ? 1 : 0;
        if (ea !== eb) return ea - eb;
        const sa = startOf(a), sb = startOf(b);
        if (sa !== sb) return sa - sb;
        const ra = a.rating ?? 0, rb = b.rating ?? 0;
        if (ra !== rb) return rb - ra;
        return (a.venue_id ?? 0) - (b.venue_id ?? 0);
      });
  })();

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

  // Today's events that carry a deal. NOTE: home rows have `special_offers`
  // (the `event_offers` rename happens later in the stacked-card adapter).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dealsToday = todayEvents.filter((e: any) => {
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

  // ── Today's vibes (fan) ─────────────────────────────────────────────
  // Built from the categories actually on today (city date). Counted the way
  // the list filters — an event counts for every category it carries, once
  // per event — so "See N" lands on N cards. Photos only (video frames would
  // trigger /api/video-thumb). No events today → the next day that has some.
  const fan = useMemo(() => {
    // Same category set + order as the list/map's CategoryPills for that day:
    // the city's taxonomy (or, if empty, what the rows carry), rows with any
    // matching primary counted, zero-count dropped, sorted by that count.
    const cityCats = getCityConfig(city).eventCategories ?? [];
    const rowsOn = (ds: string) => venues.filter((r) => r.event_date && utcDateKey(r.event_date) === ds);
    const build = (ds: string, dateParam: string): VibeFanItem[] => {
      const rows = rowsOn(ds);
      const byCat = new Map<string, { ids: Set<string>; rowCount: number; firstRows: any[]; anyRows: any[] }>(); // eslint-disable-line @typescript-eslint/no-explicit-any
      rows.forEach((r) => {
        primariesOf(r).forEach((prim, i) => {
          const b = byCat.get(prim) ?? { ids: new Set<string>(), rowCount: 0, firstRows: [], anyRows: [] };
          b.ids.add(String(r.event_id ?? `${r.venue_id}-${r.event_time}`));
          b.rowCount += 1;
          (i === 0 ? b.firstRows : b.anyRows).push(r);
          byCat.set(prim, b);
        });
      });
      const taxonomy = cityCats.length ? cityCats : Array.from(byCat.keys());
      return taxonomy
        .filter((prim) => (byCat.get(prim)?.rowCount ?? 0) > 0)
        .map((prim) => [prim, byCat.get(prim)!] as const)
        .sort((a, b) => b[1].rowCount - a[1].rowCount)
        .map(([prim, b]) => {
          const photoRow = [...b.firstRows, ...b.anyRows].find((r) => photoOf(r));
          const src = photoRow ? photoOf(photoRow) : null;
          return {
            id: prim,
            label: getShortDisplayName(prim),
            description: getCategoryTagline(prim),
            count: b.ids.size,
            accent: getCardAccent(prim),
            media: src ? { src } : null,
            fallbackImage: getCategoryFallbackImage(prim),
            href: `/${city}/cards?date=${dateParam}&cat=${encodeURIComponent(prim)}`,
          };
        });
    };
    const today = build(todayStr, 'today');
    if (today.length) return { title: "Today's vibes", ds: todayStr, items: today, rows: rowsOn(todayStr) };
    const next = venues
      .map((r) => (r.event_date ? utcDateKey(r.event_date) : null))
      .filter((d): d is string => !!d && d > todayStr)
      .sort()[0];
    if (!next) return { title: "Today's vibes", ds: todayStr, items: [] as VibeFanItem[], rows: [] as any[] }; // eslint-disable-line @typescript-eslint/no-explicit-any
    const tomorrow = (() => { const d = new Date(`${todayStr}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); })();
    const dayName = new Date(`${next}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
    return { title: next === tomorrow ? "Tomorrow's vibes" : `${dayName}'s vibes`, ds: next, items: build(next, next), rows: rowsOn(next) };
  }, [venues, todayStr, city]);

  // On this week: the next 7 city days (today + 6). One entry per event per
  // day — the sum of the list's ?date= counts over those days. Picks: up to
  // six, spread round-robin across the days, photos and ratings first.
  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(`${todayStr}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
    const inWeek = new Set(days);
    const seen = new Set<string>();
    const byDay = new Map<string, any[]>(); // eslint-disable-line @typescript-eslint/no-explicit-any
    venues.forEach((v) => {
      const ds = v.event_date ? utcDateKey(v.event_date) : null;
      if (!ds || !inWeek.has(ds)) return;
      const k = `${v.event_id ?? `${v.venue_id}-${v.event_time}`}|${ds}`;
      if (seen.has(k)) return;
      seen.add(k);
      byDay.set(ds, [...(byDay.get(ds) ?? []), v]);
    });
    const ranked = days.map((ds) => (byDay.get(ds) ?? []).slice().sort((a, b) =>
      (photoOf(b) ? 1 : 0) - (photoOf(a) ? 1 : 0) || (b.rating ?? 0) - (a.rating ?? 0)));
    const picks: WeekPick[] = [];
    for (let round = 0; picks.length < 6 && round < 6; round++) {
      days.forEach((ds, i) => {
        const e = ranked[i][round];
        if (!e || picks.length >= 6) return;
        const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
          : new Date(`${ds}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
        picks.push({ ds, dayLabel: label, event: e });
      });
    }
    picks.sort((a, b) => a.ds.localeCompare(b.ds));
    return { count: seen.size, picks };
  }, [venues, todayStr]);

  // Pick your vibe: every upcoming event (today on), grouped into tiles by
  // category (getVibeTileGroup), counted the list's way — any category, one
  // per event. Six at most, 10+ events each.
  const vibeTiles = useMemo<VibeTile[]>(() => {
    type Acc = { label: string; cats: Set<string>; ids: Set<string>; firstRows: any[]; anyRows: any[] }; // eslint-disable-line @typescript-eslint/no-explicit-any
    const groups = new Map<string, Acc>();
    venues.forEach((r) => {
      const seenGroups = new Set<string>();
      primariesOf(r).forEach((prim, i) => {
        const g = getVibeTileGroup(prim);
        const id = g?.id ?? prim;
        const acc = groups.get(id) ?? { label: g?.label ?? getShortDisplayName(prim), cats: new Set<string>(), ids: new Set<string>(), firstRows: [], anyRows: [] };
        (g?.categories ?? [prim]).forEach((c) => acc.cats.add(c));
        acc.ids.add(String(r.event_id ?? `${r.venue_id}-${r.event_date}-${r.event_time}`));
        if (!seenGroups.has(id)) (i === 0 ? acc.firstRows : acc.anyRows).push(r);
        seenGroups.add(id);
        groups.set(id, acc);
      });
    });
    return Array.from(groups.entries())
      .filter(([, a]) => a.ids.size >= 10)
      .sort((a, b) => b[1].ids.size - a[1].ids.size)
      .slice(0, 6)
      .map(([id, a]) => {
        const cats = Array.from(a.cats);
        const photoRow = [...a.firstRows, ...a.anyRows].find((r) => photoOf(r));
        return {
          id,
          label: a.label,
          count: a.ids.size,
          tagline: getCategoryTagline(cats[0]),
          photo: photoRow ? photoOf(photoRow) : null,
          fallbackImage: getCategoryFallbackImage(cats[0]),
          accent: getCardAccent(cats[0]),
          href: `/${city}/cards?date=all&${cats.map((c) => `cat=${encodeURIComponent(c)}`).join('&')}`,
        };
      });
  }, [venues, city]);

  // The story in "the plan was in a story": a real event on today, with a photo.
  const problemStory = useMemo<ProblemStory | null>(() => {
    const r = todayVenues.find((v) => photoOf(v) && v.event_name) ?? venues.find((v) => photoOf(v) && v.event_name);
    if (!r) return null;
    const cat = primaryCategory(r);
    return {
      photo: photoOf(r),
      fallbackImage: getCategoryFallbackImage(cat),
      venueName: r.name || r.venue || '',
      eventName: r.event_name,
      accent: getCardAccent(cat),
    };
    // todayVenues is re-derived each render from venues + todayStr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venues, todayStr]);

  // Events on the city's today, one per event (hero count).
  const todayEventCount = useMemo(
    () => new Set(todayVenues.map((r) => String(r.event_id ?? `${r.venue_id}-${r.event_time}`))).size,
    // todayVenues is re-derived each render from venues + todayStr
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [venues, todayStr],
  );

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
  // Stale cities (NEXT_PUBLIC_HOME_HIDDEN_CITIES) stay out of the home's pickers.
  const cityOptions: Array<[string, string]> = ALL_CITIES
    .filter((slug) => !isHomeCityHidden(slug, city))
    .map((slug) => [slug, getCityConfig(slug).displayName]);
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
    background: `linear-gradient(90deg, ${HP.skeleton} 25%, ${HP.skeletonHi} 50%, ${HP.skeleton} 75%)`,
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

  const goMap = (source: string) => {
    trackEvent('nav_view_change', { from: 'home', to: 'map', source });
    router.push(`/${city}/map`);
  };
  const goList = (source: string, query = '') => {
    trackEvent('nav_view_change', { from: 'home', to: 'cards', source });
    router.push(`/${city}/cards${query}`);
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
        background: HP.bg,
        color: HP.ink,
        ...homePaletteVars,
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
          todayCount={todayEventCount}
          venueCount={howStats.venues}
          liveCount={happeningNow.length}
          loading={loading}
          onMap={() => goMap('hero_cta')}
          onList={() => goList('hero_cta')}
          onWhatsApp={() => trackEvent('whatsapp_bot_click', { city, source: 'hero_cta' })}
        />

        {/* § Today's vibes — the fan, built from today's real categories */}
        <VibeFan
          key={fan.ds}
          title={fan.title}
          items={fan.items}
          rows={fan.rows}
          loading={loading}
          onExplore={(item, source) => {
            trackEvent('home_category_click', { city, category: item.id, count: item.count, source });
            // The "See N" link navigates itself; the front fan card doesn't.
            if (source === 'fan_card') router.push(item.href);
          }}
        />

        {/* § The idea + radar */}
        <HomeSignal
          liveCount={happeningNow.length}
          loading={loading}
          dotCategories={fan.items.map((i) => i.id)}
        />

        {/* § Today in <city> — all of today, not just the evening */}
        <section className="px-[18px] pt-16">
          <HomeSectionHeader
            font={HF.today}
            label={`Today in ${cityName}`}
            count={loading ? '—' : `${todayEvents.length} events`}
          />
          {loading ? (
            <>
              <div className="flex gap-3 mb-3.5">
                {[0, 1].map(i => (
                  <div key={i} style={{ flex: '0 0 48%', aspectRatio: '3/4', ...skeletonStyle('100%', undefined, { borderRadius: 12 }) }} />
                ))}
              </div>
              {[0, 1, 2].map(i => (
                <div key={i} className="grid gap-3 py-3 items-start" style={{ gridTemplateColumns: '20px 72px 1fr', borderTop: `1px solid ${TILE_RULE}` }}>
                  <div style={skeletonStyle(18, 12)} />
                  <div style={skeletonStyle(72, 72, { borderRadius: 8 })} />
                  <div>
                    <div style={skeletonStyle(80, 10)} />
                    <div style={{ ...skeletonStyle(140, 16), marginTop: 6 }} />
                    <div style={{ ...skeletonStyle(100, 10), marginTop: 6 }} />
                  </div>
                </div>
              ))}
            </>
          ) : todayEvents.length > 0 ? (
            <>
              <div className="mb-3.5">
                <HScrollRail>
                  {todayEvents.slice(0, 12).map((e) => (
                    <EventTile key={e.event_id || e.venue_id} event={e} width="48%" sizes="(max-width: 430px) 48vw, 206px"
                      liked={liked.has(String(e.venue_id))} onLike={() => toggle(String(e.venue_id))}
                      onOpen={() => openEvent(e, 'today_scroller')} />
                  ))}
                </HScrollRail>
              </div>
              {todayEvents.slice(0, 4).map((e, i) => (
                <EventRow key={e.event_id || e.venue_id || i} event={e} index={i}
                  liked={liked.has(String(e.venue_id))} onLike={() => toggle(String(e.venue_id))}
                  onOpen={() => openEvent(e, 'today_list')} />
              ))}
              {todayEvents.length > 4 && (
                <button
                  onClick={() => {
                    trackEvent('nav_view_change', { from: 'home', to: 'cards', source: 'today_see_all' });
                    router.push(`/${city}/cards?date=today`);
                  }}
                  className={`${BTN_SECONDARY} w-full mt-3`}
                  style={BTN_SECONDARY_STYLE}
                >
                  See all {todayEvents.length} events today
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <p className={`${H4_LABEL} text-silver-dim text-center py-5`}>No events found for today</p>
          )}
        </section>

        {/* § Weekend — one row per day (Fri / Sat / Sun) */}
        {(loading || weekendByDay.some(d => d.events.length > 0)) && (
          <section className="px-[18px] pt-7">
            <HomeSectionHeader font={HF.weekend} label="Weekend vibes" />
            {loading ? (
              <div className="flex gap-3 overflow-x-hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[180px]">
                    <div style={{ ...skeletonStyle(180, undefined, { borderRadius: 12 }), aspectRatio: '3/4' }} />
                    <div style={{ ...skeletonStyle(140, 10), marginTop: 8 }} />
                  </div>
                ))}
              </div>
            ) : (
              weekendByDay.filter(d => d.events.length > 0).map(({ ds, label, events }) => (
                <div key={ds} className="mb-5">
                  <button
                    onClick={() => {
                      trackEvent('home_weekend_day_click', { city, date: ds });
                      router.push(`/${city}/cards?date=${ds}`);
                    }}
                    className="w-full flex items-center justify-between pb-2.5"
                  >
                    <span className="font-inter font-[550] text-[16px] text-pale">{label}</span>
                    <span className={`${H4_LABEL} inline-flex items-center gap-1 text-silver`}>
                      {events.length} events
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                  <HScrollRail>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {events.map((e: any) => (
                      <EventTile key={`${e.venue_id}-${ds}`} event={e} width={180} sizes="(max-width: 430px) 40vw, 172px"
                        onOpen={() => openEvent(e, 'weekend_rail')} />
                    ))}
                  </HScrollRail>
                </div>
              ))
            )}
          </section>
        )}

        {/* § Good to know + venue call to action (from Home 4) */}
        <HomeFaq accent={brandAccent} onExpand={(q) => trackEvent('faq_expand', { q, source: 'home' })} />
        <VenueCta accent={brandAccent} onClick={() => trackEvent('venue_lead_click', { source: 'home_cta' })} />

        {/* § Happening now — live right now, hidden when empty */}
        {(loading || happeningNow.length > 0) && (
          <section className="px-[18px] pt-7">
            <HomeSectionHeader
              font={HF.live}
              label={<>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: T.live, animation: 'wmv-pulse 1.5s infinite' }} />
                Happening now
              </>}
              count={loading ? '—' : `${happeningNow.length} live`}
            />
            <HScrollRail>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ flex: '0 0 130px', aspectRatio: '3/4', ...skeletonStyle('100%', undefined, { borderRadius: 12 }) }} />
                ))
                : happeningNow.map((e) => (
                  <EventTile key={e.event_id || e.venue_id} event={e} width={130} sizes="140px" live
                    onOpen={() => openEvent(e, 'happening_now')} />
                ))}
            </HScrollRail>
          </section>
        )}

        {/* § Today's deals — hidden when empty */}
        {!loading && dealsToday.length > 0 && (
          <section className="px-[18px] pt-7">
            <HomeSectionHeader font={HF.deals} label="Today's deals" count={`${dealsToday.length} offers`} />
            <HScrollRail>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {dealsToday.map((e: any) => (
                <DealCard key={e.event_id || e.venue_id} event={e} onOpen={() => openEvent(e, 'deals_rail')} />
              ))}
            </HScrollRail>
          </section>
        )}

        {/* § Areas */}
        <section className="px-[18px] pt-7">
          <HomeSectionHeader font={HF.areas} label="Areas" />
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid items-center gap-3 py-3" style={{ gridTemplateColumns: '20px 1fr auto', borderBottom: `1px solid ${TILE_RULE}` }}>
                <div style={skeletonStyle(18, 10)} />
                <div style={skeletonStyle(140, 16)} />
                <div style={skeletonStyle(60, 10)} />
              </div>
            ))
            : areas.map((a, i) => (
              <NumberedRow key={a.label} index={i} label={a.label} meta={`${a.count} events`}
                onClick={() => {
                  trackEvent('area_row_click', { area: a.label, city });
                  // Map view seeds ?area= into its filters — a spatial pick
                  // belongs on the map, not the list.
                  router.push(`/${city}/map?area=${encodeURIComponent(a.label)}`);
                }} />
            ))}
        </section>

        {/* § How it works — Find / Sort / Go + live stats (from Home 4) */}
        <HowItWorks
          cityName={cityName}
          stats={howStats}
          loading={loading}
          accent={cityAccent}
          kicker={{ index: 1, total: 2 }}
          scrollRoot={mainRef}
        />

        {/* § Your city — picker + atlas (from Home 4) */}
        <CityAtlas
          city={city}
          cities={cityOptions}
          accent={cityAccent}
          pinCategories={topCategories}
          kicker={{ index: 2, total: 2 }}
          scrollRoot={mainRef}
          onChangeCity={switchCity}
          onMap={() => goMap('city_atlas_map')}
          onList={() => goList('city_atlas_list')}
        />

        {/* § From the content plan: problem → relief, this week, pick your
            vibe, map or list (marketing/strategy/HOMEPAGE_CONTENT_PLAN.md) */}
        <HomeProblem story={problemStory} scrollRoot={mainRef} />
        <HomeThisWeek
          cityName={cityName}
          count={week.count}
          picks={week.picks}
          loading={loading}
          scrollRoot={mainRef}
          onOpen={(e) => openEvent(e, 'this_week_rail')}
          onMap={() => goMap('this_week_map')}
        />
        <HomeVibeTiles
          cityName={cityName}
          tiles={vibeTiles}
          loading={loading}
          scrollRoot={mainRef}
          onPick={(t) => trackEvent('home_category_click', { city, category: t.id, count: t.count, source: 'vibe_tile' })}
        />
        <HomeMapOrList
          pinCategories={fan.items.map((i) => i.id)}
          scrollRoot={mainRef}
          onMap={() => goMap('map_or_list')}
          onList={() => goList('map_or_list')}
        />

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
