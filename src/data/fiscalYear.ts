import type { BopMonth } from './types';

/* ============================================================================
 * FISCAL YEAR
 * ============================================================================
 * Pakistan's fiscal year runs from July to June and is named for the year it
 * ends in: July 2026 opens FY27. The BOP chart's line is the current account
 * balance summed from July to each month (the user's choice, 2026-09-11), so
 * it starts again every July.
 *
 * Server-safe and pure.
 * ========================================================================= */

/** Sums of feed figures, without floating-point dust such as 0.30000000000000004. */
const tidy = (value: number) => Math.round(value * 1e6) / 1e6;

/** "2026-07" -> 2027; "2026-06" -> 2026. */
export function fiscalYearOf(month: string): number {
  const [year, m] = month.split('-').map(Number);
  return m >= 7 ? year + 1 : year;
}

/** 2027 -> "FY27". */
export const fiscalYearLabel = (fiscalYear: number) => `FY${String(fiscalYear % 100).padStart(2, '0')}`;

export interface YearToDate {
  month: BopMonth;
  fiscalYear: number;
  /** The balance from July to this month. Null once a month in between is missing. */
  total: number | null;
}

/**
 * Each month's fiscal-year-to-date total. Months are taken oldest first and
 * are expected to be consecutive, as the feed sends them; a gap in the data
 * (a null balance) leaves the rest of that fiscal year unknown rather than
 * quietly short.
 */
export function yearToDate(months: readonly BopMonth[]): YearToDate[] {
  let year: number | null = null;
  let total: number | null = 0;
  return months.map((month) => {
    const fiscalYear = fiscalYearOf(month.month);
    if (fiscalYear !== year) {
      year = fiscalYear;
      total = 0;
    }
    total = total === null || month.balance === null ? null : tidy(total + month.balance);
    return { month, fiscalYear, total };
  });
}
