'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
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
} from 'lucide-react';

// ── THEME TOKENS — see /tmp/design_pw/.../Design Tokens.md ─────────
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

const mono = "var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace";
const serif = "var(--font-playfair), 'Playfair Display', Georgia, serif";

// ── DEMO DATA ──────────────────────────────────────────────────────
const TONIGHT_EVENTS = [
  { id: 't1', venue: 'Soho Garden', title: 'Friday Night Live · Resident DJs', area: 'Meydan', rating: 4.8, reviews: 120, time: '10 PM — 3 AM', vibe: 'Clubs', color: '#a78bfa', img: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=640&q=80&auto=format' },
  { id: 't2', venue: 'Zuma Dubai', title: 'Late Lounge · DJ Set', area: 'DIFC', rating: 4.9, reviews: 340, time: '11 PM — 2 AM', vibe: 'Rooftops', color: '#f472b6', img: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=640&q=80&auto=format' },
  { id: 't3', venue: 'Blu Dubai', title: 'Rooftop Sessions', area: 'Business Bay', rating: 4.6, reviews: 88, time: '9 PM — 1 AM', vibe: 'Bars', color: '#f97316', img: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=640&q=80&auto=format' },
  { id: 't4', venue: 'Twiggy', title: 'Sunset Lagoon Session', area: 'Jumeirah', rating: 4.7, reviews: 201, time: '7 PM — 12 AM', vibe: 'Beach', color: '#22d3ee', img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=640&q=80&auto=format' },
];

const WEEKEND_EVENTS = [
  { id: 'w1', venue: 'White Dubai', title: 'Saturday House Takeover', day: 'SAT', date: '25', area: 'Meydan', color: '#a78bfa', img: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=640&q=80&auto=format' },
  { id: 'w2', venue: 'Cove Beach', title: 'Pool Party · Open Brunch', day: 'SAT', date: '25', area: 'Palm', color: '#22d3ee', img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=640&q=80&auto=format' },
  { id: 'w3', venue: 'Five Palm', title: 'Sunday Rooftop Social', day: 'SUN', date: '26', area: 'Palm', color: '#f472b6', img: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=640&q=80&auto=format' },
  { id: 'w4', venue: 'Treehouse', title: 'Ladies Night · Afro House', day: 'SUN', date: '26', area: 'DIFC', color: '#84cc16', img: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=640&q=80&auto=format' },
];

const VIBES = [
  { id: 'clubs', label: 'Clubs', count: 40, color: '#a78bfa', Icon: Music },
  { id: 'brunch', label: 'Brunch', count: 11, color: '#34d399', Icon: UtensilsCrossed },
  { id: 'rooftops', label: 'Rooftops', count: 18, color: '#f472b6', Icon: Sparkles },
  { id: 'ladies', label: 'Ladies Night', count: 13, color: '#ec4899', Icon: Heart },
  { id: 'beach', label: 'Beach Clubs', count: 9, color: '#22d3ee', Icon: Waves },
  { id: 'happy', label: 'Happy Hour', count: 21, color: '#f59e0b', Icon: GlassWater },
  { id: 'pool', label: 'Pool Party', count: 7, color: '#06b6d4', Icon: Droplet },
  { id: 'live', label: 'Live Music', count: 14, color: '#84cc16', Icon: MicVocal },
];

const AREAS = [
  { id: 'palm', label: 'Palm Jumeirah', count: 32 },
  { id: 'jbr', label: 'JBR', count: 24 },
  { id: 'downtown', label: 'Downtown', count: 41 },
  { id: 'difc', label: 'DIFC', count: 28 },
  { id: 'meydan', label: 'Meydan', count: 17 },
  { id: 'marina', label: 'Dubai Marina', count: 35 },
];

const STORIES = [
  { id: 's1', venue: 'Soho Garden', user: 'sohogarden', color: '#a78bfa', live: true },
  { id: 's2', venue: 'White Dubai', user: 'whitedubai', color: '#f472b6', live: true },
  { id: 's3', venue: 'Zuma', user: 'zumadubai', color: '#34d399', live: true },
  { id: 's4', venue: 'Cove Beach', user: 'covebeach', color: '#22d3ee', live: false },
  { id: 's5', venue: 'Five Palm', user: 'fivepalm', color: '#f97316', live: false },
  { id: 's6', venue: 'Blu', user: 'bludubai', color: '#ec4899', live: false },
  { id: 's7', venue: 'Twiggy', user: 'twiggydxb', color: '#84cc16', live: true },
  { id: 's8', venue: 'Treehouse', user: 'treehousedxb', color: '#f59e0b', live: false },
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

export default function Home() {
  const router = useRouter();
  const [liked, setLiked] = useState<Set<string>>(new Set(['t1', 'w2']));
  const toggle = (id: string) =>
    setLiked(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const issueDate = new Date()
    .toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
    .toUpperCase();

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        background: T.bg,
        color: T.ink,
        fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 430, margin: '0 auto', paddingBottom: 96 }}>

        {/* Masthead */}
        <div style={{
          padding: '14px 18px 12px',
          borderBottom: `1px solid ${T.line}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, background: T.ink, color: T.inkInverse,
              fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>W</div>
            <div>
              <div style={{
                fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: 14,
                color: T.ink, letterSpacing: '-0.01em', lineHeight: 1,
              }}>Where&rsquo;s My Vibe</div>
              <div style={{ fontFamily: mono, fontSize: 8.5, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: T.inkMuted, marginTop: 2 }}>
                ISS. 023 · {issueDate} · DXB
              </div>
            </div>
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: T.accent, color: T.inkInverse,
            fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>A</div>
        </div>

        {/* Hero — radar + title */}
        <div style={{ position: 'relative', padding: '20px 18px 0', minHeight: 300 }}>
          {/* radar */}
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
              <span style={{ color: T.accent }}>the city&rsquo;s on</span>
            </h1>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 500, letterSpacing: '0.8px', textTransform: 'uppercase', color: T.inkMuted, marginTop: 14, maxWidth: 220, lineHeight: 1.5 }}>
              Dubai&rsquo;s nightlife, pulled live from Instagram &amp; the web.
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{
          margin: '22px 18px 0',
          borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        }}>
          {[
            { n: 142, l: 'Vibes tonight' },
            { n: 64, l: 'Venues' },
            { n: 28, l: 'Live now', live: true },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '14px 10px',
              borderLeft: i > 0 ? `1px solid ${T.line}` : 'none',
            }}>
              <div style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 36, color: s.live ? T.live : T.accent, lineHeight: 1 }}>
                {s.n}
              </div>
              <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: T.inkMuted, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                {s.live && <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.live, animation: 'wmv-pulse 1.5s infinite', display: 'inline-block' }} />}
                {s.l}
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: '14px 18px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px', border: `1.5px solid ${T.line}`, borderRadius: 0,
            background: T.surface, cursor: 'pointer',
          }}>
            <Search style={{ width: 16, height: 16, color: T.ink, strokeWidth: 2.5 }} />
            <span style={{ flex: 1, fontSize: 13, color: T.inkMuted, fontFamily: mono, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Search for your Vibe ?</span>
            <span style={{ fontFamily: mono, fontSize: 10, background: T.ink, color: T.inkInverse, padding: '3px 6px', letterSpacing: '0.5px' }}>⌘K</span>
          </div>
        </div>

        {/* § A — Fresh from instagram */}
        <div style={{ padding: '22px 18px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${T.line}`, paddingBottom: 8, marginBottom: 10,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              § A — Fresh from instagram
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.live, animation: 'wmv-pulse 1.5s infinite', display: 'inline-block' }} />
              <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1px' }}>LIVE</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {STORIES.map((s, i) => (
              <div key={s.id} style={{
                aspectRatio: '3 / 4', position: 'relative', overflow: 'hidden',
                background: `linear-gradient(${135 + i * 20}deg, ${s.color}, ${s.color}66, ${T.bg})`,
                border: s.live ? `2px solid ${T.ink}` : `1px solid ${T.line}`,
              }}>
                {s.live && (
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
            ))}
          </div>
        </div>

        {/* § B — Tonight */}
        <div style={{ padding: '28px 18px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${T.line}`, paddingBottom: 8, marginBottom: 14,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              § B — Tonight in Dubai
            </div>
            <span style={{ fontFamily: mono, fontSize: 10, color: T.accent, fontWeight: 600 }}>04 EVENTS →</span>
          </div>

          {/* Featured */}
          <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', marginBottom: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TONIGHT_EVENTS[0].img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.1)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(10,10,20,0.92))' }} />
            <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5 }}>
              <span style={{ background: T.live, color: '#fff', fontFamily: mono, fontSize: 9, fontWeight: 700, padding: '3px 6px', letterSpacing: '0.8px' }}>● LIVE</span>
              <span style={{ background: T.chipLight, color: T.inkInverse, fontFamily: mono, fontSize: 9, fontWeight: 700, padding: '3px 6px', letterSpacing: '0.8px' }}>FEATURED</span>
            </div>
            <button
              onClick={() => toggle(TONIGHT_EVENTS[0].id)}
              style={{
                position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 0,
                background: T.surface, border: `1.5px solid ${T.line}`, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              }}
              aria-label="Like"
            >
              <Heart style={{ width: 15, height: 15, color: liked.has('t1') ? T.pink : T.ink, fill: liked.has('t1') ? T.pink : 'transparent' }} />
            </button>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 }}>
              <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: T.accent, letterSpacing: '1px', textTransform: 'uppercase' }}>
                {TONIGHT_EVENTS[0].area} · {TONIGHT_EVENTS[0].time}
              </div>
              <div style={{
                fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 32,
                color: T.ink, lineHeight: 0.95, marginTop: 4, letterSpacing: '-0.02em',
              }}>
                {TONIGHT_EVENTS[0].venue}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                {TONIGHT_EVENTS[0].title}
              </div>
            </div>
          </div>

          {TONIGHT_EVENTS.slice(1, 4).map((e, i) => (
            <div key={e.id} style={{
              display: 'grid', gridTemplateColumns: '22px 1fr auto', gap: 10,
              padding: '12px 0', borderTop: `1px solid ${T.lineFaint}`, alignItems: 'start',
            }}>
              <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: T.accent }}>
                0{i + 2}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, color: T.inkMuted, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  {e.area} · {e.vibe}
                </div>
                <div style={{
                  fontFamily: serif, fontStyle: 'italic', fontSize: 20, fontWeight: 400,
                  color: T.ink, letterSpacing: '-0.015em', lineHeight: 1.05, marginTop: 2,
                }}>
                  {e.venue}
                </div>
                <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 3 }}>
                  {e.title}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6, fontFamily: mono, fontSize: 9, color: T.inkMuted, fontWeight: 500, letterSpacing: '0.5px' }}>
                  <span>{e.time}</span>
                  <span>★ {e.rating} ({e.reviews})</span>
                </div>
              </div>
              <button
                onClick={() => toggle(e.id)}
                style={{
                  width: 28, height: 28, border: `1px solid ${T.line}`, background: T.surface,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                }}
                aria-label="Like"
              >
                <Heart style={{ width: 13, height: 13, color: liked.has(e.id) ? T.pink : T.ink, fill: liked.has(e.id) ? T.pink : 'transparent' }} />
              </button>
            </div>
          ))}
        </div>

        {/* § C — Pick your vibe */}
        <div style={{ padding: '28px 18px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${T.line}`, paddingBottom: 8, marginBottom: 10,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              § C — Pick your vibe
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: `1px solid ${T.line}`, background: T.line }}>
            {VIBES.map((v, i) => {
              const Icon = v.Icon;
              return (
                <div key={v.id} style={{
                  background: T.surface, padding: '12px 8px 10px',
                  borderRight: i % 4 !== 3 ? `1px solid ${T.line}` : 'none',
                  borderBottom: i < 4 ? `1px solid ${T.line}` : 'none',
                  aspectRatio: '1',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', background: v.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon style={{ width: 12, height: 12, color: T.ink }} />
                  </div>
                  <div>
                    <div style={{
                      fontFamily: serif, fontStyle: 'italic', fontSize: 14, fontWeight: 400,
                      color: T.ink, lineHeight: 1, letterSpacing: '-0.01em',
                    }}>{v.label}</div>
                    <div style={{ fontFamily: mono, fontSize: 9, color: v.color, marginTop: 3, fontWeight: 600 }}>
                      {String(v.count).padStart(2, '0')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* § D — This weekend */}
        <div style={{ padding: '28px 18px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${T.line}`, paddingBottom: 8, marginBottom: 12,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              § D — This weekend
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {WEEKEND_EVENTS.map(e => (
              <div key={e.id} style={{ flexShrink: 0, width: 180 }}>
                <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(10,10,20,0.85))' }} />
                  <div style={{
                    position: 'absolute', top: 8, left: 8, background: T.chipLight, color: T.inkInverse,
                    padding: '4px 8px', fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
                  }}>{e.day} {e.date}</div>
                  <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
                    <div style={{ fontFamily: mono, fontSize: 8, fontWeight: 600, color: e.color, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                      {e.area}
                    </div>
                    <div style={{
                      fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: T.ink, lineHeight: 1.05, marginTop: 2,
                    }}>{e.venue}</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: T.inkMuted, marginTop: 6, lineHeight: 1.3 }}>
                  {e.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* § E — Areas */}
        <div style={{ padding: '28px 18px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${T.line}`, paddingBottom: 8, marginBottom: 4,
          }}>
            <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              § E — Areas
            </div>
          </div>
          {AREAS.map((a, i) => (
            <div key={a.id} style={{
              display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center', gap: 12,
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
              <ArrowUpRight style={{ width: 13, height: 13, color: T.ink }} />
            </div>
          ))}
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

      {/* CTA bar */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60,
        padding: 14, background: T.surface,
        display: 'flex', gap: 10,
        maxWidth: 430, margin: '0 auto',
      }}>
        <button
          onClick={() => router.push('/map')}
          style={{
            flex: 1, height: 50, borderRadius: 0, border: `1px solid ${T.accent}`, cursor: 'pointer',
            background: T.accent, color: T.inkInverse,
            fontFamily: mono, fontWeight: 600, fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 0,
          }}
        >
          <MapIcon style={{ width: 15, height: 15 }} />
          Open the map →
        </button>
        <button
          style={{
            width: 50, height: 50, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
            background: 'transparent', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}
          aria-label="Favorites"
        >
          <Heart style={{ width: 16, height: 16, color: T.pink }} />
        </button>
      </div>
    </main>
  );
}
