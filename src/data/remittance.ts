import { feedDate, monthlyColumns, msgHeadings, msgRow, msgRows, type MsgHead, type MsgRow } from './monthly';
import type { RemittanceMonth, RemittanceReport } from './types';

/* ============================================================================
 * REMITTANCE — Workers' Remittances (USD Mn)
 * ============================================================================
 * The ONLY file that knows where the month's workers' remittances come
 * from. It is a fixture today, transcribed on 11 September 2026 from what
 * the live page loads: api.askanalyst.com.pk/api/msg/remittances. The feed's
 * shape is kept below and normalised here, with the helpers the msg/ feeds
 * share (monthly.ts).
 *
 * THE FEED, as it answers:
 *
 *   head   one entry: `previous_year` ("Aug-25"), `fiscal_year` — which is
 *          last month ("Jul-26"), the other msg/ feeds' previous_month —
 *          `current` ("Aug-26"), "MoM %", "YoY %", and "FYTD %" with no
 *          headings for the year to date's amounts. The live page prints
 *          the month's five columns only, and so does this.
 *   msg    a row per country and the total, msg/pbs's shape: amounts as
 *          strings in USD millions (numbers for Other Countries), changes
 *          to one decimal ("-2.2%"). `bold` is false even for Total, which
 *          the live page sets in bold by its label, as this does.
 *   chart  every month from Aug-16: `bar`, the month's total, and `line`,
 *          its change on the year in percent — 0 through Jul-17, where the
 *          feed has no year before (read here as no figure).
 *   date   "11 September, 2026"; `month` 8.
 *
 * Carried as published, not corrected: the Other Countries line's changes
 * (MoM -14.5%, YoY -12.5%, where its amounts give +8.4% and +15.8%) and its
 * year to date ("8%" for both amounts). The live page prints each country's
 * YoY change under "MoM %" and its MoM change under "YoY %" (USA's 15.7% is
 * 267 → 309, on the year); the sheet prints them under their own headings.
 * ========================================================================= */

interface FeedHead {
  previous_year: string;
  /** Last month, despite its name. */
  fiscal_year: string;
  current: string;
  mom: string;
  yoy: string;
  fy: string;
}

interface Feed {
  head: FeedHead[];
  msg: MsgRow[];
  /** "11 September, 2026" */
  date: string;
  /** The report's month, 8. */
  month: number;
  chart: { date: string; date_label: string; bar: string | number; line: number }[];
}

/** label|bold|step|previous_year|previous_month|current|mom|yoy|fy1|fy2|fy, as the feed sends them. */
const LINES = [
  'USA||1|267|316|309|-2.2%|15.7%|537|625|-14.1%',
  'U.K||1|463|555|564|1.6%|21.8%|913|1119|-18.4%',
  'Saudi Arabia||1|737|914|873|-4.5%|18.5%|1561|1787|-12.6%',
  'U.A.E||1|643|737|750|1.8%|16.6%|1308|1487|-12%',
  'Other GCC Countries||1|304|336|327|-2.7%|7.6%|600|663|-9.5%',
  'EU Countries||1|433|461|496|7.6%|14.5%|857|957|-10.4%',
  'Other Countries||1|291|311|337|-14.5%|-12.5%|8%|8%|8%',
  'Total||1|3138|3630|3656|0.7%|16.5%|6353|7286|-12.8%',
];

