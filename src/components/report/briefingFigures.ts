import { formatNumber, formatPercent } from '@akseer/ask-analyst-design-system';

/* ============================================================================
 * BRIEFING FIGURES — the Morning Briefing's precisions, as the live page and
 * its PDF print them
 * ============================================================================
 *   flows (USD mn)    two decimals, a minus sign:          -0.29, 179.92
 *   index levels      whole, grouped:                      168,865
 *   index changes     one decimal, signed, percent:        +0.2%, -1.8%
 *   prices            two decimals, grouped:               4,398.10
 *   price changes     two decimals, signed, percent:       +3.88%
 *   currency rates    four decimals, as the feed sends:    277.3522
 *
 * A figure that rounds to zero prints unsigned — 0.00%, not "-0.00%" or
 * "+0.00%" — since the formatters sign the unrounded value, and a zero has
 * no direction (the USD rate's change, -0.0045%, is 0.00% in the PDF).
 * ========================================================================= */

/** Anything under half the last printed digit prints as zero. */
const atPrecision = (value: number | null, decimals: number) =>
  value !== null && Math.abs(value) < 0.5 * 10 ** -decimals ? 0 : value;

export const flow = (value: number | null) =>
  formatNumber(atPrecision(value, 2), { decimals: 2, signStyle: 'minus' });

export const level = (value: number | null) => formatNumber(value, { decimals: 0 });

export const price = (value: number | null) => formatNumber(value, { decimals: 2 });

export const rate = (value: number | null) => formatNumber(value, { decimals: 4 });

/** A change in percent with its sign: +0.2%, -1.8%, 0.0%. */
export const change = (value: number | null, decimals: 1 | 2) =>
  formatPercent(atPrecision(value, decimals), { decimals, signStyle: 'minus', showPlus: true });
