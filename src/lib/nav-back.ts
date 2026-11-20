// Back that never leaves the site. A visitor who opened a shared link has no
// page of ours behind them: the browser's Back would return to the app they
// came from, or to the sign-in round trip. In that case go to a fallback page.
//
// "Has a page of ours behind them" is counted in memory: every in-site page
// change since this page load. (history.length cannot be used: browsers cap
// it at 50, so in a long-lived tab it stops growing.)

let inSiteNavigations = 0;

/** Call on every in-site page change after the first page of this load. */
export function noteNavigation(): void {
  inSiteNavigations += 1;
}

export function goBack(router: { back: () => void; push: (href: string) => void }, fallback: string): void {
  if (inSiteNavigations > 0) router.back();
  else router.push(fallback);
}
