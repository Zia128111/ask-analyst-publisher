import { monthlyColumns, outlineLines, outlineRow } from './monthly';
import type { MonthlyReport, MonthlyRow } from './types';

/* ============================================================================
 * FERTILIZER — Fertilizer Offtake and Inventory ('000 tons)
 * ============================================================================
 * The ONLY file that knows where the fertilizer offtake comes from. It is a
 * fixture today, transcribed on 11 September 2026 from what the live page
 * loads: api.askanalyst.com.pk/api/msg/fertilizer. The feed's shape is kept
 * below and normalised here, with the helpers the msg/ feeds share
 * (monthly.ts).
 *
 * THE FEED, as it answers:
 *
 *   head       one entry: the same month a year ago ("Jul-25"), last month,
 *              this month, "MoM %", "YoY %", then the CALENDAR year to date
 *              a year ago and now ("7MCY25", "7MCY26") and its "YoY", and
 *              "Inventory" — the stock at the month's end.
 *   msg        one entry per product — Urea, DAP, CAN — each with a row per
 *              company and a TOTAL: amounts as numbers at full precision in
 *              thousand tonnes, changes as strings to one decimal, the zero
 *              dropped ("-2%").
 *   msg_month  "Jul-26", the table's month; `date` "01 July, 2026" (the
 *              month's first day, not a publishing date) and `month` 7.
 *
 * The live page prints each product's name as a row of its own over its
 * companies, a blank line between products, and heads the labels
 * "Period" — all kept. The sheet is stamped with the day the fixture was
 * transcribed, as the live page stamps the day it is viewed.
 * ========================================================================= */

interface FeedCompany {
  company: string;
  previous_year: number;
  previous_month: number;
  current: number;
  mom: string;
  yoy: string;
  fy1: number;
  fy2: number;
  fy: string;
  inventory: number;
}

interface Feed {
  head: {
    previous_year: string;
    previous_month: string;
    current: string;
    mom: string;
    yoy: string;
    fy1: string;
    fy2: string;
    fy: string;
    inventory: string;
  }[];
  msg: { label: string; data: FeedCompany[] }[];
  date: string;
  month: number;
  msg_month: string;
}

/** company|previous_year|previous_month|current|mom|yoy|fy1|fy2|fy|inventory, as the feed sends them. */
const companies = (lines: string[]): FeedCompany[] =>
  lines.map((line) => {
    const [company, previous_year, previous_month, current, mom, yoy, fy1, fy2, fy, inventory] = line.split('|');
    return {
      company,
      previous_year: Number(previous_year),
      previous_month: Number(previous_month),
      current: Number(current),
      mom,
      yoy,
      fy1: Number(fy1),
      fy2: Number(fy2),
      fy,
      inventory: Number(inventory),
    };
  });

const FEED: Feed = {
  head: [
    {
      previous_year: 'Jul-25',
      previous_month: 'Jun-26',
      current: 'Jul-26',
      mom: 'MoM %',
      yoy: 'YoY %',
      fy1: '7MCY25',
      fy2: '7MCY26',
      fy: 'YoY',
      inventory: 'Inventory',
    },
  ],
  msg: [
    {
      label: 'Urea',
      data: companies([
        'FFC|272.538|305.826|268.745|-12.1%|-1.4%|1394.772|1673.398|20%|59.014',
        'FATIMA|97.433|139.857|127.033|-9.2%|30.4%|487.629|541.647|11.1%|133.253',
        'EFERT|206.8|105.821|166.467|57.3%|-19.5%|897.542|703.686|-21.6%|709.048',
        'AGL|31.277|40.027|17.653|-55.9%|-43.6%|178.664|172.894|-3.2%|8.49',
        'TOTAL|608.048|591.531|579.898|-2%|-4.6%|2958.607|3091.625|4.5%|909.805',
      ]),
    },
    {
      label: 'DAP',
      data: companies([
        'FFC|85.334|36.82|80.963|119.9%|-5.1%|372.92|398.698|6.9%|285.19',
        'FATIMA|3.394|1.09|0.019|-98.3%|-99.4%|22.892|8.722|-61.9%|10.819',
        'EFERT|3.394|2.796|6.683|139%|96.9%|84.371|64.244|-23.9%|38.289',
        'Others|14.345|6.363|8.417|32.3%|-41.3%|81.64|105.609|29.4%|59.616',
        'TOTAL|106.467|47.069|96.082|104.1%|-9.8%|561.823|577.273|2.7%|251.319',
      ]),
    },
    {
      label: 'CAN',
      data: companies([
        'FATIMA|65.75|121.08|77.604|-35.9%|18%|463.113|480.45|3.7%|144.787',
        'TOTAL|65.75|121.08|77.604|-35.9%|18%|463.113|480.45|3.7%|144.787',
      ]),
    },
  ],
  date: '01 July, 2026',
  month: 7,
  msg_month: 'Jul-26',
};

/** A product's name over its companies, then the companies; a blank line before the next product. */
function productRows(product: Feed['msg'][number], last: boolean): MonthlyRow[] {
  return [
    outlineRow({ label: product.label, bold: true, step: 1 }, []),
    ...product.data.map((c) =>
      outlineRow({ label: c.company, bold: false, step: 1 }, [
        c.previous_year,
        c.previous_month,
        c.current,
        c.mom,
        c.yoy,
        c.fy1,
        c.fy2,
        c.fy,
        c.inventory,
      ]),
    ),
    ...(last ? [] : [outlineRow({ label: '', bold: false, step: 1 }, [])]),
  ];
}

export async function fetchFertilizerReport(): Promise<MonthlyReport> {
  const [head] = FEED.head;
  const columns = monthlyColumns([
    head.previous_year,
    head.previous_month,
    head.current,
    head.mom,
    head.yoy,
    head.fy1,
    head.fy2,
    head.fy,
    head.inventory,
  ]);
  /* A product's name has no figures: its cells, one per column, stay empty. */
  const rows = outlineLines(
    FEED.msg.flatMap((product, i) => productRows(product, i === FEED.msg.length - 1)),
  ).map((row) => (row.heading || row.spacer ? { ...row, values: columns.map(() => null) } : row));
  return {
    asOf: '2026-09-11',
    units: 'Period',
    columns,
    rows,
    changeDecimals: 1,
    source: 'NFDC, Akseer Research',
  };
}
