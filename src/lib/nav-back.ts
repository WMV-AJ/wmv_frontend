// Back that never leaves the site. A visitor who opened a shared link has no
// page of ours behind them: the browser's Back would return to the app they
// came from, or to the sign-in round trip. In that case go to a fallback page.

const ENTRY_KEY = 'wmv_entry_history_length';

/** Record, once per tab, how long the history was when the visitor arrived signed in. */
export function markEntry(): void {
  try {
    if (window.sessionStorage.getItem(ENTRY_KEY) === null) {
      window.sessionStorage.setItem(ENTRY_KEY, String(window.history.length));
    }
  } catch {
    // Storage blocked: goBack falls back to the plain browser Back.
  }
}

/** True when this tab has moved on from the page it arrived on. */
function hasSiteHistory(): boolean {
  try {
    const entry = window.sessionStorage.getItem(ENTRY_KEY);
    if (entry === null) return window.history.length > 1;
    return window.history.length > Number(entry);
  } catch {
    return window.history.length > 1;
  }
}

export function goBack(router: { back: () => void; push: (href: string) => void }, fallback: string): void {
  if (hasSiteHistory()) router.back();
  else router.push(fallback);
}
