import {
  feedDate,
  monthlyColumns,
  msgHeadings,
  msgRow,
  msgRows,
  outlineLines,
  type MsgHead,
  type MsgRow,
} from './monthly';
import type { MonthlyReport } from './types';

/* ============================================================================
 * TRADE-PBS — Balance of Trade
 * ============================================================================
 * The ONLY file that knows where the month's trade in goods, as the Pakistan
 * Bureau of Statistics counts it, comes from. It is a fixture today,
 * transcribed on 11 September 2026 from what the live page loads:
 * api.askanalyst.com.pk/api/msg/pbs. The feed's shape is kept below and
 * normalised here, with the helpers every monthly feed shares (monthly.ts).
 *
 * THE FEED, as it answers — msg/bop's shape, with two fields more:
 *
 *   head   one entry: the same month a year ago, last month, this month,
 *          "MoM" and "YoY", and from the second month of a fiscal year the
 *          year to date then and now and its change (fy1, fy2, fy). In July
 *          they are absent, but every row still carries fy1, fy2 and fy —
 *          the month again — and the live page prints them under three
 *          empty headings. They are left out in July, as on BOP.
 *   msg    one row per line: `label`, `bold` (emphasis, not totals:
 *          Petroleum among the imports is bold), `step` (2 for a line that
 *          details the one above it: Textile's cotton cloth, knitwear,
 *          bedwear and garments), amounts in USD millions — strings
 *          ("2683"), numbers for the trade deficit (-3154) — and changes as
 *          "32.1%": one decimal, the zero dropped ("8%", "0%"). A section's
 *          name ("Exports", "Imports") is a row with no figures ("",
 *          "&nbsp;").
 *   date   "11 September, 2026"; `month` "07".
 *
 * The changes are carried as published, two oddities included, not
 * corrected: the trade deficit's are the exports' change less the imports'
 * (MoM 31.5% = 32.1 - 0.6; the deficit itself narrowed 14.6%), and the
 * year to date's change is the wrong way round (exports -9.4%, which is
 * 2,683 on 2,962, where they rose 10.4%) — hidden in July, it prints from
 * August unless the feed is fixed. One label is set as its siblings are:
 * "knitwear" prints "Knitwear".
 * ========================================================================= */

interface Feed {
  head: MsgHead[];
  msg: MsgRow[];
  /** "11 September, 2026" */
  date: string;
  /** The report's month, "07". */
  month: string;
}

/** label|bold|step|previous_year|previous_month|current|mom|yoy|fy1|fy2|fy, as the feed sends them. */
const LINES = [
  'Exports||1|2683|2242|2962|32.1%|10.4%|2683|2962|-9.4%',
  'Imports||1|5837|6899|6940|0.6%|18.9%|5837|6940|-15.9%',
  'Trade Deficit|bold|1|-3154|-4657|-3978|31.5%|-8.5%|-3154|-3978|6.5%',
  'Exports|bold|1||||||&nbsp;||',
  'Foods||1|427|419|437|4.3%|2.3%|427|437|-2.3%',
  'Textile|bold|1|1679|1267|1814|43.2%|8%|1679|1814|-7.4%',
  'Cotton Cloth||2|142|112|142|26.8%|0%|142|142|0%',
  'knitwear||2|513|364|534|46.7%|4.1%|513|534|-3.9%',
  'Bedwear||2|296|210|308|46.7%|4.1%|296|308|-3.9%',
  'Readymade Garments||2|400|315|460|46%|15%|400|460|-13%',
  'Petroleum||1|49|70|81|15.7%|65.3%|49|81|-39.5%',
  'All Other||1|529|486|630|29.6%|19.1%|529|630|-16%',
  'Imports|bold|1||||||&nbsp;||',
  'Foods||1|745|647|805|24.4%|8.1%|745|805|-7.5%',
  'Machinery||1|928|1030|1311|27.3%|41.3%|928|1311|-29.2%',
  'Transport||1|302|474|422|-11%|39.7%|302|422|-28.4%',
  'Petroleum|bold|1|1347|1910|1277|-33.1%|-5.2%|1347|1277|5.5%',
  'Textile||1|594|647|682|5.4%|14.8%|594|682|-12.9%',
  'Agriculture||1|894|988|1098|11.1%|22.8%|894|1098|-18.6%',
  'Metals||1|548|612|733|19.8%|33.8%|548|733|-25.2%',
  'All Other||1|479|589|610|3.6%|27.3%|479|610|-21.5%',
];

const FEED: Feed = {
  head: [{ previous_year: 'Jul-25', previous_month: 'Jun-26', current: 'Jul-26', mom: 'MoM', yoy: 'YoY' }],
  msg: msgRows(LINES),
  date: '11 September, 2026',
  month: '07',
};

/** "knitwear" -> "Knitwear": the feed's one lower-case product, set as its siblings are. */
const capitalised = (label: string) => label.charAt(0).toUpperCase() + label.slice(1);

export async function fetchTradePbsReport(): Promise<MonthlyReport> {
  const columns = monthlyColumns(msgHeadings(FEED.head[0], FEED.month));
  return {
    asOf: feedDate(FEED.date),
    units: 'USD Million',
    columns,
    rows: outlineLines(
      FEED.msg.map((row) => {
        const line = msgRow(row, columns.length);
        return { ...line, label: capitalised(line.label) };
      }),
    ),
    changeDecimals: 1,
    source: 'PBS, Akseer Research',
  };
}
