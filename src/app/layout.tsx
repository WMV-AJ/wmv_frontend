import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { Geist, Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { VenueDataProvider } from "@/contexts/VenueDataContext";
import AnalyticsProvider from "@/lib/analytics/AnalyticsProvider";
import CookieConsentBanner from "@/components/consent/CookieConsentBanner";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Where's My Vibe - Dubai Event Discovery",
  description: "Discover the hottest events, venues, and nightlife in Dubai through real-time Instagram stories and venue data.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Where's My Vibe",
  },
  keywords: ["Dubai events", "Dubai nightlife", "Dubai venues", "Dubai clubs", "Dubai restaurants", "Dubai entertainment", "Where's My Vibe"],
  authors: [{ name: "Where's My Vibe Team" }],
  creator: "Where's My Vibe",
  publisher: "Where's My Vibe",
  icons: {
    icon: [
      { url: '/logo_clean.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/logo_clean.svg',
    apple: '/logo_clean.svg',
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
    title: "Where's My Vibe - Dubai Event Discovery",
    description: "Discover the hottest events, venues, and nightlife in Dubai through real-time Instagram stories and venue data.",
    url: "https://wheresmyvibe.com",
    siteName: "Where's My Vibe",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Where's My Vibe - Dubai Event Discovery",
    description: "Discover the hottest events, venues, and nightlife in Dubai through real-time Instagram stories and venue data.",
    creator: "@wheresmyvibe",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${playfairDisplay.variable} antialiased`}
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
              <VenueDataProvider>
                {children}
              </VenueDataProvider>
            </AnalyticsProvider>
          </Suspense>
          <CookieConsentBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
