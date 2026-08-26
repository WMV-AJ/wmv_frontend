'use client';

import type { CSSProperties } from 'react';
import { hash } from '@/lib/landing/animation-core';

const VENUE_COLORS: Record<string, string> = {
  nightclub: '#f4c430',
  restaurant: '#34d399',
  bar: '#f97316',
  beach: '#22d3ee',
  rooftop: '#f472b6',
  hotel: '#a3a3a3',
};

export interface IGStoryCardProps {
  venue?: string;
  category?: string;
  title?: string;
  meta?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotate?: number;
  scale?: number;
  opacity?: number;
  hue?: string | null;
  seed?: number;
  image?: string | null;
  variant?: 'story' | 'website';
}

const handleImgError = (
  e: React.SyntheticEvent<HTMLImageElement>,
  venue: string,
) => {
  void venue;
  const img = e.currentTarget;
  // Cards are bundled local assets now — if one somehow fails, hide it
  // rather than hotlinking a third-party placeholder service.
  img.style.display = 'none';
};

export function IGStoryCard({
  venue = 'Soho Garden',
  category = 'nightclub',
  title = 'FRIDAY NIGHT',
  meta = '10PM · House',
  x = 0,
  y = 0,
  width = 220,
  height = 380,
  rotate = 0,
  scale = 1,
  opacity = 1,
  hue = null,
  seed = 1,
  image = null,
  variant = 'story',
}: IGStoryCardProps) {
  const accent = hue || VENUE_COLORS[category] || '#f4c430';
  const h1 = (hash(seed) * 360) | 0;
  const h2 = (hash(seed + 1) * 360) | 0;
  const fallbackBg = `linear-gradient(${(hash(seed + 2) * 180) | 0}deg,
    oklch(35% 0.15 ${h1}) 0%,
    oklch(20% 0.10 ${h2}) 60%,
    oklch(8% 0.05 ${h2}) 100%)`;

  if (variant === 'website') {
    const domain = venue.toLowerCase().replace(/[^a-z0-9]/g, '') + '.ae';
    const wrapper: CSSProperties = {
      // Position via transform only (left/top stay 0): per-frame left/top
      // changes force layout; translate3d stays on the compositor.
      position: 'absolute',
      left: 0,
      top: 0,
      width,
      height,
      transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
      opacity,
      borderRadius: 14,
      overflow: 'hidden',
      background: '#0f0f1f',
      boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.10) inset',
      willChange: 'transform, opacity',
      display: 'flex',
      flexDirection: 'column',
    };

    return (
      <div style={wrapper}>
        <div
          style={{
            height: 28,
            background: 'rgba(255,255,255,0.07)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '0 10px',
            flexShrink: 0,
          }}
        >
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#28c840' }} />
          <div
            style={{
              flex: 1,
              marginLeft: 8,
              height: 16,
              borderRadius: 4,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              color: 'rgba(255,255,255,0.6)',
              fontFamily: "var(--font-geist-sans), ui-monospace, monospace",
              fontSize: 8,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {domain}
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative', background: fallbackBg }}>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e) => handleImgError(e, venue)}
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.85) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 14,
              right: 14,
              bottom: 18,
              color: '#fff',
              fontFamily: "var(--font-fraunces), Georgia, serif",
              textShadow: '0 2px 12px rgba(0,0,0,0.7)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: accent,
                marginBottom: 4,
              }}
            >
              events · book now
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
              {venue}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                color: 'rgba(255,255,255,0.85)',
                marginTop: 4,
                letterSpacing: 0,
              }}
            >
              {title}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default IG-story variant
  const storyWrapper: CSSProperties = {
    // Transform-only positioning — see website variant note above.
    position: 'absolute',
    left: 0,
    top: 0,
    width,
    height,
    transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
    opacity,
    borderRadius: 18,
    overflow: 'hidden',
    background: fallbackBg,
    boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.08) inset',
    willChange: 'transform, opacity',
  };

  return (
    <div style={storyWrapper}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={(e) => handleImgError(e, venue)}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: image
            ? 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.85) 100%)'
            : 'linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          right: 8,
          display: 'flex',
          gap: 3,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 2.5,
              borderRadius: 2,
              background: i === 0 ? '#fff' : 'rgba(255,255,255,0.4)',
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accent}, ${accent}55)`,
            border: '2px solid rgba(255,255,255,0.95)',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            letterSpacing: '-0.01em',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}
        >
          {venue}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>2h</div>
      </div>

      {!image && (
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: '35%',
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: accent,
            opacity: 0.45,
            filter: 'blur(40px)',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 24,
          color: '#fff',
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontWeight: 700,
          letterSpacing: '-0.02em',
          textShadow: '0 2px 12px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: accent,
            marginBottom: 4,
          }}
        >
          TONIGHT
        </div>
        <div style={{ fontSize: 22, lineHeight: 1.05, marginBottom: 6 }}>{title}</div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: 0,
          }}
        >
          {meta}
        </div>
      </div>
    </div>
  );
}
