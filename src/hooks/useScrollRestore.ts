'use client';

// Our pages scroll inside their own containers (a fixed <main> or a card
// list), which the browser's own back/forward scroll restoration does not
// cover. This hook remembers a container's scroll position per URL and puts
// it back when the visitor returns with Back or Forward.
import { useEffect, useRef, type RefObject } from 'react';

const STORAGE_PREFIX = 'wmv_scroll:';
/** How long after a Back/Forward a mounting page still counts as "returned to". */
const RETURN_WINDOW_MS = 5000;
/** How long to keep trying while the page's content is still growing. */
const RESTORE_TIMEOUT_MS = 2500;

let lastHistoryMove = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => { lastHistoryMove = Date.now(); });
}

/** True while a page mounting now was reached by Back or Forward. */
export function isHistoryReturn(): boolean {
  return Date.now() - lastHistoryMove < RETURN_WINDOW_MS;
}

/** Sideways-scrolling rows inside the page that should be put back too. */
const RAIL_SELECTOR = '[data-scroll-key]';

function readRails(key: string): Record<string, number> {
  try {
    return JSON.parse(window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}:rails`) || '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

function saveRail(key: string, rail: string, left: number): void {
  try {
    const all = readRails(key);
    all[rail] = Math.round(left);
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}:rails`, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}

function readSaved(key: string): number {
  try {
    return Number(window.sessionStorage.getItem(STORAGE_PREFIX + key)) || 0;
  } catch {
    return 0;
  }
}

function save(key: string, top: number): void {
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + key, String(Math.round(top)));
  } catch {
    /* storage unavailable: nothing to restore later, which is fine */
  }
}

/**
 * @param ref    the element that scrolls
 * @param ready  true once the page's content is rendered (data loaded)
 */
export function useScrollRestore(ref: RefObject<HTMLElement | null>, ready: boolean): void {
  const keyRef = useRef<string | null>(null);
  const restored = useRef(false);

  // The key is fixed at mount, so a scroll event fired while navigating away
  // cannot land on the next URL.
  useEffect(() => {
    keyRef.current = `${window.location.pathname}${window.location.search}`;
  }, []);

  // Remember the position as the visitor scrolls. Some pages only mount their
  // scroll container once loaded, so this re-attaches when `ready` flips.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        // Not before the restore has run, or the fresh page's 0 would overwrite it.
        if (keyRef.current && restored.current) save(keyRef.current, el.scrollTop);
      });
    };
    const onRailScroll = (ev: Event) => {
      const rail = ev.target instanceof HTMLElement ? ev.target : null;
      const name = rail?.dataset.scrollKey;
      if (rail && name && rail !== el && keyRef.current && restored.current) saveRail(keyRef.current, name, rail.scrollLeft);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    // Scroll events do not bubble, so the rows are heard in the capture phase.
    el.addEventListener('scroll', onRailScroll, { passive: true, capture: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scroll', onRailScroll, { capture: true });
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, ready]);

  // Put it back once, when the content is there, and only after Back/Forward.
  useEffect(() => {
    const el = ref.current;
    if (!ready || restored.current || !el || !keyRef.current) return;
    const returning = isHistoryReturn();
    const target = returning ? readSaved(keyRef.current) : 0;
    const rails = returning ? readRails(keyRef.current) : {};
    const applyRails = () => {
      el.querySelectorAll<HTMLElement>(RAIL_SELECTOR).forEach((rail) => {
        const left = rails[rail.dataset.scrollKey || ''];
        if (left && Math.abs(rail.scrollLeft - left) > 1) rail.scrollLeft = left;
      });
    };
    if (target <= 0) {
      applyRails();
      restored.current = true;
      return;
    }
    const startedAt = Date.now();
    let frame = 0;
    const attempt = () => {
      el.scrollTop = target;
      applyRails();
      // Images and rails still loading can leave the page too short; keep trying briefly.
      const reached = Math.abs(el.scrollTop - target) < 2;
      if (reached || Date.now() - startedAt > RESTORE_TIMEOUT_MS) {
        restored.current = true;
        return;
      }
      frame = requestAnimationFrame(attempt);
    };
    attempt();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      restored.current = true;
    };
  }, [ref, ready]);
}
