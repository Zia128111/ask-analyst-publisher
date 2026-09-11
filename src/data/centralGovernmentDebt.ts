import { feedDate, monthlyColumns, outlineRow } from './monthly';
import type { MonthlyReport } from './types';

/* ============================================================================
 * CENTRAL GOVERNMENT DEBT — Central Government Debt (PKR bn)
 * ============================================================================
 * The ONLY file that knows where the central government's debt comes from.
 * It is a fixture today, transcribed on 11 September 2026 from what the
 * live page loads: api.askanalyst.com.pk/api/msg/cgd. The feed's shape is
 * kept below and normalised here, with the helpers the msg/ feeds share
 * (monthly.ts).
 *
 * THE FEED, as it answers:
 *
 *   head   one entry: `previous_year` ("Jul-25"), `fiscal_year` — the
 *          fiscal year's close, "Jun-26" — `current` ("Jul-26") and "YoY %".
 *          Nothing heads the rows' last figure, `fy`, and the live page
 *          prints that column under an empty heading: it is the change
 *          since the fiscal year's close (59,441 → 59,274, -0.3%), so the
 *          sheet heads it "FYTD %", as the remittances feed names the same
 *          figure. In July it is also the change on the month.
 *   msg    a row per line, an outline three deep: `step` 1 for the
 *          domestic debt, the external debt and the two together (bold),
 *          2 for long term, short term and Naya Pakistan Certificates, 3
 *          for the long term's parts; amounts as strings in PKR billions,
 *          changes to one decimal, the zero dropped ("-1%").
 *   date   "11 September, 2026"; `month` "07".
 *
 * Debt is a stock, so the figures compare this month with a year before and
 * with the fiscal year's close, not with last month.
 * ========================================================================= */

interface FeedHead {
  previous_year: string;
  /** The fiscal year's close. */
  fiscal_year: string;
  current: string;
  yoy: string;
}

interface FeedRow {
  label: string;
  bold: boolean;
  step: number;
  previous_year: string;
  fiscal_year: string;
  current: string;
  yoy: string;
  /** The change since the fiscal year's close. */
  fy: string;
}

interface Feed {
  head: FeedHead[];
  msg: FeedRow[];
  /** "11 September, 2026" */
  date: string;
  /** The report's month, "07". */
  month: string;
}

/** label|bold|step|previous_year|fiscal_year|current|yoy|fy, as the feed sends them. */
const LINES = [
  'A. Central Government Domestic Debt|bold|1|54988|59441|59274|7.8%|-0.3%',
  'a. Long Term||2|46191|48446|48377|4.7%|-0.1%',
  'i Permanent Debt||3|42752|44769|45029|5.3%|0.6%',
  'ii Unfunded Debt||3|3062|3284|3336|8.9%|1.6%',
  'iii Foreign Currency Loans||3|377|393|12|-96.8%|-96.9%',
  'b. Short Term||2|8726|10928|10815|23.9%|-1%',
  'c. Naya Pakistan Certificates||2|71|67|82|15.5%|22.4%',
  'B. Central Government External Debt|bold|1|23250|24201|24109|3.7%|-0.4%',
  'A+B Central Government Debt|bold|1|78238|83642|83383|6.6%|-0.3%',
];

const FEED: Feed = {
  head: [{ previous_year: 'Jul-25', fiscal_year: 'Jun-26', current: 'Jul-26', yoy: 'YoY %' }],
  msg: LINES.map((line) => {
    const [label, bold, step, previous_year, fiscal_year, current, yoy, fy] = line.split('|');
    return { label, bold: bold === 'bold', step: Number(step), previous_year, fiscal_year, current, yoy, fy };
  }),
  date: '11 September, 2026',
  month: '07',
};

/** The heading the feed does not send, for the change since the fiscal year's close. */
const FISCAL_YEAR_TO_DATE = 'FYTD %';

export async function fetchCentralGovernmentDebtReport(): Promise<MonthlyReport> {
  const [head] = FEED.head;
  return {
    asOf: feedDate(FEED.date),
    /* The live page heads the labels "Label", and so does the sheet. */
    units: 'Label',
    columns: monthlyColumns([head.previous_year, head.fiscal_year, head.current, head.yoy, FISCAL_YEAR_TO_DATE]),
    rows: FEED.msg.map((row) =>
      outlineRow(row, [row.previous_year, row.fiscal_year, row.current, row.yoy, row.fy]),
    ),
    changeDecimals: 1,
    source: 'SBP, Akseer Research',
  };
}
