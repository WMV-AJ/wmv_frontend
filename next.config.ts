import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shake icon libraries so we pay only for the icons we actually import.
  // Shaves ~80–120 KB off the initial JS bundle.
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Redirects for / → /dubai (plus every other non-city top-level path) are
  // handled in src/middleware.ts — broader matching, single source of truth.
  images: {
    // Built-in Sharp-based optimizer. Images get resized to display size,
    // converted to WebP/AVIF, and cached on disk by Next.
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/wmv-ig-images/**' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24, // 24h on-disk cache
    // Only generate two sizes for thumbnails — fewer Sharp jobs per image.
    imageSizes: [128, 256],
    deviceSizes: [640, 1080],
  },
  output: 'standalone',
  serverExternalPackages: [
    '@react-google-maps/api',
  ],
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

export default nextConfig;
