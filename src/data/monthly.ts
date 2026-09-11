import type { MonthlyColumn, MonthlyRow, MonthlyValue } from './types';

/* ============================================================================
 * MONTHLY FEEDS — what the month-by-month feeds have in common
 * ============================================================================
 * BOP, OMC sales and their siblings on the live site send the same kind of
 * table: headings for the same month a year ago, last month and this month,
 * "MoM" and "YoY", and from the second month of a fiscal year the year to
 * date then and now and its "YoY"; the figures as strings — "1,300",
 * "-2679", "-16%", "NM", and "-" for no figure. Each report's own file keeps
 * its feed's shape and hands the headings and cells to these.
 *
 * The msg/ feeds (msg/bop, msg/pbs, msg/trade …) also share their headings'
 * shape and their date; `msgHeadings` and `feedDate` read them. The trade
 * feeds (msg/pbs, msg/trade) share their rows' shape as well — an outline,
 * with `bold` and `step` — which `msgRows` and `msgRow` read.
 * ========================================================================= */

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "11 September, 2026" -> "2026-09-11". */
export function feedDate(text: string): string {
  const match = /^(\d{1,2}) ([A-Za-z]+),? (\d{4})$/.exec(text.trim());
  const index = match ? MONTHS.findIndex((m) => match[2].startsWith(m)) : -1;
  if (!match || index < 0) throw new Error(`Unrecognised date "${text}"`);
  return `${match[3]}-${String(index + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
}

/** A msg/ feed's headings. */
export interface MsgHead {
  previous_year: string;
  previous_month: string;
  current: string;
  mom: string;
  yoy: string;
  /** From the second month of a fiscal year only. */
  fy1?: string;
  fy2?: string;
  fy?: string;
}

/**
 * The headings in the table's order: the same month a year ago, last month,
 * this month, "MoM" and "YoY", then the year to date a year ago and now and
 * its change — but not in July (`month` 07), when the year to date IS the
 * month: the live BOP page leaves those three out then, and so does every
 * msg/ report here.
 */
export function msgHeadings(head: MsgHead, month: string): string[] {
  const inMonth = [head.previous_year, head.previous_month, head.current, head.mom, head.yoy];
  const { fy1, fy2, fy } = head;
  return Number(month) !== 7 && fy1 && fy2 && fy ? [...inMonth, fy1, fy2, fy] : inMonth;
}

/** "1,300", "-2679", "-16%" -> a number; "NM" -> 'NM'; "-", "" -> null. */
export function parseFigure(text: string | undefined): MonthlyValue {
  const trimmed = (text ?? '').trim();
  if (trimmed.toUpperCase() === 'NM') return 'NM';
  const cleaned = trimmed.replace(/[%,\s]/g, '');
  if (cleaned === '' || cleaned === '-') return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/**
 * A row of a trade feed (msg/pbs, msg/trade): the label, `bold` for
 * emphasis, `step` 2 for a line that details the one above it, and the
 * cells in the headings' order — amounts as strings, or as numbers (msg/
 * pbs's trade deficit). The rows carry fy1, fy2 and fy even in July, when
 * the headings do not.
 */
export interface MsgRow {
  label: string;
  bold: boolean;
  step: number;
  previous_year: string | number;
  previous_month: string | number;
  current: string | number;
  mom: string;
  yoy: string;
  fy1: string | number;
  fy2: string | number;
  fy: string;
}

/**
 * A fixture's lines as the feed's rows: label|bold|step|previous_year|
 * previous_month|current|mom|yoy|fy1|fy2|fy, with "bold" or nothing in the
 * second place.
 */
export function msgRows(lines: readonly string[]): MsgRow[] {
  return lines.map((line) => {
    const [label, bold, step, previous_year, previous_month, current, mom, yoy, fy1, fy2, fy] = line.split('|');
    return { label, bold: bold === 'bold', step: Number(step), previous_year, previous_month, current, mom, yoy, fy1, fy2, fy };
  });
}

/** "", "&nbsp;": a msg/ feed's empty cell. */
const isBlank = (cell: string | number) => String(cell).replace(/&nbsp;/g, '').trim() === '';

/**
 * A line of an outlined msg/ feed as a table row, from its cells in the
 * columns' order: a step in for each `step` past the first; with no
 * figures, a section's name ("Exports") — or, with no label either, a blank
 * line between sections. The label is the feed's own: its outline markers
 * ("a.", "ii") are lower-case on purpose.
 */
export function outlineRow(line: { label: string; bold: boolean; step: number }, cells: (string | number)[]): MonthlyRow {
  const label = line.label.trim();
  const empty = cells.every(isBlank);
  return {
    label,
    bold: line.bold,
    ...(line.step > 1 ? { indent: line.step - 1 } : {}),
    ...(empty ? (label ? { heading: true } : { spacer: true }) : {}),
    values: cells.map((cell) => (empty ? null : parseFigure(String(cell)))),
  };
}

/** A trade or remittances feed's row as a table row, cut to the `count` columns shown (outlineRow). */
export function msgRow(row: MsgRow, count: number): MonthlyRow {
  const cells = [row.previous_year, row.previous_month, row.current, row.mom, row.yoy, row.fy1, row.fy2, row.fy];
  return outlineRow(row, cells.slice(0, count));
}

/** A change's heading: "MoM", "YoY", "FYTD" — or, as the remittances feed heads them, "MoM %". */
const CHANGE = /^(MoM|QoQ|YoY|FYTD)(\s*%)?$/i;
/**
 * Changes on the amount just before the current one: last month (MoM), or
 * the fiscal year's close where that column comes before the current one
 * (FYTD, Central Government Debt's Jun-26).
 */
const ON_PREVIOUS = /^(MoM|FYTD)(\s*%)?$/i;

/**
 * The columns, from the feed's headings. A change ("MoM", "YoY") measures
 * the current period before it — the amount straight before a change: this
 * month, or the year to date — against last month for MoM, and for YoY the
 * first period of the same run of amounts: the same month a year ago, or
 * the year to date a year ago.
 */
export function monthlyColumns(labels: readonly string[]): MonthlyColumn[] {
  const kinds = labels.map((label): MonthlyColumn['kind'] => (CHANGE.test(label.trim()) ? 'change' : 'amount'));
  const current = labels.map((_, i) => kinds[i] === 'amount' && kinds[i + 1] === 'change');
  return labels.map((label, i) => {
    const column: MonthlyColumn = { label, kind: kinds[i], current: current[i] };
    if (kinds[i] !== 'change') return column;
    const period = current.lastIndexOf(true, i);
    if (period < 0) return column;
    let first = period;
    while (first > 0 && kinds[first - 1] === 'amount') first -= 1;
    const base = ON_PREVIOUS.test(label.trim()) ? period - 1 : first;
    if (base >= 0 && base !== period) column.compares = { period: labels[period], base: labels[base] };
    return column;
  });
}

/**
 * Each line under a total takes that total's label as its group — "PSO" for
 * the MS under PSO, "Balance on trade in Goods" for the Exports under it —
 * so a screen reader hears which one it is. Totals have none.
 */
export function groupLines(rows: readonly MonthlyRow[]): MonthlyRow[] {
  let total: string | undefined;
  return rows.map((row) => {
    if (row.bold) {
      total = row.label;
      return row;
    }
    return total ? { ...row, group: total } : row;
  });
}

/**
 * The same, for feeds that lay their lines out as an outline rather than
 * under totals (the trade feeds, where bold is emphasis — Petroleum among
 * the imports — not a total): a line takes the heading it sits under,
 * "Exports" for the Foods under Exports (Imports has its own Foods), and a
 * line one step in takes the line it details as well: "Exports, Textile"
 * for Cotton Cloth. Headings, blank lines and lines before the first
 * heading have none.
 */
export function outlineLines(rows: readonly MonthlyRow[]): MonthlyRow[] {
  let heading: string | undefined;
  let parent: string | undefined;
  return rows.map((row) => {
    if (row.spacer) return row;
    if (row.heading) {
      heading = row.label;
      parent = undefined;
      return row;
    }
    const indented = (row.indent ?? 0) > 0;
    const group = indented ? [heading, parent].filter(Boolean).join(', ') : heading;
    if (!indented) parent = row.label;
    return group ? { ...row, group } : row;
  });
}
