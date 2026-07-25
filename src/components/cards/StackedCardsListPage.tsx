'use client';

// Shared scaffold for simple "list of stacked event cards" pages
// (/[city]/vibe/[vibeId], /[city]/area/[areaSlug]). Owns the layout fixes that
// were hard-won on the vibe page:
//   - measured visible-viewport height (mobile toolbar-safe)
//   - single fixed scroll container (#cards-scroll-container) with sticky header
//   - clip of the overlapping-card stack to the last card's real bottom, which
//     kills the ~680px phantom scroll gap the negative-margin deck reserves.
// Pages provide their own header row (use <ListPageHeader>) + the cards.
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import HomeMasthead from '@/components/navigation/HomeMasthead';
import StackedEventCards, { type EventCardData } from '@/components/events/StackedEventCards';
import { getCategoryColorForStackedCards } from '@/lib/stacked-card-adapter';

const T = {
  bg: '#0a0a14',
  surface: '#14141f',
  ink: '#f5f2ed',
  inkMuted: '#a8a2b8',
  line: '#2a2638',
};
const serif = "var(--font-playfair), 'Playfair Display', Georgia, serif";
const mono = "var(--font-geist-sans), ui-monospace, monospace";

// Standard header row used inside the sticky bar: back + icon circle + title + count.
export function ListPageHeader({
  onBack, icon, iconBg, title, subtitle, onViewMap,
}: {
  onBack: () => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  /** Optional "view on map" deep-link action (e.g. /dubai/map?vibe=brunch). */
  onViewMap?: () => void;
}) {
  return (
    <div style={{
      padding: '9px 16px', borderBottom: `1px solid ${T.line}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <button
        onClick={onBack}
        aria-label="Back"
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${T.line}`, background: T.surface, cursor: 'pointer', padding: 0 }}
      >
        <ArrowLeft style={{ width: 13, height: 13, color: T.inkMuted }} />
      </button>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, fontWeight: 400, color: T.ink, lineHeight: 1.05, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        <div style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: T.inkMuted, marginTop: 3 }}>
          {subtitle}
        </div>
      </div>
      {onViewMap && (
        <button
          onClick={onViewMap}
          style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 999,
            border: `1px solid ${T.line}`, background: T.surface, cursor: 'pointer',
            fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.8px',
            textTransform: 'uppercase', color: T.ink,
          }}
        >
          Map →
        </button>
      )}
    </div>
  );
}

interface StackedCardsListPageProps {
  city: string;
  header: React.ReactNode;
  cards: EventCardData[];
  isLoading: boolean;
  emptyState?: React.ReactNode;
  /** analytics source label for the masthead nav buttons */
  mastheadFrom?: string;
}

export default function StackedCardsListPage({
  city, header, cards, isLoading, emptyState, mastheadFrom = 'list',
}: StackedCardsListPageProps) {
  // Size the shell to the *actual visible* viewport (not 100vh / inset:0) so on
  // mobile the bottom sits at the real visible bottom, not behind the toolbar.
  const [viewportH, setViewportH] = useState<number | null>(null);
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const update = () => setViewportH(vv?.height ?? window.innerHeight);
    update();
    vv?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      vv?.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // Clip the card stack to the last card's real bottom (kills the phantom gap).
  // Re-runs on expand/collapse + when the card set changes.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const stack = root.querySelector('.stacked-cards-stack') as HTMLElement | null;
    if (!stack) return;

    let adjusting = false;
    let raf = 0;
    const fix = () => {
      if (adjusting) return;
      adjusting = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        stack.style.height = 'auto';
        const cardEls = stack.querySelectorAll<HTMLElement>('.stacked-card');
        if (cardEls.length) {
          const last = cardEls[cardEls.length - 1];
          stack.style.height = `${Math.ceil(last.offsetTop + last.offsetHeight)}px`;
        }
        requestAnimationFrame(() => { adjusting = false; });
      });
    };

    fix();
    const mo = new MutationObserver(fix);
    mo.observe(stack, { subtree: true, attributes: true, attributeFilter: ['class', 'style'], childList: true });
    const ro = new ResizeObserver(fix);
    ro.observe(stack);
    window.addEventListener('resize', fix);
    return () => {
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener('resize', fix);
      cancelAnimationFrame(raf);
    };
  }, [cards]);

  const defaultEmpty = (
    <div style={{ padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 18, color: T.ink }}>
        Nothing here right now
      </div>
      <div style={{ fontFamily: mono, fontSize: 11, color: T.inkMuted, marginTop: 8, lineHeight: 1.5 }}>
        Check back soon — the city updates daily.
      </div>
    </div>
  );

  return (
    <ThemeProvider>
      <style>{`#cards-scroll-container::-webkit-scrollbar { display: none; }`}</style>
      <main
        style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: viewportH != null ? `${viewportH}px` : '100dvh',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          background: T.bg, color: T.ink,
        }}
      >
        <div style={{
          maxWidth: 430, margin: '0 auto', width: '100%',
          height: '100%', display: 'flex', flexDirection: 'column',
          background: T.bg,
        }}>
          {/* Fixed top bar — masthead + page header (do not scroll) */}
          <div style={{ flexShrink: 0 }}>
            <HomeMasthead city={city} from={mastheadFrom} />
            {header}
          </div>

          {/* Scroll area — ONLY the cards scroll */}
          <div
            id="cards-scroll-container"
            ref={scrollRef}
            style={{
              flex: 1, minHeight: 0,
              overflowY: 'auto', overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              scrollbarWidth: 'none' as const,
            }}
          >
            {isLoading ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto" />
              </div>
            ) : cards.length === 0 ? (
              emptyState ?? defaultEmpty
            ) : (
              <div style={{ paddingBottom: 24 }}>
                <StackedEventCards cards={cards} getCategoryColor={getCategoryColorForStackedCards} />
              </div>
            )}
          </div>
        </div>
      </main>
    </ThemeProvider>
  );
}
