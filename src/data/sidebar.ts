/* ============================================================================
 * PUBLICATION SIDEBAR — kept collapsed or not
 * ============================================================================
 * Whether the reader keeps the sidebar collapsed to its rail of icons. A
 * preference of this device, like light or dark, so it lives in this
 * browser's localStorage and never in the account.
 *
 * The page draws the collapsed sidebar from an attribute on <html>, which the
 * head script below sets before first paint, so a reader who keeps it
 * collapsed never sees it open first. The toggle sets the attribute and the
 * stored value together (useSidebarCollapsed).
 *
 * Server-safe: the root layout imports the head script from here.
 * ========================================================================= */

export const SIDEBAR_KEY = 'ask-publisher:sidebar-collapsed:v1';
export const SIDEBAR_ATTRIBUTE = 'data-sidebar-collapsed';

/** Runs in <head> before first paint: marks <html> when the sidebar is kept collapsed. */
export const SIDEBAR_FLAG_SCRIPT =
  'try{' +
  `if(window.localStorage.getItem(${JSON.stringify(SIDEBAR_KEY)})==='1')` +
  `document.documentElement.setAttribute(${JSON.stringify(SIDEBAR_ATTRIBUTE)},'')` +
  '}catch(e){}';

export function readSidebarCollapsed(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) === '1';
  } catch {
    // Storage blocked by the browser's site-data settings: open, the default.
    return false;
  }
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  try {
    if (collapsed) window.localStorage.setItem(SIDEBAR_KEY, '1');
    else window.localStorage.removeItem(SIDEBAR_KEY);
  } catch {
    // Not kept: the sidebar still collapses for this visit.
  }
}
