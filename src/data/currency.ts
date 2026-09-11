import { feedDate } from './monthly';
import type { CurrencyReport, RatesSection } from './types';

/* ============================================================================
 * CURRENCY — Weighted Average Exchange Rates
 * ============================================================================
 * The ONLY file that knows where the exchange rates come from. It is a
 * fixture today, transcribed on 11 September 2026 from what the live page
 * loads: api.askanalyst.com.pk/api/msg/currency. The feed's shape is kept
 * below and normalised here.
 *
 * THE FEED, as it answers:
 *
 *   msg   three parts — "Current Date", "Previous Date", "Change" — each
 *         with a "Buying" and a "Selling" row, each row a figure per
 *         currency ({symbol, value}): rates as strings to four decimals,
 *         the trailing zeros dropped ("39.214"), and the change between the
 *         two dates in rupees to two ("-1.51").
 *   date  "22 August, 2025" — the rates' date. The feed has not moved on
 *         since, and the live page prints that date; so does the sheet.
 *
 * Every rate prints to four decimals and every change to two, whatever the
 * feed dropped ("39.2140"), as the Latest Result sheet keeps its
 * precision.
 * ========================================================================= */

interface FeedRow {
  label: string;
  data: { symbol: string; value: string }[];
}

interface Feed {
  msg: { label: string; data: FeedRow[] }[];
  /** "22 August, 2025" */
  date: string;
}

/** A row's figures, "SYMBOL value" pairs, in the feed's order. */
const figures = (text: string) =>
  text
    .trim()
    .split(/\s+/)
    .reduce<{ symbol: string; value: string }[]>((all, token, i, tokens) => {
      if (i % 2 === 0) all.push({ symbol: token, value: tokens[i + 1] });
      return all;
    }, []);

const FEED: Feed = {
  msg: [
    {
      label: 'Current Date',
      data: [
        { label: 'Buying', data: figures('CNY 39.214 EUR 326.4313 GBP 377.4064 JPY 1.895 SAR 75.0602 USD 281.6892') },
        { label: 'Selling', data: figures('CNY 39.2648 EUR 326.9297 GBP 377.9911 JPY 1.8979 SAR 75.1713 USD 282.1211') },
      ],
    },
    {
      label: 'Previous Date',
      data: [
        { label: 'Buying', data: figures('CNY 39.2657 EUR 327.9379 GBP 378.869 JPY 1.9103 SAR 75.0613 USD 281.6919') },
        { label: 'Selling', data: figures('CNY 39.317 EUR 328.4379 GBP 379.4562 JPY 1.9131 SAR 75.1724 USD 282.1238') },
      ],
    },
    {
      label: 'Change',
      data: [
        { label: 'Buying', data: figures('CNY -0.05 EUR -1.51 GBP -1.46 JPY -0.02 SAR 0.00 USD 0.00') },
        { label: 'Selling', data: figures('CNY -0.05 EUR -1.51 GBP -1.47 JPY -0.02 SAR 0.00 USD 0.00') },
      ],
    },
  ],
  date: '22 August, 2025',
};

/** A number sent as a string; anything else is no figure. */
function figure(value: string | undefined): number | null {
  const n = Number.parseFloat((value ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

export async function fetchCurrencyReport(): Promise<CurrencyReport> {
  /* The currencies in the order the first row lists them. */
  const currencies = (FEED.msg[0]?.data[0]?.data ?? []).map((f) => f.symbol);
  const sections: RatesSection[] = FEED.msg.map((part) => ({
    label: part.label.trim(),
    kind: /change/i.test(part.label) ? 'change' : 'rate',
    rows: part.data.map((row) => ({
      label: row.label.trim(),
      values: currencies.map((symbol) => figure(row.data.find((f) => f.symbol === symbol)?.value)),
    })),
  }));
  return { asOf: feedDate(FEED.date), currencies, sections, source: 'SBP, Akseer Research' };
}
