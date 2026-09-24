import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { Roboto, Open_Sans, Archivo_Narrow } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { VenueDataProvider } from "@/contexts/VenueDataContext";
import { CitiesProvider } from "@/contexts/CitiesProvider";
import AnalyticsProvider from "@/lib/analytics/AnalyticsProvider";
import CookieConsentBanner from "@/components/consent/CookieConsentBanner";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// ── TYPE SYSTEM (2026-09) ─────────────────────────────────────────────
// One pair, site-wide: Roboto for display, Open Sans for body. Both load
// from next/font/google; nothing is self-hosted and no page defines a
// font of its own. To swap the pair again, change these two loaders and
// the two stacks in src/lib/theme/tokens.ts — call sites reference the
// roles (displayFont / bodyFont), never a family name.
//
// Both are variable faces covering the full weight range this codebase
// asks for, so unlike the previous pairs nothing collapses: 500 and 600
// render as themselves rather than snapping to the nearest shipped cut.

// Display. Variable 100–900, mixed case, italics available.
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Helvetica Neue", "sans-serif"],
});

// Body. Variable 300–800.
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Helvetica Neue", "sans-serif"],
});

// Condensed. Variable 400–700, the narrow cut of Archivo — drawn for dense
// UI labels, which is exactly what the filter pills and the card's category
// chip are. Replaces the wide-tracked Inter treatment: at 10px uppercase the
// pills needed .13em to read, and that tracking pushed the row far wider than
// the frame. A condensed face reads at .02em, so the same labels fit in
// roughly 30% less width with no loss of legibility.
const archivoNarrow = Archivo_Narrow({
  variable: "--font-archivo-narrow",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  fallback: ["Roboto Condensed", "Arial Narrow", "system-ui", "sans-serif"],
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
        className={`${roboto.variable} ${openSans.variable} ${archivoNarrow.variable} antialiased`}
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
