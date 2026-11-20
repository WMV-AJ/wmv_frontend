'use client';

// useState that survives Back and Forward.
//
// A page's choices (the date picked, the filters, which card is open, how
// many cards are loaded) live in memory and are lost when the page is left.
// This keeps a copy in sessionStorage under the page's address and reads it
// back only when the page is reached again by Back or Forward. A fresh visit
// always starts from the defaults.
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { isHistoryReturn } from './useScrollRestore';

const PREFIX = 'wmv_view:';

/** The storage key for a named value on the page now open. */
export function viewStateKey(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return `${PREFIX}${window.location.pathname}${window.location.search}:${name}`;
}

/** The value saved for this page, or undefined when there is none or this is not a return. */
export function readViewState<T>(name: string): T | undefined {
  if (!isHistoryReturn()) return undefined;
  const key = viewStateKey(name);
  if (!key) return undefined;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

export function writeViewState(key: string | null, value: unknown): void {
  if (!key) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the page simply starts from defaults next time.
  }
}

/**
 * @param name     unique within the page, e.g. "filters"
 * @param initial  the default, used on a fresh visit
 * @returns the state, its setter, and whether it was restored from a return visit
 */
export function useViewState<T>(name: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>, boolean] {
  // The address at mount: a change saved while navigating away must not land on the next page.
  const keyRef = useRef<string | null>(null);
  const restoredRef = useRef(false);
  const [value, setValue] = useState<T>(() => {
    keyRef.current = viewStateKey(name);
    const saved = readViewState<T>(name);
    if (saved !== undefined) {
      restoredRef.current = true;
      return saved;
    }
    return typeof initial === 'function' ? (initial as () => T)() : initial;
  });

  useEffect(() => {
    writeViewState(keyRef.current, value);
  }, [value]);

  return [value, setValue, restoredRef.current];
}
