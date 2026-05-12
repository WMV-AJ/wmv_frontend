'use client';

import React from 'react';
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
export default function AuthCornerWidget() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <UserMenu variant="compact" /> : <SignInButton variant="compact" />;
}
