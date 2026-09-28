'use client';

// Light / dark switch for the top nav bars (HomeMasthead, TopNav,
// MarketingShell). Two segments — sun and moon — with the active one filled.

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { trackEvent } from '@/lib/analytics/track';

// False on the server and during hydration, true after — so the first client
// render matches the server HTML (light), then shows the real theme.
const noopSubscribe = () => () => {};
const useMounted = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

/** `compact`: one round button (moon on light, sun on dark) for crowded bars
 *  like the map/list TopNav; default: the two-segment switch. */
export default function ThemeToggle({ size = 28, compact = false }: { size?: number; compact?: boolean }) {
  const { theme: current, setTheme } = useTheme();
  const theme = useMounted() ? current : 'light';
  const seg = size - 6;
  const pick = (t: 'light' | 'dark') => {
    if (t === theme) return;
    setTheme(t);
    trackEvent('theme_change', { theme: t });
  };
  if (compact) {
    const next = theme === 'dark' ? 'light' : 'dark';
    const Icon = theme === 'dark' ? Sun : Moon;
    return (
      <button
        type="button"
        onClick={() => pick(next)}
        aria-label={`Switch to ${next} theme`}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90"
        style={{ background: 'color-mix(in srgb, var(--wmv-ink) 9%, transparent)', color: 'var(--wmv-ink-muted)' }}
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  }
  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="inline-flex items-center flex-shrink-0 p-[2px] rounded-full"
      style={{ height: size, background: 'var(--wmv-raised)', border: '1px solid var(--wmv-line)' }}
    >
      {(['light', 'dark'] as const).map((t) => {
        const active = theme === t;
        const Icon = t === 'light' ? Sun : Moon;
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t === 'light' ? 'Light theme' : 'Dark theme'}
            onClick={() => pick(t)}
            className="flex items-center justify-center rounded-full transition-colors duration-200"
            style={{
              width: seg,
              height: seg,
              background: active ? 'var(--wmv-btn)' : 'transparent',
              color: active ? 'var(--wmv-btn-ink)' : 'var(--wmv-ink-muted)',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
}
