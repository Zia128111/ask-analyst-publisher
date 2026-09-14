/* ============================================================================
 * FEED VALUES
 * ============================================================================
 * The checks the live feeds' normalisers share (src/data/morningBriefing.ts,
 * src/data/ksaMorningBriefing.ts). A feed is JSON someone else writes, so
 * every value is read for what it is: a list that is not a list, or a date
 * that is not a date, throws, and the accessor falls back to its copy; a
 * missing figure or link is no value rather than undefined on the page.
 * ========================================================================= */

/** "2026-09-10", checked. */
export function isoDate(text: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(`Unrecognised date "${text}"`);
  return text;
}

/** A number, or a string holding one ("168865.04"); anything else is no figure. */
export function figure(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

export const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** Only web links: a story's link opens in a new tab, and must not run script. */
export function webLink(value: unknown): string | null {
  const href = text(value);
  if (!href) return null;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export const list = <T>(value: unknown): T[] => {
  if (!Array.isArray(value)) throw new Error('Expected a list');
  return value as T[];
};
