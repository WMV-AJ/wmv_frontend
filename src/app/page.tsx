// Server wrapper for the landing page: owns metadata + Organization JSON-LD.
// The interactive page lives in ./LandingClient.tsx ('use client').
import type { Metadata } from 'next';
import LandingClient from './LandingClient';
import JsonLd from '@/components/seo/JsonLd';
import { buildOrganizationSchema } from '@/lib/seo-schema';
import { getActiveCities } from '@/lib/server-data';

export async function generateMetadata(): Promise<Metadata> {
  const cities = await getActiveCities();
  const cityNames = cities.map((c) => c.displayName).join(', ');
  const description = `Stop scrolling, start going. Every venue's Instagram stories and events — scanned, sorted into vibes, and mapped live. Tonight in ${cityNames}.`;

  return {
    title: "Where's My Vibe — What's actually happening tonight",
    description,
    alternates: { canonical: '/' },
    openGraph: {
      title: "Where's My Vibe — What's actually happening tonight",
      description,
      url: '/',
      siteName: "Where's My Vibe",
      type: 'website',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: "Where's My Vibe — What's actually happening tonight",
      description,
      images: ['/og-image.png'],
    },
  };
}

export default function LandingPage() {
  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />
      <LandingClient />
    </>
  );
}
