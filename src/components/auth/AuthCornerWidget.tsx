'use client';

import React, { useSyncExternalStore } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from '@/components/auth/UserMenu';
import SignInButton from '@/components/auth/SignInButton';

/**
 * Small auth indicator for pages that don't render the full TopNav (the
 * editorial home page and event-detail page). Shows:
 *   - compact UserMenu (avatar circle + dropdown) when signed in
 *   - compact SignInButton (purple pill) when signed out
 *
 * While the auth state is hydrating we render nothing so the page doesn't
 * flicker from "Sign in" → avatar on first paint.
 *
 * The widget renders only the icon; the parent page is responsible for
 * positioning it (typically `position: absolute; top: <safe>; right: 12px`).
 */
// false on the server and during hydration, true once mounted — without
// an extra effect-driven render.
const noopSubscribe = () => () => {};
const useMounted = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

export default function AuthCornerWidget() {
  const { user, loading } = useAuth();
  const mounted = useMounted();
  // The server always renders this empty (auth is loading there). On the
  // client, AuthProvider sits above the page and can settle `loading` to
  // false before this part of the tree hydrates (no saved token → it resolves
  // synchronously in its first effect), so hydrating straight into the
  // Sign in button mismatched the server HTML (React #418 on the home page).
  // Match the server until mounted, then show the real state.
  if (!mounted || loading) return null;
  return user ? <UserMenu variant="compact" /> : <SignInButton variant="compact" />;
}