/** date|date_label|bar|line, as the feed sends them. */
const CHART = [
  '2016-08-01|Aug-16|1768|0',
  '2016-09-01|Sep-16|1612|0',
  '2016-10-01|Oct-16|1561|0',
  '2016-11-01|Nov-16|1618|0',
  '2016-12-01|Dec-16|1585|0',
  '2017-01-01|Jan-17|1488|0',
  '2017-02-01|Feb-17|1417|0',
  '2017-03-01|Mar-17|1694|0',
  '2017-04-01|Apr-17|1539|0',
  '2017-05-01|May-17|1867|0',
  '2017-06-01|Jun-17|1840|0',
  '2017-07-01|Jul-17|1556|0',
  '2017-08-01|Aug-17|1975|11.708144796380093',
  '2017-09-01|Sep-17|1314|-18.4863523573201',
  '2017-10-01|Oct-17|1677|7.431133888532981',
  '2017-11-01|Nov-17|1596|-1.3597033374536438',
  '2017-12-01|Dec-17|1746|10.157728706624614',
  '2018-01-01|Jan-18|1662|11.693548387096776',
  '2018-02-01|Feb-18|1473|3.952011291460833',
  '2018-03-01|Mar-18|1804|6.493506493506485',
  '2018-04-01|Apr-18|1679|9.096816114359974',
  '2018-05-01|May-18|1804|-3.374397429030529',
  '2018-06-01|Jun-18|1628|-11.521739130434783',
  '2018-07-01|Jul-18|1974|26.863753213367602',
  '2018-08-01|Aug-18|2083|5.4683544303797404',
  '2018-09-01|Sep-18|1480|12.633181126331806',
  '2018-10-01|Oct-18|2053|22.420989862850327',
  '2018-11-01|Nov-18|1657|3.8220551378446155',
  '2018-12-01|Dec-18|1741|-0.286368843069873',
  '2019-01-01|Jan-19|1736|4.452466907340558',
  '2019-02-01|Feb-19|1574|6.856754921928032',
  '2019-03-01|Mar-19|1734|-3.880266075388028',
  '2019-04-01|Apr-19|1770|5.419892793329373',
  '2019-05-01|May-19|2302|27.60532150776054',
  '2019-06-01|Jun-19|1636|0.49140049140048436',
  '2019-07-01|Jul-19|2028|2.735562310030404',
  '2019-08-01|Aug-19|1684|-19.15506481036966',
  '2019-09-01|Sep-19|1740|17.567567567567565',
  '2019-10-01|Oct-19|2001|-2.532878714076958',
  '2019-11-01|Nov-19|1821|9.897404948702482',
  '2019-12-01|Dec-19|2097|20.44801838024124',
  '2020-01-01|Jan-20|1907|9.850230414746552',
  '2020-02-01|Feb-20|1825|15.946632782719195',
  '2020-03-01|Mar-20|1905|9.861591695501737',
  '2020-04-01|Apr-20|1785|0.8474576271186418',
  '2020-05-01|May-20|1865|-18.983492615117292',
  '2020-06-01|Jun-20|2473|51.16136919315404',
  '2020-07-01|Jul-20|2765|36.34122287968442',
  '2020-08-01|Aug-20|2096|24.46555819477434',
  '2020-09-01|Sep-20|2285|31.321839080459778',
  '2020-10-01|Oct-20|2284|14.142928535732135',
  '2020-11-01|Nov-20|2332|28.061504667764957',
  '2020-12-01|Dec-20|2422|15.498330948974726',
  '2021-01-01|Jan-21|2269|18.982695332983734',
  '2021-02-01|Feb-21|2260|23.835616438356166',
  '2021-03-01|Mar-21|2723|42.93963254593176',
  '2021-04-01|Apr-21|2793|56.470588235294116',
  '2021-05-01|May-21|2507|34.42359249329758',
  '2021-06-01|Jun-21|2714|9.745248685806708',
  '2021-07-01|Jul-21|2736|-1.0488245931283946',
  '2021-08-01|Aug-21|2683|28.005725190839705',
  '2021-09-01|Sep-21|2780|21.663019693654274',
  '2021-10-01|Oct-21|2629|15.105078809106832',
  '2021-11-01|Nov-21|2460|5.488850771869647',
  '2021-12-01|Dec-21|2520|4.046242774566466',
  '2022-01-01|Jan-22|2180|-3.922432789775232',
  '2022-02-01|Feb-22|2196|-2.831858407079646',
  '2022-03-01|Mar-22|2835|4.113110539845755',
  '2022-04-01|Apr-22|3124|11.851056211958477',
  '2022-05-01|May-22|2346|-6.422018348623848',
  '2022-06-01|Jun-22|2790|2.8002947678702927',
  '2022-07-01|Jul-22|2594|-5.190058479532167',
  '2022-08-01|Aug-22|2816|4.957137532612754',
  '2022-09-01|Sep-22|2487|-10.539568345323747',
  '2022-10-01|Oct-22|2248|-14.492202358311147',
  '2022-11-01|Nov-22|2173|-11.66666666666667',
  '2022-12-01|Dec-22|2100|-16.666666666666664',
  '2023-01-01|Jan-23|1900|-12.844036697247708',
  '2023-02-01|Feb-23|1990|-9.38069216757741',
  '2023-03-01|Mar-23|2537|-10.511463844797175',
  '2023-04-01|Apr-23|2198|-29.641485275288094',
  '2023-05-01|May-23|2103|-10.35805626598465',
  '2023-06-01|Jun-23|2187|-21.612903225806456',
  '2023-07-01|Jul-23|2029|-21.781033153430997',
  '2023-08-01|Aug-23|2095|-25.603693181818176',
  '2023-09-01|Sep-23|2208|-11.2183353437877',
  '2023-10-01|Oct-23|2463|9.564056939501775',
  '2023-11-01|Nov-23|2259|3.957662218131608',
  '2023-12-01|Dec-23|2382|13.428571428571434',
  '2024-01-01|Jan-24|2398|26.210526315789483',
  '2024-02-01|Feb-24|2250|13.065326633165819',
  '2024-03-01|Mar-24|2954|16.43673630271976',
  '2024-04-01|Apr-24|2813|27.979981801637855',
  '2024-05-01|May-24|3242|54.160722776985246',
  '2024-06-01|Jun-24|3158|44.39871970736169',
  '2024-07-01|Jul-24|2994|47.56037456875308',
  '2024-08-01|Aug-24|2943|40.47732696897375',
  '2024-09-01|Sep-24|2860|29.528985507246386',
  '2024-10-01|Oct-24|3055|24.035728786033282',
  '2024-11-01|Nov-24|2915|29.039397963700743',
  '2024-12-01|Dec-24|3080|29.303106633081445',
  '2025-01-01|Jan-25|3003|25.229357798165132',
  '2025-02-01|Feb-25|3127|38.977777777777774',
  '2025-03-01|Mar-25|4054|37.237643872714955',
  '2025-04-01|Apr-25|3177|12.939921791681485',
  '2025-05-01|May-25|3686|13.695249845774216',
  '2025-06-01|Jun-25|3406|7.853071564281189',
  '2025-07-01|Jul-25|3215|7.381429525718097',
  '2025-08-01|Aug-25|3138|6.625891946992857',
  '2025-09-01|Sep-25|3184|11.328671328671325',
  '2025-10-01|Oct-25|3420|11.947626841243864',
  '2025-11-01|Nov-25|3188|9.365351629502584',
  '2025-12-01|Dec-25|3592|16.62337662337663',
  '2026-01-01|Jan-26|3464|15.351315351315353',
  '2026-02-01|Feb-26|3288|5.1487048289095005',
  '2026-03-01|Mar-26|3831|-5.5007400098668',
  '2026-04-01|Apr-26|3537|11.3314447592068',
  '2026-05-01|May-26|4252|15.355398806294085',
  '2026-06-01|Jun-26|3475|2.0258367586611925',
  '2026-07-01|Jul-26|3630|12.90824261275272',
  '2026-08-01|Aug-26|3656|16.507329509241565',
];

