import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Tree-shake icon libraries so we pay only for the icons we actually import.
  // Shaves ~80–120 KB off the initial JS bundle.
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Redirects for / → /dubai (plus every other non-city top-level path) are
  // handled in src/middleware.ts — broader matching, single source of truth.
  //
  // `/favicon.ico` rewrite — browsers auto-fetch this URL for tab icons. We
  // want to serve the animated wmv-logo.gif there, but if we just copy the
  // GIF to public/favicon.ico, Next.js sets content-type: image/x-icon (from
  // the extension) and browsers refuse to render it because nginx also adds
  // `x-content-type-options: nosniff`. A `beforeFiles` rewrite keeps the URL
  // at /favicon.ico while the response body and content-type come from
  // /wmv-logo.gif (image/gif). Chrome/Firefox animate it; Safari shows the
  // first frame statically.
  async rewrites() {
    return {
      beforeFiles: [{ source: '/favicon.ico', destination: '/wmv-logo.gif' }],
      afterFiles: [],
      fallback: [],
    };
  },
  images: {
    // Built-in Sharp-based optimizer. Images get resized to display size,
    // converted to WebP/AVIF, and cached on disk by Next.
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/wmv-ig-images/**' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Ticketing sites host their own posters. Without these the optimizer
      // answers 400 and every website-sourced event renders with no image,
      // even though image_url is set on all 399 active listings and reaches
      // final_1.media_url_1. Measured against production on 2026-08-20:
      //   highape / allevents  direct 200, /_next/image 400
      //   storage.googleapis   direct 200, /_next/image 200
      // The 400 is the tell - an allowed host missing a file answers 404.
      { protocol: 'https', hostname: 'highape.blr1.cdn.digitaloceanspaces.com' },
      { protocol: 'https', hostname: 'cdn-ip.allevents.in' },
      // A chunk of media rows still point at raw Instagram CDN URLs (the
      // scraper hasn't mirrored them to GCS). Without these, the optimizer
      // 400s and the tile shows a broken image.
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
    ],
    // AVIF first (30-50% smaller than WebP for photos), WebP fallback.
    // AVIF encodes are slower but the 24h on-disk cache amortizes them.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24, // 24h on-disk cache
    // 96 covers the card thumbnails; keeps Sharp jobs per image low.
    imageSizes: [96, 128, 256],
    // 640 covers card galleries, 828 the fullscreen lightbox on phones,
    // 1080 large/retina viewports.
    deviceSizes: [640, 828, 1080],
  },
  output: 'standalone',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

// Sentry wraps the config to inject the client/server/edge instrumentation
// and (only when SENTRY_AUTH_TOKEN is present at build time) upload source
// maps. Without the token it is a thin pass-through; without
// NEXT_PUBLIC_SENTRY_DSN at runtime the SDK never initialises.
export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  // Route browser events through the app to dodge ad-blockers.
  tunnelRoute: '/monitoring',
});
