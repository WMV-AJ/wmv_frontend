'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  /** Optional sibling image used as the FALLBACK video thumbnail (ignored for images). */
  poster?: string | null;
  videoAutoPlay?: boolean;
  /**
   * Autoplaying videos only: show the poster frame until the tile nears the
   * viewport, then mount the <video>. Stops off-screen rails from pulling
   * 500KB+ mp4s on page load.
   */
  lazyVideo?: boolean;
}

/**
 * Server-extracted real frame of the video (ffmpeg, disk-cached, ~20KB).
 * `fallback` is a sibling image the API redirects to if frame extraction
 * fails — better a related photo than a generic placeholder.
 */
export function videoThumbUrl(videoSrc: string, fallback?: string | null): string {
  const base = `/api/video-thumb?src=${encodeURIComponent(videoSrc.split('#')[0])}`;
  return fallback ? `${base}&fallback=${encodeURIComponent(fallback)}` : base;
}

/**
 * Unified event media renderer.
 *
 * Key speed decision: tiles never mount <video> unless they actually autoplay.
 * A muted, non-autoplaying, control-less <video> can never play — it was just
 * a very expensive way to show one frame (500KB+ of mp4 per tile). Instead,
 * video tiles render their REAL first frame as a tiny server-extracted JPEG
 * (/api/video-thumb) through the image optimizer. Autoplaying surfaces keep
 * the <video>, with the same real frame as poster so nothing paints black.
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
  const posterRef = useRef<HTMLImageElement | null>(null);

  const url = src || null;
  const isVideo =
    !!url &&
    ((mediaType || '').toLowerCase() === 'video' || VIDEO_URL_PATTERN.test(url.split('#')[0]));

  // Sibling image: FALLBACK only. The video's own extracted frame is always
  // the primary thumbnail — a sibling photo is often an unrelated flyer,
  // which read as a "random" thumbnail on video tiles.
  const posterImage = poster && !VIDEO_URL_PATTERN.test(poster) ? poster : null;

  const wantsLazyVideo = isVideo && videoAutoPlay && lazyVideo;
  useEffect(() => {
    if (!wantsLazyVideo || videoInView) return;
    const el = posterRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVideoInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVideoInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [wantsLazyVideo, videoInView]);

  const imageStyle: React.CSSProperties = { objectFit: 'cover', ...style };

  if (isVideo && url && videoAutoPlay && (!lazyVideo || videoInView)) {
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

    return (
      <video
        src={url.split('#')[0]}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        poster={videoThumbUrl(url, posterImage)}
        {...(!fill && width !== undefined ? { width } : {})}
        {...(!fill && height !== undefined ? { height } : {})}
        className={className}
        style={videoStyle}
      />
    );
  }

  // Images AND non-autoplaying videos land here: one optimized <Image>.
  // (Lazy autoplaying videos also render this poster until near-viewport.)
  const effectiveSrc = failed || !url
    ? (failed && isVideo && posterImage ? posterImage : PLACEHOLDER_IMAGE)
    : isVideo
      ? videoThumbUrl(url, posterImage)
      : url;

  const dimensionProps = fill
    ? ({ fill: true } as const)
    : { width: width ?? 128, height: height ?? 128 };

  return (
    <Image
      ref={posterRef}
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
