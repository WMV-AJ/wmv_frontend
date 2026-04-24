'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main
      className="h-screen w-full flex items-center justify-center"
      style={{ background: '#0a0a1a' }}
    >
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <h1 className="text-white text-3xl font-bold">Where&apos;s My Vibe</h1>
        <p className="text-white/60 text-sm max-w-xs">
          New home page coming soon. For now pick a view:
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/map"
            className="w-full rounded-xl py-3 text-center font-semibold text-white"
            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            Map View
          </Link>
          <Link
            href="/cards"
            className="w-full rounded-xl py-3 text-center font-semibold text-white"
            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            Card View
          </Link>
        </div>
      </div>
    </main>
  );
}
