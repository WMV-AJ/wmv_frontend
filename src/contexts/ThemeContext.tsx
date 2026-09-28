'use client';

// Site-wide light / dark theme. Light is the default; the visitor's choice
// is kept in localStorage (wmv_theme) and applied as `.dark` on <html>.
// THEME_BOOT_SCRIPT runs in <head> before first paint so there's no flash;
// the provider only reads that state back and handles the toggle.
// (Key is new on purpose: the old `theme` key was written as "dark" for
// every past map/list visitor and would override the light default.)

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ThemeName = 'light' | 'dark';

const STORAGE_KEY = 'wmv_theme';

export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=t==='dark';var r=document.documentElement;r.classList.toggle('dark',d);r.dataset.theme=d?'dark':'light';}catch(e){}})();`;

interface ThemeContextType {
  theme: ThemeName;
  isDarkMode: boolean;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function applyTheme(t: ThemeName) {
  const r = document.documentElement;
  r.classList.toggle('dark', t === 'dark');
  r.dataset.theme = t;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Server + first client render assume light; the effect below syncs to
  // what the boot script already applied to <html>.
  const [theme, setThemeState] = useState<ThemeName>('light');

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) setThemeState('dark');
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    applyTheme(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* private mode */ }
  }, []);

  const toggleTheme = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode: theme === 'dark', setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
