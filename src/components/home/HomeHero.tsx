'use client';

// Headline block for the city home: the city's live date, "Tonight in
// {City}", today's counts, and the three ways in — the map, today's list,
// and the WhatsApp bot. (The radar and the source chips now live in the
// "idea" section, HomeSignal.)

import { List, Map as MapIcon, MessageCircle } from 'lucide-react';
import { T } from '@/lib/theme/tokens';
import { H4_LABEL } from '@/components/shared/card-style';
import { BTN_PRIMARY, BTN_SECONDARY, BTN_SECONDARY_STYLE } from './HomeParts';

// Placeholder until the bot is live: the button renders only when this is
// set. NEXT_PUBLIC_ vars are inlined at build time, so production needs it in
// the build environment (GitHub Actions), not just on the server.
const WHATSAPP_BOT_URL = (process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL ?? '').trim();

export default function HomeHero({ cityName, dateLabel, todayCount, liveCount, loading, onMap, onList, onWhatsApp }: {
  cityName: string;
  /** e.g. "Saturday 26 Sept" — in the city's calendar. */
  dateLabel: string;
  todayCount: number;
  liveCount: number;
  loading: boolean;
  onMap: () => void;
  onList: () => void;
  onWhatsApp: () => void;
}) {
  return (
    <section className="relative px-[18px] pt-5" aria-labelledby="home-hero-title">
      <div className={`${H4_LABEL} inline-flex items-center gap-1.5`} style={{ color: T.live }}>
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: T.live, animation: 'wmv-pulse 1.5s infinite' }} />
        Live · {dateLabel}
      </div>

      <h1 id="home-hero-title" className="font-tight font-semibold uppercase text-[46px] leading-[0.92] tracking-[-0.045em] text-pale mt-3.5">
        Tonight in<br />
        <span style={{ color: T.accent }}>{cityName}</span>
      </h1>

      <p className="font-tight font-semibold uppercase text-[18px] leading-tight tracking-[-0.03em] text-silver mt-3">
        Less scroll. More tonight.
      </p>

      <p className={`${H4_LABEL} text-silver-dim mt-3`}>
        {loading
          ? 'Scanning every venue’s stories…'
          : <><span className="text-pale tabular-nums">{todayCount}</span> events today · <span className="text-pale tabular-nums">{liveCount}</span> live now</>}
      </p>

      <div className="grid grid-cols-2 gap-2 mt-5">
        <button type="button" onClick={onMap} className={`${BTN_PRIMARY} px-3`} data-cta="map">
          <MapIcon className="w-4 h-4" />
          Explore on map
        </button>
        <button type="button" onClick={onList} className={`${BTN_SECONDARY} px-3`} style={BTN_SECONDARY_STYLE} data-cta="list">
          <List className="w-4 h-4" />
          Today&rsquo;s list
        </button>
        {WHATSAPP_BOT_URL && (
          <a
            href={WHATSAPP_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onWhatsApp}
            className={`${BTN_SECONDARY} col-span-2`}
            style={BTN_SECONDARY_STYLE}
            data-cta="whatsapp"
          >
            <MessageCircle className="w-4 h-4" style={{ color: '#25D366' }} />
            WhatsApp bot
          </a>
        )}
      </div>
    </section>
  );
}
