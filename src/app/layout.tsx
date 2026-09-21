import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { SUSE } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { VenueDataProvider } from "@/contexts/VenueDataContext";
import { CitiesProvider } from "@/contexts/CitiesProvider";
import AnalyticsProvider from "@/lib/analytics/AnalyticsProvider";
import CookieConsentBanner from "@/components/consent/CookieConsentBanner";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// ── TYPE SYSTEM (2026-09) ─────────────────────────────────────────────
// One pair, site-wide: SUSE Mono for display/headlines, SUSE for body/UI.
// Replaces Geist + Space Grotesk here and the per-page Inter + Space Mono
// that used to load on /[city]. No other family is loaded anywhere.
//
// Both are variable faces on the same 100–800 weight axis and share a
// skeleton, so they sit together without a third font to bridge them.

// Body / UI. Variable 100–800, no italics in the family.
const suse = SUSE({
  variable: "--font-suse",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

// Display / headlines. SUSE Mono is not in Next 15.5's bundled Google Fonts
// metadata, so it is self-hosted from src/fonts (SIL OFL 1.1). Same 100–800
// variable axis; latin first, latin-ext second for accented venue names.
const suseMono = localFont({
  variable: "--font-suse-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
  // next/font/local cannot emit unicode-range, so both subsets are declared
  // with identical descriptors and the browser falls through per-glyph.
  // latin is declared last so it wins the descriptor tie and stays primary;
  // latin-ext is only consulted for accented names outside Latin-1.
  src: [
    { path: "../fonts/SUSEMono-latin-ext.woff2", weight: "100 800", style: "normal" },
    { path: "../fonts/SUSEMono-latin.woff2", weight: "100 800", style: "normal" },
  ],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  // Base URL for resolving relative canonical/OG URLs in per-route metadata.
  metadataBase: new URL("https://wheresmyvibe.com"),
  // Generic across cities. Per-city pages (e.g. /[city]/page.tsx) can override
  // via their own `generateMetadata` for SEO-targeted titles.
  title: "Where's My Vibe - Event Discovery",
  description: "Discover the hottest events, venues, and nightlife through real-time Instagram stories and venue data.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Where's My Vibe",
  },
  keywords: ["events", "nightlife", "venues", "clubs", "restaurants", "entertainment", "Dubai", "Bangalore", "Where's My Vibe"],
  authors: [{ name: "Where's My Vibe Team" }],
  creator: "Where's My Vibe",
  publisher: "Where's My Vibe",
  icons: {
    // Animated GIF logo. Chrome/Firefox animate it; Safari shows the first frame.
    // The favicon.ico in app/ is the static fallback for browsers without GIF favicon support.
    icon: [
      { url: '/wmv-logo.gif', type: 'image/gif' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/wmv-logo.gif',
    apple: '/wmv-logo.gif',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Where's My Vibe - Event Discovery",
    description: "Discover the hottest events, venues, and nightlife through real-time Instagram stories and venue data.",
    url: "https://wheresmyvibe.com",
    siteName: "Where's My Vibe",
    locale: "en_US",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Where's My Vibe - Event Discovery",
    description: "Discover the hottest events, venues, and nightlife through real-time Instagram stories and venue data.",
    creator: "@wheresmyvibe",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Event/venue media (Instagram scrapes) and map tiles come from these
            hosts on every content page — warming the connections saves a
            DNS+TLS round-trip on the first image/tile fetch (mobile: 100-300ms). */}
        <link rel="preconnect" href="https://storage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://storage.googleapis.com" />
        <link rel="preconnect" href="https://basemaps.cartocdn.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://tiles.basemaps.cartocdn.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${suse.variable} ${suseMono.variable} antialiased`}
      >
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                // Default to denied; CookieConsentBanner flips this on Accept.
                gtag('consent', 'default', {
                  analytics_storage: 'denied',
                  ad_storage: 'denied',
                });
                // send_page_view: false because AnalyticsProvider fires page_view on route change.
                gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
              `}
            </Script>
          </>
        )}
        <AuthProvider>
          <Suspense fallback={null}>
            <AnalyticsProvider>
              <CitiesProvider>
                <VenueDataProvider>
                  {children}
                </VenueDataProvider>
              </CitiesProvider>
            </AnalyticsProvider>
          </Suspense>
          <CookieConsentBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
