'use client';

// Full-screen viewer for an event's photos and videos.
//
// Rendered into <body>, not inside the card that opened it: the page frame is
// transformed and the cards clip their overflow, which traps a `position:
// fixed` layer inside the card's box. Plain <img>/<video>, so any image host
// works.
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '@/lib/media-placeholder';

export interface LightboxItem {
  url: string;
  isVideo: boolean;
  /** Still shown before a video plays. */
  poster?: string;
}

const ROUND: React.CSSProperties = {
  position: 'absolute', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '50%', border: 'none', background: 'rgba(255, 255, 255, 0.18)', color: '#fff', cursor: 'pointer',
};

export default function MediaLightbox({ items, startIndex = 0, alt, onClose }: {
  items: LightboxItem[];
  startIndex?: number;
  alt: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(() => Math.min(Math.max(startIndex, 0), Math.max(items.length - 1, 0)));
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);
  const many = items.length > 1;

  const step = useCallback((by: number) => {
    setIndex((i) => (i + by + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    setMounted(true);
    // Nothing behind the viewer should scroll while it is open.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
      else if (ev.key === 'ArrowLeft' && many) step(-1);
      else if (ev.key === 'ArrowRight' && many) step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, many, step]);

  if (!mounted || items.length === 0) return null;
  const item = items[index];
  const broken = failed.has(index);
  const markFailed = () => setFailed((prev) => new Set(prev).add(index));
  const stop = (ev: React.SyntheticEvent) => ev.stopPropagation();
  const media: React.CSSProperties = { maxWidth: '100%', maxHeight: '82dvh', objectFit: 'contain', borderRadius: 10, display: 'block' };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={(ev) => { ev.stopPropagation(); onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.96)', padding: 16, touchAction: 'none',
      }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={(ev) => { ev.stopPropagation(); onClose(); }}
        style={{ ...ROUND, width: 44, height: 44, right: 14, top: 'max(14px, env(safe-area-inset-top))' }}
      >
        <X style={{ width: 22, height: 22 }} />
      </button>

      {many && (
        <>
          <button type="button" aria-label="Previous" onClick={(ev) => { ev.stopPropagation(); step(-1); }}
            style={{ ...ROUND, width: 40, height: 40, left: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <ChevronLeft style={{ width: 22, height: 22 }} />
          </button>
          <button type="button" aria-label="Next" onClick={(ev) => { ev.stopPropagation(); step(1); }}
            style={{ ...ROUND, width: 40, height: 40, right: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <ChevronRight style={{ width: 22, height: 22 }} />
          </button>
        </>
      )}

      <div onClick={stop} style={{ maxWidth: '100%', maxHeight: '100%' }}>
        {broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={PLACEHOLDER_IMAGE} alt={alt} style={media} />
        ) : item.isVideo ? (
          <video key={item.url} src={item.url} poster={item.poster} controls autoPlay loop playsInline onError={markFailed} style={media} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={item.url} src={item.url} alt={alt} onError={markFailed} style={media} />
        )}
      </div>

      {many && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'max(18px, env(safe-area-inset-bottom))', textAlign: 'center', color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
          {index + 1} / {items.length}
        </div>
      )}
    </div>,
    document.body,
  );
}
