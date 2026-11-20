'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { noteNavigation } from '@/lib/nav-back';

/**
 * Counts page changes inside the site, for the event page's back arrow.
 * The first page of a load is not counted: a visitor who arrived on a shared
 * link has no page of ours behind them.
 */
export default function EntryMarker(): null {
  const pathname = usePathname();
  const firstPath = useRef(true);
  useEffect(() => {
    if (firstPath.current) firstPath.current = false;
    else noteNavigation();
  }, [pathname]);
  return null;
}
