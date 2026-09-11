import { feedDate, monthlyColumns, msgHeadings, outlineRow, type MsgHead, type MsgRow } from './monthly';
import type { MonthlyReport, MonthlyRow } from './types';

/* ============================================================================
 * AUTO — Auto Sales Volumes
 * ============================================================================
 * The ONLY file that knows where the month's vehicle sales come from. It is
 * a fixture today, transcribed on 11 September 2026 from what the live page
 * loads: api.askanalyst.com.pk/api/msg/autos. The feed's shape is kept below
 * and normalised here, with the helpers the msg/ feeds share (monthly.ts).
 *
 * THE FEED, as it answers — msg/pbs's shape without the year to date:
 *
 *   head   one entry: the same month a year ago ("Jul-25"), last month, this
 *          month, "MoM" and "YoY".
 *   msg    one row per line, every one `step` 1: each maker in bold (INDU,
 *          HCAR, PSMC, Hyundai, then Sazgar - Haval, MTL, AGTL, GAL and GHNI
 *          alone), the first four followed by their models; then passenger
 *          cars by engine size, "Total Passenger Cars" in bold, the other
 *          vehicles, and "Industry" in bold. Units sold, as numbers or as
 *          strings ("2418"); changes to one decimal with the zero dropped
 *          ("-6%", "3%"), "-" where neither month sold any (WagonR, 0 to 0).
 *   date   "11 September, 2026"; `month` "07".
 *
 * Every change matches its amounts but two, carried as published: WagonR's
 * and Ravi + Bolan's YoY read "NM" where their sales fell to nothing
 * (-100%). Labels are the feed's own ("Civic +City", "Santa FE").
 * ========================================================================= */

/** A row as the feed sends it: msg/pbs's, without the year to date. */
type FeedRow = Omit<MsgRow, 'fy1' | 'fy2' | 'fy'>;

interface Feed {
  head: MsgHead[];
  msg: FeedRow[];
  /** "11 September, 2026" */
  date: string;
  /** The report's month, "07". */
  month: string;
}

/** label|bold|step|previous_year|previous_month|current|mom|yoy, as the feed sends them. */
const LINES = [
  'INDU|bold|1|3337|3507|5089|45.1%|52.5%',
  'Corolla, Yaris & Cross||1|2418|2650|4283|61.6%|77.1%',
  'Fortuner & Hilux||1|919|857|806|-6%|-12.3%',
  'HCAR|bold|1|1500|2972|2640|-11.2%|76%',
  'Civic +City||1|1143|2594|2529|-2.5%|121.3%',
  'BRV & HRV||1|357|378|111|-70.6%|-68.9%',
  'PSMC|bold|1|3680|9826|10120|3%|175%',
  'Alto||1|2327|7239|7217|-0.3%|210.1%',
  'WagonR||1|25|0|0|-|NM',
  'Cultus||1|239|439|392|-10.7%|64%',
  'Swift||1|522|1668|2018|21%|286.6%',
  'Ravi + Bolan||1|337|0|0|-|NM',
  'Every||1|230|480|493|2.7%|114.3%',
  'Hyundai|bold|1|1225|1351|710|-47.4%|-42%',
  'Elantra||1|141|237|211|-11%|49.6%',
  'Tucson||1|546|548|171|-68.8%|-68.7%',
  'Sonata||1|66|51|25|-51%|-62.1%',
  'Porter||1|395|431|286|-33.6%|-27.6%',
  'Santa FE||1|77|84|17|-79.8%|-77.9%',
  'Sazgar - Haval|bold|1|1079|2720|663|-75.6%|-38.6%',
  'MTL|bold|1|875|2039|828|-59.4%|-5.4%',
  'AGTL|bold|1|320|1020|414|-59.4%|29.4%',
  'GAL|bold|1|32|85|111|30.6%|246.9%',
  'GHNI|bold|1|127|596|377|-36.7%|196.9%',
  'Below 1,000cc||1|2557|7719|7710|-0.1%|201.5%',
  '1,000cc-1,300cc||1|264|439|392|-10.7%|48.5%',
  'Above 1,300cc||1|4290|7200|9066|25.9%|111.3%',
  'Total Passenger Cars|bold|1|7111|15358|17168|11.8%|141.4%',
  'Jeeps & Pickups||1|3908|5446|2469|-54.7%|-36.8%',
  'Trucks & Buses||1|374|1023|919|-10.2%|145.7%',
  'Tractors||1|1195|3059|1242|-59.4%|3.9%',
  '2/3 Wheelers||1|124538|178508|172416|-3.4%|38.4%',
  'Industry|bold|1|137126|203394|194214|-4.5%|41.6%',
];

const FEED: Feed = {
  head: [{ previous_year: 'Jul-25', previous_month: 'Jun-26', current: 'Jul-26', mom: 'MoM', yoy: 'YoY' }],
  msg: LINES.map((line) => {
    const [label, bold, step, previous_year, previous_month, current, mom, yoy] = line.split('|');
    return { label, bold: bold === 'bold', step: Number(step), previous_year, previous_month, current, mom, yoy };
  }),
  date: '11 September, 2026',
  month: '07',
};

/** Whether `parts` add up to `total` in every amount column. */
function addsUp(total: MonthlyRow, parts: readonly MonthlyRow[], amounts: readonly number[]): boolean {
  return (
    parts.length > 0 &&
    amounts.every((column) => {
      const whole = total.values[column];
      const sum = parts.reduce((acc, part) => {
        const value = part.values[column];
        return acc + (typeof value === 'number' ? value : Number.NaN);
      }, 0);
      return typeof whole === 'number' && Math.abs(sum - whole) < 0.5;
    })
  );
}

/**
 * A maker's models are read with its name first — "INDU, Corolla, Yaris &
 * Cross" — so a screen reader hears whose they are. The feed marks makers
 * and totals alike only as bold, so the lines after a bold one are its
 * models only where they add up to it, month by month: the cars by engine
 * size after GHNI do not, nor the vehicles after Total Passenger Cars.
 */
function makersModels(rows: readonly MonthlyRow[], amounts: readonly number[]): MonthlyRow[] {
  const grouped = [...rows];
  rows.forEach((row, i) => {
    if (!row.bold) return;
    let end = i + 1;
    while (end < rows.length && !rows[end].bold) end += 1;
    const models = rows.slice(i + 1, end);
    if (!addsUp(row, models, amounts)) return;
    models.forEach((model, k) => {
      grouped[i + 1 + k] = { ...model, group: row.label };
    });
  });
  return grouped;
}

export async function fetchAutoReport(): Promise<MonthlyReport> {
  const columns = monthlyColumns(msgHeadings(FEED.head[0], FEED.month));
  const rows = FEED.msg.map((row) =>
    outlineRow(row, [row.previous_year, row.previous_month, row.current, row.mom, row.yoy].slice(0, columns.length)),
  );
  const amounts = columns.flatMap((column, i) => (column.kind === 'amount' ? [i] : []));
  return {
    asOf: feedDate(FEED.date),
    units: 'Units',
    columns,
    rows: makersModels(rows, amounts),
    changeDecimals: 1,
    source: 'PAMA, Akseer Research',
  };
}
