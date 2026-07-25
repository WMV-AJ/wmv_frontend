'use client';

import React, { useState } from 'react';
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
  /** Optional sibling image used as the video thumbnail (ignored for images). */
  poster?: string | null;
  videoAutoPlay?: boolean;
  /** Kept for call-site compatibility; thumbnails are plain images now. */
  lazyVideo?: boolean;
}

/** Server-extracted real frame of the video (ffmpeg, disk-cached, ~20KB). */
export function videoThumbUrl(videoSrc: string): string {
  return `/api/video-thumb?src=${encodeURIComponent(videoSrc.split('#')[0])}`;
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
  lazyVideo: _lazyVideo = false,
}: EventMediaProps) {
  void _lazyVideo;
  const [failed, setFailed] = useState(false);

  const url = src || null;
  const isVideo =
    !!url &&
    ((mediaType || '').toLowerCase() === 'video' || VIDEO_URL_PATTERN.test(url.split('#')[0]));

  // Sibling image beats the extracted frame (no ffmpeg work needed).
  const posterImage = poster && !VIDEO_URL_PATTERN.test(poster) ? poster : null;

  const imageStyle: React.CSSProperties = { objectFit: 'cover', ...style };

  if (isVideo && url && videoAutoPlay) {
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
        poster={posterImage ?? videoThumbUrl(url)}
        {...(!fill && width !== undefined ? { width } : {})}
        {...(!fill && height !== undefined ? { height } : {})}
        className={className}
        style={videoStyle}
      />
    );
  }

  // Images AND non-autoplaying videos land here: one optimized <Image>.
  const effectiveSrc = failed || !url
    ? PLACEHOLDER_IMAGE
    : isVideo
      ? (posterImage ?? videoThumbUrl(url))
      : url;

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
