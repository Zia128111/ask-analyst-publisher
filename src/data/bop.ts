import { MONTHS, feedDate, groupLines, monthlyColumns, msgHeadings, parseFigure, type MsgHead } from './monthly';
import type { BopMonth, BopReport, MonthlyRow } from './types';

/* ============================================================================
 * BOP — External Account Highlights
 * ============================================================================
 * The ONLY file that knows where the balance of payments comes from. It is a
 * fixture today, transcribed on 11 September 2026 from what the live page
 * loads: api.askanalyst.com.pk/api/msg/bop. The feed's shape is kept below
 * and normalised here, with the helpers every monthly feed shares
 * (monthly.ts), so pointing the accessor at the feed is a change here and
 * nowhere else.
 *
 * THE FEED, as it answers:
 *
 *   head   the headings: the same month a year ago, last month, this month,
 *          "MoM" and "YoY" — and, from the second month of a fiscal year, the
 *          year to date a year ago and now and the change between them (fy1,
 *          fy2, fy). In July the year to date IS the month, so the live page
 *          leaves those three out when `month` is 07, and so does this.
 *   msg    one row per line, amounts as strings in USD millions, changes as
 *          "-60%" or "NM" (not meaningful: the base is negative or tiny).
 *   chart  the months behind the "Historical Current A/c Balance" chart. ONE
 *          month today, Jul-26, its value carrying a stray "%" ("-328%") that
 *          is not a percentage — it matches the table's -328. Longer history
 *          is to come from the user (asked 2026-09-11); `history` takes as
 *          many months as the feed sends.
 *
 * Bold rows are the balances, named as the live page names them. Changes are
 * carried as published — the feed rounds them to whole percent and signs
 * them arithmetically, so a deficit that narrows reads as a fall (-60%).
 * ========================================================================= */

interface Feed {
  /** "11 September, 2026" */
  date: string;
  /** The report's month, "07". */
  month: string;
  head: MsgHead;
  /** label|previous_year|previous_month|current|mom|yoy|fy1|fy2|fy */
  msg: string[];
  chart: { date: string; value: string }[];
}

const FEED: Feed = {
  date: '11 September, 2026',
  month: '07',
  head: { previous_year: 'Jul-25', previous_month: 'Jun-26', current: 'Jul-26', mom: 'MoM', yoy: 'YoY' },
  msg: [
    'Current A/c Balance|-529|-814|-328|-60%|-38%|-529|-328|-38%',
    'Balance on trade in Goods|-2679|-3579|-3146|-12%|17%|-2679|-3146|17%',
    'Exports|2750|2573|3008|17%|9%|2750|3008|9%',
    'Imports|5429|6152|6154|0%|13%|5429|6154|13%',
    'Balance on trade in Services|-304|-83|-228|175%|-25%|-304|-228|-25%',
    'Exports|728|942|927|-2%|27%|728|927|27%',
    'Imports|1032|1025|1155|13%|12%|1032|1155|12%',
    'Balance on Primary Income|-876|-837|-848|1%|-3%|-876|-848|-3%',
    'Balance on Secondary Income|3330|3685|3894|6%|17%|3330|3894|17%',
    'Worker Remittances|3214|3475|3631|4%|13%|3214|3631|13%',
    'Capital A/C Balance|17|3|19|533%|12%|17|19|12%',
    'Financial Account|-345|-1998|1139|NM|NM|-345|1139|NM',
    'Direct Investment|-195|-50|-180|260%|-8%|-195|-180|-8%',
    'Portfolio Investment|43|40|-27|NM|NM|43|-27|NM',
    'Net Errors and Omissions|-7|100|59|-41%|NM|-7|59|NM',
    'Overall Balance|174|-1287|1389|NM|698%|174|1389|698%',
  ],
  chart: [{ date: 'Jul-26', value: '-328%' }],
};

/** The rows the live page sets in bold, by label. */
const BALANCES = new Set([
  'Current A/c Balance',
  'Balance on trade in Goods',
  'Balance on trade in Services',
  'Balance on Primary Income',
  'Balance on Secondary Income',
  'Capital A/C Balance',
  'Financial Account',
  'Net Errors and Omissions',
  'Overall Balance',
]);

/** "Jul-26" -> "2026-07". */
function isoMonth(label: string): string {
  const [name, year] = label.split('-');
  const index = MONTHS.indexOf(name);
  if (index < 0 || !/^\d{2}$/.test(year ?? '')) throw new Error(`Unrecognised month "${label}"`);
  return `20${year}-${String(index + 1).padStart(2, '0')}`;
}

function toRow(line: string, count: number): MonthlyRow {
  const [label, ...cells] = line.split('|');
  return { label, bold: BALANCES.has(label), values: cells.slice(0, count).map(parseFigure) };
}

function toMonth({ date, value }: Feed['chart'][number]): BopMonth {
  const balance = parseFigure(value);
  return { month: isoMonth(date), label: date, balance: typeof balance === 'number' ? balance : null };
}

export async function fetchBopReport(): Promise<BopReport> {
  const columns = monthlyColumns(msgHeadings(FEED.head, FEED.month));
  return {
    asOf: feedDate(FEED.date),
    units: '(USD mn)',
    columns,
    rows: groupLines(FEED.msg.map((line) => toRow(line, columns.length))),
    history: FEED.chart.map(toMonth).sort((a, b) => a.month.localeCompare(b.month)),
    source: 'SBP, Akseer Research',
  };
}
