import type { RemittanceMonth } from '../../data/types';

/* ============================================================================
 * REMITTANCE AXES — the two value axes of the Workers' Remittances chart
 * ============================================================================
 * The chart puts the month's total (USD mn) and its change on the year (%)
 * on one plot, each on its own axis — the benchmark's chart, kept at the
 * user's call (2026-09-11) as the one exception to the design system's
 * single-axis rule. So the two axes share their gridlines: the total's
 * counts up from zero in thousands (a bar's length is its size, the
 * system's bar rule, kept), and the change's takes the smallest round step
 * that holds its range in as many intervals, with zero on a gridline.
 *
 * One module for the screen and the workbook, so the Excel chart's scales
 * are the page's. Plain TypeScript: it runs in Node as well.
 * ========================================================================= */

export interface AxisScale {
  min: number;
  max: number;
  step: number;
  /** min, min + step … max. */
  ticks: number[];
}

const TOTAL_STEP = 1000;
/** Round steps for the change, in percent points. */
const CHANGE_STEPS = [5, 10, 20, 25, 50, 100];
/** Past this many intervals the scales stop looking for a better fit. */
const MOST_INTERVALS = 12;
const EPSILON = 1e-9;

const numbers = (values: (number | null)[]) => values.filter((v): v is number => typeof v === 'number');

const scale = (min: number, step: number, intervals: number): AxisScale => ({
  min,
  max: min + step * intervals,
  step,
  ticks: Array.from({ length: intervals + 1 }, (_, i) => min + step * i),
});

/** The total's axis (USD mn) and the change's (percent points), their gridlines at the same heights. */
export function remittanceAxes(months: readonly RemittanceMonth[]): { total: AxisScale; change: AxisScale } {
  const totals = numbers(months.map((m) => m.total));
  const changes = numbers(months.map((m) => m.yoy));
  const low = Math.min(0, ...changes);
  const high = Math.max(0, ...changes);
  const first = Math.max(1, Math.ceil(Math.max(0, ...totals) / TOTAL_STEP - EPSILON));

  for (let intervals = first; intervals <= MOST_INTERVALS; intervals += 1) {
    for (const step of CHANGE_STEPS) {
      const below = Math.ceil(-low / step - EPSILON);
      if (below <= intervals && (intervals - below) * step >= high - EPSILON) {
        return { total: scale(0, TOTAL_STEP, intervals), change: scale(-below * step, step, intervals) };
      }
    }
  }
  /* Beyond any round fit: each axis over its own range, in as many intervals. */
  const step = Math.max(...CHANGE_STEPS);
  const below = Math.ceil(-low / step - EPSILON);
  const intervals = Math.max(first, below + Math.ceil(high / step - EPSILON));
  return { total: scale(0, TOTAL_STEP, intervals), change: scale(-below * step, step, intervals) };
}
