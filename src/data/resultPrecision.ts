import type { ResultColumn, ResultMeasure } from './types';

/* ============================================================================
 * RESULT PRECISION — the decimals a Latest Result figure is published to
 * ============================================================================
 * Set by what a row measures and the kind of column, as the feed publishes
 * them: amounts in whole millions, changes to one decimal, a quarter's EPS to
 * two, EPS for a period to date to one (the feed rounds it: FY26 is 60.8
 * where its quarters sum to 60.78), DPS to two throughout.
 *
 * A rule, not each value's own digits, because the feed writes some values
 * with their trailing zeros ("4.00", "10.0") and some without ("1.9" beside
 * "1.81"), and the live page then drops them all ("4", "10"). Here a column
 * keeps one precision, so its figures align, and never shows a digit the
 * feed does not have.
 *
 * Shared by the sheet and the Excel workbook, which writes the same
 * precision as number formats. No React: the workbook runs in Node too.
 * ========================================================================= */

const DECIMALS: Record<ResultMeasure, Record<'quarter' | 'todate', number>> = {
  amount: { quarter: 0, todate: 0 },
  eps: { quarter: 2, todate: 1 },
  dps: { quarter: 2, todate: 2 },
};

/** Every change is published to one decimal, whatever the row measures. */
const CHANGE_DECIMALS = 1;

export const decimalsFor = (measure: ResultMeasure, column: ResultColumn): number =>
  column.kind === 'change' ? CHANGE_DECIMALS : DECIMALS[measure][column.kind];
