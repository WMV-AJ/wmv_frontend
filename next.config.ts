import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/', destination: '/dubai', permanent: false },
      { source: '/map', destination: '/dubai/map', permanent: false },
      { source: '/cards', destination: '/dubai/cards', permanent: false },
    ];
  },
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
