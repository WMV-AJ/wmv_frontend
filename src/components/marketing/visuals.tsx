// Shared visual elements for the marketing surfaces — the "what we scan"
// source chips, the pipeline timeline, a tilted story-card collage, and a
// radar-ring backdrop. Pure presentational markup (server-component safe).
import { T, mono, serif } from '@/lib/theme/tokens';

// ── Sources: what the pipeline scans ─────────────────────────────────
export const SOURCES = [
  { n: '01', label: 'Instagram stories', count: '2,341 / day', color: '#ec4899' },
  { n: '02', label: 'Instagram posts', count: '1,089 / day', color: '#eab308' },
  { n: '03', label: 'Ticketing APIs', count: '12 sources', color: '#10b981' },
  { n: '04', label: 'Platinum List', count: 'live feed', color: '#0ea5e9' },
  { n: '05', label: 'Venue websites', count: '380 venues', color: '#f97316' },
  { n: '06', label: 'City event sites', count: '47 sites', color: '#f4c430' },
] as const;

export function SourceChips({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {SOURCES.map((s) => (
        <div
          key={s.n}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: compact ? '6px 10px' : '9px 13px',
            borderRadius: 10,
            background: `linear-gradient(135deg, ${s.color}1f, rgba(20,20,31,0.9))`,
            border: `1px solid ${s.color}44`,
            borderLeft: `3px solid ${s.color}`,
          }}
        >
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%', background: s.color,
              boxShadow: `0 0 8px ${s.color}`, flexShrink: 0,
              animation: 'wmv-src-pulse 2.4s ease-in-out infinite',
            }}
          />
          <span>
            <span style={{
              display: 'block', color: T.ink, fontSize: compact ? 11 : 12,
              fontWeight: 700, lineHeight: 1.2,
            }}>{s.label}</span>
            <span style={{
              display: 'block', fontFamily: mono, fontSize: compact ? 8 : 9,
              letterSpacing: '0.08em', textTransform: 'uppercase', color: s.color,
              marginTop: 1,
            }}>{s.count}</span>
          </span>
        </div>
      ))}
      <style>{`@keyframes wmv-src-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }`}</style>
    </div>
  );
}

// ── Pipeline: connected numbered steps ───────────────────────────────
export interface PipelineStep {
  n: string;
  title: string;
  desc: string;
  color: string;
}

export function PipelineTimeline({ steps }: { steps: PipelineStep[] }) {
  return (
    <div style={{ position: 'relative' }}>
      {/* connecting line */}
      <div style={{
        position: 'absolute', left: 15, top: 10, bottom: 22, width: 2,
        background: `linear-gradient(180deg, ${steps[0]?.color ?? T.accent}, ${steps[steps.length - 1]?.color ?? T.accent})`,
        opacity: 0.35,
      }} />
      {steps.map((s) => (
        <div key={s.n} style={{ position: 'relative', display: 'flex', gap: 16, marginBottom: 22 }}>
          <div style={{
            position: 'relative', zIndex: 1, flexShrink: 0,
            width: 32, height: 32, borderRadius: '50%',
            background: T.bg, border: `2px solid ${s.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: mono, fontSize: 11, fontWeight: 700, color: s.color,
            boxShadow: `0 0 14px ${s.color}33`,
          }}>{s.n}</div>
          <div style={{ paddingTop: 4 }}>
            <div style={{ color: T.ink, fontSize: 14, fontWeight: 700 }}>{s.title}</div>
            <p style={{ color: T.inkMuted, fontSize: 13, lineHeight: 1.6, margin: '4px 0 0' }}>{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Story-card collage: three tilted "IG story" tiles ────────────────
const COLLAGE_CARDS = [
  { img: '/landing/cards/nightclub-1.webp', venue: 'Soho Garden', line: 'HOUSE NIGHT · 11PM', color: '#f4c430', rot: -7, x: 0, y: 10 },
  { img: '/landing/cards/beach-2.webp', venue: 'Cove Beach', line: 'SUNSET SESSION · 6PM', color: '#22d3ee', rot: 3, x: 92, y: 0 },
  { img: '/landing/cards/rooftop-3.webp', venue: 'Iris Rooftop', line: 'CITY LIGHTS · 9PM', color: '#f472b6', rot: 9, x: 184, y: 14 },
] as const;

export function StoryCollage() {
  return (
    <div style={{ position: 'relative', height: 210, width: 300, margin: '0 auto' }}>
      {COLLAGE_CARDS.map((c) => (
        <div
          key={c.venue}
          style={{
            position: 'absolute', left: c.x, top: c.y,
            width: 108, height: 176, borderRadius: 12, overflow: 'hidden',
            transform: `rotate(${c.rot}deg)`,
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 14px 34px rgba(0,0,0,0.55)',
            backgroundImage: `url(${c.img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* story progress bars */}
          <div style={{ position: 'absolute', top: 6, left: 6, right: 6, display: 'flex', gap: 3 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                flex: 1, height: 2, borderRadius: 2,
                background: i === 0 ? '#fff' : 'rgba(255,255,255,0.35)',
              }} />
            ))}
          </div>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, transparent 40%, rgba(5,5,12,0.92))',
          }} />
          <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8 }}>
            <div style={{
              fontFamily: mono, fontSize: 7, fontWeight: 700, letterSpacing: '0.08em',
              color: c.color, textTransform: 'uppercase', marginBottom: 2,
            }}>{c.line}</div>
            <div style={{
              fontFamily: serif, fontSize: 13, color: '#fff', lineHeight: 1.1,
            }}>{c.venue}</div>
          </div>
        </div>
      ))}
      {/* "captured" scan line */}
      <div style={{
        position: 'absolute', inset: '-8px -12px', borderRadius: 16,
        border: `1px dashed ${T.accent}55`, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: -18, right: -6, fontFamily: mono, fontSize: 8,
        letterSpacing: '0.14em', textTransform: 'uppercase', color: T.accent,
      }}>● scanning</div>
    </div>
  );
}

// ── Radar rings backdrop (absolutely positioned inside a relative parent) ──
export function RadarRings({ size = 260, right = -70, top = -30, color = '#f4c430' }: {
  size?: number; right?: number; top?: number; color?: string;
}) {
  return (
    <div aria-hidden style={{
      position: 'absolute', right, top, width: size, height: size,
      pointerEvents: 'none', opacity: 0.6,
    }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{
          position: 'absolute', inset: i * (size / 8),
          borderRadius: '50%',
          border: `1px solid ${color}${['2e', '24', '1a', '12'][i]}`,
        }} />
      ))}
      <div style={{
        position: 'absolute', left: '50%', top: '50%', width: 6, height: 6,
        transform: 'translate(-50%,-50%)', borderRadius: '50%',
        background: color, boxShadow: `0 0 12px ${color}`,
      }} />
    </div>
  );
}
