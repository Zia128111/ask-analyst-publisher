import { MONTHS, monthlyColumns } from './monthly';
import type { CementReport, PriceSeries } from './types';

/* ============================================================================
 * CEMENT — Cement Price History (PKR/bag)
 * ============================================================================
 * The ONLY file that knows where the cement prices come from. It is a
 * fixture today, transcribed on 11 September 2026 from what the live page
 * loads: api.askanalyst.com.pk/api/msg/cement. The feed's shape is kept
 * below and normalised here.
 *
 * THE FEED, as it answers — an array, one entry per region:
 *
 *   label  "North Region", "South Region" (with `value`/`region` "North",
 *          an `id` and a `sum_id`).
 *   data   the region's price of a bag each week, oldest first: `year` is
 *          the week's day, "10-Sep-26" (a Thursday, the Bureau's survey
 *          day), `value` a number of rupees. Fifty-one weeks, from
 *          04-Sep-25; a week is missing here and there (21-May → 04-Jun,
 *          18-Jun → 02-Jul, 30-Jul → 13-Aug), as the survey skipped it.
 *
 * The table is the latest five weeks, as the live page prints it; the chart
 * every week. The feed carries no date: the live page stamps the sheet with
 * the day it is viewed, and the fixture with the day it was transcribed, as
 * Oil Marketing's does.
 * ========================================================================= */

interface FeedRegion {
  id: number;
  value: string;
  label: string;
  region: string;
  data: { year: string; value: number | string }[];
}

/** Weeks in the table: the latest five, as the live page prints them. */
const TABLE_WEEKS = 5;

/** A region's weeks, as "dd-Mon-yy value" pairs. */
const weeks = (text: string) =>
  text
    .trim()
    .split(/\s+/)
    .reduce<{ year: string; value: number }[]>((all, token, i, tokens) => {
      if (i % 2 === 0) all.push({ year: token, value: Number(tokens[i + 1]) });
      return all;
    }, []);

const FEED: FeedRegion[] = [
  {
    id: 18,
    value: 'North',
    label: 'North Region',
    region: 'North',
    data: weeks(`
      04-Sep-25 1391 11-Sep-25 1390 18-Sep-25 1387 25-Sep-25 1382 02-Oct-25 1381 09-Oct-25 1372
      16-Oct-25 1373 23-Oct-25 1369 30-Oct-25 1364 06-Nov-25 1361 13-Nov-25 1362 20-Nov-25 1365
      27-Nov-25 1374 04-Dec-25 1379 11-Dec-25 1389 18-Dec-25 1402 24-Dec-25 1391 01-Jan-26 1387
      08-Jan-26 1383 15-Jan-26 1375 22-Jan-26 1381 29-Jan-26 1387 04-Feb-26 1395 12-Feb-26 1412
      19-Feb-26 1420 26-Feb-26 1420 05-Mar-26 1420 11-Mar-26 1481 18-Mar-26 1476 26-Mar-26 1482
      02-Apr-26 1487 09-Apr-26 1567 16-Apr-26 1548 23-Apr-26 1535 30-Apr-26 1530 07-May-26 1528
      14-May-26 1525 21-May-26 1521 04-Jun-26 1511 11-Jun-26 1501 18-Jun-26 1488 02-Jul-26 1475
      09-Jul-26 1485 16-Jul-26 1511 23-Jul-26 1531 30-Jul-26 1566 13-Aug-26 1569 20-Aug-26 1565
      27-Aug-26 1555 03-Sep-26 1554 10-Sep-26 1547
    `),
  },
  {
    id: 19,
    value: 'South',
    label: 'South Region',
    region: 'South',
    data: weeks(`
      04-Sep-25 1443 11-Sep-25 1443 18-Sep-25 1443 25-Sep-25 1449 02-Oct-25 1449 09-Oct-25 1431
      16-Oct-25 1441 23-Oct-25 1441 30-Oct-25 1441 06-Nov-25 1441 13-Nov-25 1441 20-Nov-25 1440
      27-Nov-25 1440 04-Dec-25 1441 11-Dec-25 1445 18-Dec-25 1446 24-Dec-25 1446 01-Jan-26 1446
      08-Jan-26 1446 15-Jan-26 1448 22-Jan-26 1449 29-Jan-26 1444 04-Feb-26 1444 12-Feb-26 1438
      19-Feb-26 1438 26-Feb-26 1437 05-Mar-26 1444 11-Mar-26 1471 18-Mar-26 1471 26-Mar-26 1489
      02-Apr-26 1502 09-Apr-26 1533 16-Apr-26 1544 23-Apr-26 1542 30-Apr-26 1539 07-May-26 1539
      14-May-26 1540 21-May-26 1537 04-Jun-26 1529 11-Jun-26 1530 18-Jun-26 1533 02-Jul-26 1549
      09-Jul-26 1551 16-Jul-26 1542 23-Jul-26 1546 30-Jul-26 1547 13-Aug-26 1547 20-Aug-26 1547
      27-Aug-26 1539 03-Sep-26 1540 10-Sep-26 1547
    `),
  },
];

/** "10-Sep-26" -> "2026-09-10". */
function weekDate(label: string): string {
  const [day, month, year] = label.split('-');
  const index = MONTHS.indexOf(month);
  if (!/^\d{1,2}$/.test(day ?? '') || index < 0 || !/^\d{2}$/.test(year ?? '')) {
    throw new Error(`Unrecognised week "${label}"`);
  }
  return `20${year}-${String(index + 1).padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/** A number, or a number sent as a string; anything else is no figure. */
function figure(value: number | string): number | null {
  const n = typeof value === 'number' ? value : Number.parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

const toSeries = (region: FeedRegion): PriceSeries => ({
  label: region.label.trim(),
  points: region.data
    .map((week) => ({ date: weekDate(week.year), label: week.year, value: figure(week.value) }))
    .sort((a, b) => a.date.localeCompare(b.date)),
});

export async function fetchCementReport(): Promise<CementReport> {
  const series = FEED.map(toSeries);
  /* The table's weeks: the latest the first region has, each region's price then. */
  const latest = (series[0]?.points ?? []).slice(-TABLE_WEEKS);
  return {
    asOf: '2026-09-11',
    units: 'PKR/bag',
    columns: monthlyColumns(latest.map((p) => p.label)),
    rows: series.map((s) => ({
      label: s.label,
      bold: false,
      values: latest.map((week) => s.points.find((p) => p.date === week.date)?.value ?? null),
    })),
    series,
    source: 'PBS, Akseer Research',
  };
}
