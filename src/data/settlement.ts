import { feedDate } from './monthly';
import type { SettlementLine, SettlementReport } from './types';

/* ============================================================================
 * SETTLEMENT — Settlement of top 10 traded stocks
 * ============================================================================
 * The ONLY file that knows where the day's settlement figures come from. It
 * is a fixture today, transcribed on 11 September 2026 from what the live
 * page loads: api.askanalyst.com.pk/api/msg/settlement. The feed's shape is
 * kept below and normalised here.
 *
 * THE FEED, as it answers:
 *
 *   date  the trading day, "10 September, 2026" — the day before the other
 *         sheets', as the settlement follows the session.
 *   msg   ten stocks, the most traded by volume first: `symbol`,
 *         `trade_volume` (millions of shares) and `trade_value` (PKR
 *         millions) as numbers at full precision, and the two settlement
 *         percentages as strings to two decimals — `uni_percentage_volume`,
 *         which the live page heads "UIN", and `percentage_value`, "CM".
 *
 * The live page prints every figure to one decimal ("100.0", "1,261.1",
 * "39.3"), and so does the sheet; the workbook keeps the full precision
 * under a one-decimal format.
 * ========================================================================= */

interface FeedLine {
  symbol: string;
  trade_volume: number | string;
  trade_value: number | string;
  uni_percentage_volume: number | string;
  percentage_value: number | string;
}

interface Feed {
  /** "10 September, 2026" */
  date: string;
  msg: FeedLine[];
}

const FEED: Feed = {
  date: '10 September, 2026',
  msg: [
    { symbol: 'CNERGY', trade_volume: 100.049208, trade_value: 1261.10493617, uni_percentage_volume: '39.28', percentage_value: '22.58' },
    { symbol: 'KEL', trade_volume: 64.437001, trade_value: 431.94218096, uni_percentage_volume: '29.66', percentage_value: '21.68' },
    { symbol: 'TISL', trade_volume: 41.400748, trade_value: 177.33188611000003, uni_percentage_volume: '37.19', percentage_value: '19.11' },
    { symbol: 'PRL', trade_volume: 29.791593, trade_value: 2467.4080556199997, uni_percentage_volume: '32.47', percentage_value: '20.48' },
    { symbol: 'MDTL', trade_volume: 29.47882, trade_value: 193.10487371000002, uni_percentage_volume: '44.69', percentage_value: '34.27' },
    { symbol: 'WTL', trade_volume: 25.240828, trade_value: 27.873798920000002, uni_percentage_volume: '68.4', percentage_value: '40.49' },
    { symbol: 'WAVESAPPR', trade_volume: 21.492227, trade_value: 5.536392019999999, uni_percentage_volume: '73.01', percentage_value: '34.78' },
    { symbol: 'BOP', trade_volume: 21.438873, trade_value: 667.6042615299999, uni_percentage_volume: '51.31', percentage_value: '24.1' },
    { symbol: 'JSBL', trade_volume: 20.106118, trade_value: 262.62097001, uni_percentage_volume: '50.25', percentage_value: '0.36' },
    { symbol: 'PIBTL', trade_volume: 17.487323, trade_value: 263.40563373, uni_percentage_volume: '59.78', percentage_value: '44.94' },
  ],
};

/** A number, or a number sent as a string; anything else is no figure. */
function figure(value: number | string): number | null {
  const n = typeof value === 'number' ? value : Number.parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

const toLine = (line: FeedLine): SettlementLine => ({
  symbol: line.symbol.trim(),
  volume: figure(line.trade_volume),
  value: figure(line.trade_value),
  uin: figure(line.uni_percentage_volume),
  cm: figure(line.percentage_value),
});

export async function fetchSettlementReport(): Promise<SettlementReport> {
  return {
    asOf: feedDate(FEED.date),
    lines: FEED.msg.map(toLine),
    source: 'NCCPL, Akseer Research',
  };
}
