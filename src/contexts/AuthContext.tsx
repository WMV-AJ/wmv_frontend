'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

/**
 * Backend-driven auth (no Supabase).
 *
 * Flow:
 *   1. signIn() → window redirect to ${BACKEND}/api/auth/google/start?return_to=...
 *   2. Backend handles Google OAuth, issues an opaque session token
 *   3. Backend redirects to /auth/complete#token=...&return_to=...
 *   4. /auth/complete writes token to localStorage and pushes to return_to
 *   5. AuthProvider mounts, reads token, calls /api/auth/me to hydrate user
 *
 * The token rides as `Authorization: Bearer <token>` on every authed request.
 */

const TOKEN_KEY = 'wmv_token';

export type CitySlug = 'dubai' | 'bangalore';
export type ThemePreference = 'dark' | 'light' | 'system';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  /** First name from Google (separate from `name` for personalised greetings). */
  given_name: string | null;
  family_name: string | null;
  /** Google's email-ownership flag. */
  email_verified: boolean | null;
  /** User's preferred city — null means "use whatever city the URL says". */
  default_city: CitySlug | null;
  theme_preference: ThemePreference;
  /** Venue ids the user has favourited (stable order). */
  favorite_venue_ids: number[];
}

/** Subset of AuthUser that the user can update via PATCH /api/auth/me. */
export interface UserPreferencesUpdate {
  default_city?: CitySlug | null;
  theme_preference?: ThemePreference;
  favorite_venue_ids?: number[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (returnTo?: string) => void;
  signOut: () => Promise<void>;
  /** Update server-side preferences. Resolves to the new AuthUser, or null on failure. */
  updatePreferences: (patch: UserPreferencesUpdate) => Promise<AuthUser | null>;
  /** Add/remove a venue id from the user's favourites. Optimistic local update. */
  toggleFavorite: (venueId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: () => {},
  signOut: async () => {},
  updatePreferences: async () => null,
  toggleFavorite: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token || !BACKEND_URL) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setAuthToken(null);
        setUser(null);
      } else if (res.ok) {
        const data = (await res.json()) as { user: AuthUser };
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      // Network failure shouldn't sign the user out — keep their token, leave user null
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const signIn = useCallback((returnTo?: string) => {
    if (typeof window === 'undefined' || !BACKEND_URL) return;
    const target = returnTo ?? `${window.location.pathname}${window.location.search}` ?? '/';
    const url = `${BACKEND_URL}/api/auth/google/start?return_to=${encodeURIComponent(target)}`;
    window.location.href = url;
  }, []);

  const updatePreferences = useCallback(async (patch: UserPreferencesUpdate): Promise<AuthUser | null> => {
    const token = getAuthToken();
    if (!token || !BACKEND_URL) return null;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { user: AuthUser };
      setUser(data.user);
      return data.user;
    } catch {
      return null;
    }
  }, []);

  const toggleFavorite = useCallback(async (venueId: number): Promise<void> => {
    if (!user) return;
    const current = user.favorite_venue_ids ?? [];
    const next = current.includes(venueId)
      ? current.filter((id) => id !== venueId)
      : [...current, venueId];
    // Optimistic local update so the heart icon flips immediately.
    setUser({ ...user, favorite_venue_ids: next });
    const updated = await updatePreferences({ favorite_venue_ids: next });
    // Revert on failure.
    if (!updated) setUser({ ...user, favorite_venue_ids: current });
  }, [user, updatePreferences]);

  const signOut = useCallback(async () => {
    const token = getAuthToken();
    setAuthToken(null);
    setUser(null);
    if (token && BACKEND_URL) {
      try {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Best-effort
      }
    }
    if (typeof window !== 'undefined') window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updatePreferences, toggleFavorite }}>
      {children}
    </AuthContext.Provider>
  );
}
