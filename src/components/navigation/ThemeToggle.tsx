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

export default function ThemeToggle({ size = 28 }: { size?: number }) {
  const { theme: current, setTheme } = useTheme();
  const theme = useMounted() ? current : 'light';
  const seg = size - 6;
  const pick = (t: 'light' | 'dark') => {
    if (t === theme) return;
    setTheme(t);
    trackEvent('theme_change', { theme: t });
  };
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
