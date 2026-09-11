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
 * TRADE-SBP — Export of Services break-up (USD mn)
 * ============================================================================
 * The ONLY file that knows where the month's trade in goods and services, as
 * the State Bank counts it, comes from — the balance of payments' own
 * figures: the goods and services match BOP's (exports of goods 3,008,
 * imports 6,154). It is a fixture today, transcribed on 11 September 2026
 * from what the live page loads: api.askanalyst.com.pk/api/msg/trade.
 * Normalised with the helpers every monthly feed shares (monthly.ts).
 *
 * THE FEED, as it answers — msg/pbs's shape (`MsgRow`):
 *
 *   head   one entry: the same month a year ago, last month, this month,
 *          "MoM" and "YoY", and from the second month of a fiscal year the
 *          year to date then and now and its change. In July the rows still
 *          carry the year to date — the month again — and the live page
 *          prints it under three empty headings; it is left out in July, as
 *          on BOP and Trade-PBS.
 *   msg    exports of goods and of services, the services broken down a step
 *          in (Technology, Other Business Services, Transport, Travel,
 *          Others), the total; a blank line (no label, no figures); imports
 *          of goods and of services and the total. Every line but the
 *          breakdown is bold. Amounts are strings in USD millions; changes
 *          are to one decimal, the zero dropped ("6%").
 *   date   "11 September, 2026"; `month` "07".
 *
 * The changes are carried as published, one oddity included, not corrected:
 * the Others line's changes are the services' change less the listed
 * types' (MoM 6% = -1.6 - (0.2 - 1.4 + 7.1 - 13.2); YoY -192%), not its
 * own — 105 on 106 is -0.9%, on 114 -7.9%. Unlike msg/pbs's, its year to
 * date's change runs the right way (in July, the month's YoY again).
 *
 * The live page leaves the heading over the labels blank — the title band
 * carries "(USD mn)" — so the sheet hides the unit there (its look), and
 * screen readers still hear it.
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
  'Exports of Goods|bold|1|2750|2573|3008|16.9%|9.4%|2750|3008|9.4%',
  'Exports of Services|bold|1|728|942|927|-1.6%|27.3%|728|927|27.3%',
  'Technology||2|354|416|417|0.2%|17.8%|354|417|17.8%',
  'Other Business Services||2|149|221|218|-1.4%|46.3%|149|218|46.3%',
  'Transport||2|64|70|75|7.1%|17.2%|64|75|17.2%',
  'Travel||2|47|129|112|-13.2%|138.3%|47|112|138.3%',
  'Others||2|114|106|105|6%|-192%|114|105|-192%',
  'Total Exports|bold|1|3478|3515|3935|11.9%|13.1%|3478|3935|13.1%',
  '||1||||||&nbsp;||',
  'Imports of Goods|bold|1|5429|6152|6154|0%|13.4%|5429|6154|13.4%',
  'Imports of Services|bold|1|1032|1025|1155|12.7%|11.9%|1032|1155|11.9%',
  'Total Imports|bold|1|6461|7177|7309|1.8%|13.1%|6461|7309|13.1%',
];

const FEED: Feed = {
  head: [{ previous_year: 'Jul-25', previous_month: 'Jun-26', current: 'Jul-26', mom: 'MoM', yoy: 'YoY' }],
  msg: msgRows(LINES),
  date: '11 September, 2026',
  month: '07',
};

export async function fetchTradeSbpReport(): Promise<MonthlyReport> {
  const columns = monthlyColumns(msgHeadings(FEED.head[0], FEED.month));
  return {
    asOf: feedDate(FEED.date),
    units: 'USD mn',
    columns,
    rows: outlineLines(FEED.msg.map((row) => msgRow(row, columns.length))),
    changeDecimals: 1,
    source: 'SBP, Akseer Research',
  };
}
