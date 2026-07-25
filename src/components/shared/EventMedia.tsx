'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { PLACEHOLDER_IMAGE } from '@/lib/media-placeholder';

const VIDEO_URL_PATTERN = /\.(mp4|mov|webm)$/i;

export interface EventMediaProps {
  src?: string | null;
  mediaType?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
  width?: number;
  height?: number;
  /** Optional sibling image used as the <video> poster (ignored for images). */
  poster?: string | null;
  videoAutoPlay?: boolean;
  /**
   * Only mount the <video> element once the tile is within 200px of the
   * viewport; until then render the poster (or placeholder) via next/image.
   */
  lazyVideo?: boolean;
}

/**
 * Route an image URL through the Next.js image optimizer so video posters
 * also benefit from AVIF/WebP + resize + caching.
 */
function optimizedPosterUrl(url: string): string {
  return `/_next/image?url=${encodeURIComponent(url)}&w=640&q=75`;
}

/**
 * Unified event media renderer: decides image vs video, routes images (and
 * video posters) through the Next.js image optimizer, and falls back to the
 * local placeholder on error.
 */
export default function EventMedia({
  src,
  mediaType,
  alt,
  sizes,
  priority = false,
  className,
  style,
  fill = false,
  width,
  height,
  poster,
  videoAutoPlay = false,
  lazyVideo = false,
}: EventMediaProps) {
  const [failed, setFailed] = useState(false);
  const [videoInView, setVideoInView] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const url = src || null;
  const isVideo =
    !!url &&
    ((mediaType || '').toLowerCase() === 'video' || VIDEO_URL_PATTERN.test(url));

  // SSR-safe lazy video mount: start unmounted, observe after mount.
  useEffect(() => {
    if (!isVideo || !lazyVideo || videoInView) return;
    const el = sentinelRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVideoInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVideoInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVideo, lazyVideo, videoInView]);

  // Poster must itself be an image URL to be useful.
  const posterImage = poster && !VIDEO_URL_PATTERN.test(poster) ? poster : null;

  const imageStyle: React.CSSProperties = { objectFit: 'cover', ...style };

  if (isVideo && url) {
    // Not yet near the viewport → render the poster/placeholder instead of
    // mounting a <video> element (saves the media fetch entirely).
    if (lazyVideo && !videoInView) {
      const wrapperStyle: React.CSSProperties = fill
        ? { position: 'absolute', inset: 0 }
        : { position: 'relative', width, height };
      return (
        <div ref={sentinelRef} className={className} style={wrapperStyle}>
          <Image
            src={posterImage ?? PLACEHOLDER_IMAGE}
            alt={alt}
            fill
            sizes={sizes}
            style={imageStyle}
            onError={() => setVideoInView(true)}
          />
        </div>
      );
    }

    const videoStyle: React.CSSProperties = fill
      ? {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          ...style,
        }
      : { objectFit: 'cover', ...style };

    // Non-autoplaying videos get a media-fragment start time (#t=0.1): the
    // browser fetches and PAINTS that frame as the preview, so every video
    // shows its own real thumbnail. The poster underneath is just the
    // loading/error fallback (a metadata-only video would otherwise paint
    // black — readyState 0).
    const videoSrc = videoAutoPlay || url.includes('#') ? url : `${url}#t=0.1`;
    return (
      <video
        src={videoSrc}
        muted
        loop
        playsInline
        preload="metadata"
        {...(videoAutoPlay ? { autoPlay: true } : {})}
        poster={optimizedPosterUrl(posterImage ?? PLACEHOLDER_IMAGE)}
        {...(!fill && width !== undefined ? { width } : {})}
        {...(!fill && height !== undefined ? { height } : {})}
        className={className}
        style={videoStyle}
      />
    );
  }

  const effectiveSrc = failed || !url ? PLACEHOLDER_IMAGE : url;
  const dimensionProps = fill
    ? ({ fill: true } as const)
    : { width: width ?? 128, height: height ?? 128 };

  return (
    <Image
      src={effectiveSrc}
      alt={alt}
      sizes={sizes}
      priority={priority}
      className={className}
      style={imageStyle}
      {...dimensionProps}
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}