const FEED: Feed = {
  head: [{ previous_year: 'Aug-25', fiscal_year: 'Jul-26', current: 'Aug-26', mom: 'MoM %', yoy: 'YoY %', fy: 'FYTD %' }],
  msg: msgRows(LINES),
  date: '11 September, 2026',
  month: 8,
  chart: CHART.map((line) => {
    const [date, date_label, bar, change] = line.split('|');
    return { date, date_label, bar, line: Number(change) };
  }),
};

/** A number, or a number sent as a string; anything else is no figure. */
function figure(value: string | number): number | null {
  const n = typeof value === 'number' ? value : Number.parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** The month's five headings: the year to date has no headings for its amounts. */
const headings = (head: FeedHead): MsgHead => ({
  previous_year: head.previous_year,
  previous_month: head.fiscal_year,
  current: head.current,
  mom: head.mom,
  yoy: head.yoy,
});

/** "2026-08" -> "2025-08". */
const yearBefore = (month: string) => `${Number(month.slice(0, 4)) - 1}${month.slice(4)}`;

/** The chart's months; a change on the year only where the feed has the year before. */
function toHistory(points: Feed['chart']): RemittanceMonth[] {
  const months = points.map((p) => ({ month: p.date.slice(0, 7), label: p.date_label, total: figure(p.bar), line: p.line }));
  const known = new Set(months.map((m) => m.month));
  return months
    .map(({ line, ...m }) => ({ ...m, yoy: known.has(yearBefore(m.month)) && Number.isFinite(line) ? line : null }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export async function fetchRemittanceReport(): Promise<RemittanceReport> {
  const columns = monthlyColumns(msgHeadings(headings(FEED.head[0]), String(FEED.month)));
  return {
    asOf: feedDate(FEED.date),
    units: 'USD Mn',
    columns,
    rows: FEED.msg.map((row) => {
      const line = msgRow(row, columns.length);
      return line.label === 'Total' ? { ...line, bold: true } : line;
    }),
    changeDecimals: 1,
    history: toHistory(FEED.chart),
    source: 'SBP, Akseer Research',
  };
}
