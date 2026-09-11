import type { PortfolioBar, PortfolioLine, PortfolioReport } from './types';

/* ============================================================================
 * PORTFOLIO INVESTMENT — FIPI / LIPI daily movement
 * ============================================================================
 * The ONLY file that knows where the day's portfolio flows come from. It is a
 * fixture today, transcribed on 11 September 2026 from what the live page
 * loads: api.askanalyst.com.pk/api/investment. The feed's shape is kept below
 * and normalised here, so pointing the accessor at the feed is a change here
 * and nowhere else.
 *
 * THE FEED, as it answers — every figure a number in USD millions, sales
 * negative, to the feed's full precision (the page prints two decimals):
 *
 *   date   "10 September, 2026", the session.
 *   lipi   local investors: the day's buy, sell and net, `data` (the net in
 *          each of eleven sectors) and `sector` — which, despite its name,
 *          is the eight investor TYPES (Individual, Companies …), each with
 *          its buy, sell, net and eleven sector cells ({sector, value …}).
 *   fipi   foreign investors, the same shape, three types (Foreign
 *          Individuals, Foreign Corporates, Overseas Pakistanis).
 *   wtd, mtd, cy, fy
 *          the week, month, calendar year and fiscal year to date, each with
 *          `fipi` and `lipi` totals — buy, sell, net, `client` (the net by
 *          investor type) and `sector` (the net by sector, labelled). The
 *          page prints the FOREIGN totals, as the rows WTD, MTD, CYTD and
 *          FYTD; the local ones mirror them (every foreign sale is a local
 *          purchase) and are not printed.
 *   pdf    the day's published PDF on pdf.askanalyst.com.pk.
 *
 * The fixture keeps only what the page prints. The live page renames two
 * investor types in its second table and its chart ("Other Organization" is
 * "Others", "Broker Proprietary" is "Broker Proprietary trading" and, on the
 * chart, "Broker"); so does this file.
 * ========================================================================= */

interface FeedFlow {
  buy: number;
  sell: number;
  net: number;
}

interface FeedInvestor extends FeedFlow {
  label: string;
  data: { sector: string; value: number }[];
}

interface FeedSide extends FeedFlow {
  /** The side's net in each sector. */
  data: { value: number }[];
  /** Its investor types. */
  sector: FeedInvestor[];
}

interface FeedPeriod extends FeedFlow {
  sector: { label: string; value: number }[];
}

type PeriodKey = 'wtd' | 'mtd' | 'cy' | 'fy';

interface Feed {
  date: string;
  lipi: FeedSide;
  fipi: FeedSide;
  /** Only the foreign totals are kept; see above. */
  periods: Record<PeriodKey, { fipi: FeedPeriod }>;
}

const SECTORS = ['Cement', 'Fertilizer', 'Food', 'E&P', 'OMC', 'Power', 'Banks', 'Tech', 'Textile', 'Debt', 'Others'];

/** label|buy|sell|net|the eleven sectors' nets, in SECTORS order, as the feed sends them. */
const LOCAL = [
  'Individual|94.654587|-93.439845|1.214742|-0.309747,0.403201,0.045545,0.816959,0.034064,0.319628,0.02939,0.003464,0.034896,-0.037095,-0.125563',
  'Companies|2.938984|-1.417397|1.521587|0.18281,-0.004843,0.104248,0.049787,0.064925,0.004735,-0.025783,-0.036258,0.000635,0,1.181331',
  'Banks/DFI|15.487713|-3.154535|12.333178|-1.115304,0.186732,-0.001288,-0.329308,0.019051,-0.040976,1.407508,-0.141652,-0.078116,12.377027,0.049504',
  'NBFC|0.048827|-0.091244|-0.042417|0.008006,-0.033047,0,0,0.008757,-0.010086,0,0,0,0,-0.016047',
  'Mutual Funds|50.506067|-53.079092|-2.573025|1.199497,-0.773698,-0.007059,-0.447552,-0.115014,-0.220707,-1.456509,0.285439,-0.008234,0.036941,-1.066129',
  'Other Organization|0.493199|-0.518682|-0.025483|0.181976,-0.033025,0.045374,-0.004033,-0.000007,-0.041691,0.015148,0.012276,-0.002927,0,-0.198574',
  'Broker Proprietary|14.295098|-14.32203|-0.026932|-0.404864,0.085442,-0.029374,0.143735,0.198127,0.020064,0.360071,-0.044926,0.011862,0.000154,-0.367223',
  'Insurance|1.019407|-13.1289|-12.109493|0.289248,0.087283,0.00083,0.111744,0.056316,0.000466,-0.07854,0.008636,-0.020069,-12.377027,-0.18838',
];
const LOCAL_NET = 'LIPI Net|179.443881|-179.151724|0.292157|0.031622,-0.081955,0.158276,0.341332,0.266219,0.031433,0.251285,0.086979,-0.061953,0,-0.731081';

const FOREIGN = [
  'Foreign Individuals|0|-0.012362|-0.012362|-0.005237,0,0,0,0,0,0,-0.006729,0,0,-0.000396',
  'Foreign Corporates|0.76303|-1.239143|-0.476113|-0.215997,0,-0.02061,-0.044933,-0.136657,-0.005232,-0.746792,0,0,0,0.694108',
  'Overseas Pakistanis|9.358299|-9.161986|0.196313|0.189608,0.081954,-0.137666,-0.296397,-0.129564,-0.026199,0.495506,-0.080251,0.061952,0,0.03737',
];
const FOREIGN_NET = 'FIPI Net|10.121329|-10.413491|-0.292162|-0.031626,0.081954,-0.158276,-0.34133,-0.266221,-0.031431,-0.251286,-0.08698,0.061952,0,0.731082';

/** The foreign totals to date: key|buy|sell|net|sectors. */
const PERIODS = [
  'wtd|33.439865|-33.979392|-0.539527|-1.619388,0.418619,-0.05671,-0.716328,-0.285433,0.225142,-2.003723,-0.090922,0.220579,0.180002,3.188635',
  'mtd|72.198674|-76.113415|-3.914741|-2.704921,0.435295,-0.126339,-1.199831,-0.488829,0.433557,-7.256335,-0.243756,0.19982,0.33488,6.701718',
  'cy|2286.254527|-2874.129132|-587.874604|-301.106322,-4.826085,-176.645082,13.495125,-5.299433,-9.020807,-77.822472,-21.105756,-6.762166,0.914985,0.303409',
  'fy|628.282071|-617.673756|10.608315|-6.566038,1.598876,0.129127,9.308438,-3.145186,-2.462877,-3.814511,-9.694108,0.463833,0.56898,24.22178',
];

const split = (line: string) => {
  const [label, buy, sell, net, sectors] = line.split('|');
  return { label, amounts: { buy: Number(buy), sell: Number(sell), net: Number(net) }, values: sectors.split(',').map(Number) };
};

const investor = (line: string): FeedInvestor => {
  const { label, amounts, values } = split(line);
  return { label, ...amounts, data: values.map((value, i) => ({ sector: SECTORS[i], value })) };
};

const side = (total: string, types: string[]): FeedSide => {
  const { amounts, values } = split(total);
  return { ...amounts, data: values.map((value) => ({ value })), sector: types.map(investor) };
};

const FEED: Feed = {
  date: '10 September, 2026',
  lipi: side(LOCAL_NET, LOCAL),
  fipi: side(FOREIGN_NET, FOREIGN),
  periods: Object.fromEntries(
    PERIODS.map((line) => {
      const { label: key, amounts, values } = split(line);
      return [key, { fipi: { ...amounts, sector: values.map((value, i) => ({ label: SECTORS[i], value })) } }];
    }),
  ) as Feed['periods'],
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "10 September, 2026" -> "2026-09-10". */
function isoDate(text: string): string {
  const match = /^(\d{1,2}) ([A-Za-z]+),? (\d{4})$/.exec(text.trim());
  const index = match ? MONTHS.findIndex((m) => match[2].startsWith(m)) : -1;
  if (!match || index < 0) throw new Error(`Unrecognised date "${text}"`);
  return `${match[3]}-${String(index + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
}

/** A published figure, or null where the feed sends none. */
const figure = (value: number | undefined): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

/** The period rows, as the page heads them. */
const PERIOD_LABELS: Record<PeriodKey, string> = { wtd: 'WTD', mtd: 'MTD', cy: 'CYTD', fy: 'FYTD' };

/** The second table's and the chart's names for the feed's investor types. */
const SUMMARY_NAMES: Record<string, string> = {
  'Other Organization': 'Others',
  'Broker Proprietary': 'Broker Proprietary trading',
};
const CHART_NAMES: Record<string, string> = {
  'Other Organization': 'Others',
  'Broker Proprietary': 'Broker',
};

const flow = (f: FeedFlow) => ({ buy: figure(f.buy), sell: figure(f.sell), net: figure(f.net) });

const typeLine = (t: FeedInvestor): PortfolioLine => ({
  label: t.label,
  bold: false,
  ...flow(t),
  sectors: SECTORS.map((_, i) => figure(t.data[i]?.value)),
});

const totalLine = (label: string, s: FeedSide): PortfolioLine => ({
  label,
  bold: true,
  ...flow(s),
  sectors: SECTORS.map((_, i) => figure(s.data[i]?.value)),
});

const periodLine = (key: PeriodKey): PortfolioLine => {
  const p = FEED.periods[key].fipi;
  return {
    label: PERIOD_LABELS[key],
    bold: false,
    group: 'FIPI',
    ...flow(p),
    sectors: SECTORS.map((name) => figure(p.sector.find((s) => s.label === name)?.value)),
  };
};

/** A line of the second table: the flows without the sectors. */
const summaryLine = (line: PortfolioLine): PortfolioLine => ({
  ...line,
  label: SUMMARY_NAMES[line.label] ?? line.label,
  sectors: [],
});

export async function fetchPortfolioReport(): Promise<PortfolioReport> {
  const local = FEED.lipi.sector.map(typeLine);
  const foreign = FEED.fipi.sector.map(typeLine);
  const localNet = totalLine('LIPI Net', FEED.lipi);
  const foreignNet = totalLine('FIPI Net', FEED.fipi);

  const chart: PortfolioBar[] = [
    { label: 'FIPI', net: foreignNet.net },
    ...local.map((t) => ({ label: CHART_NAMES[t.label] ?? t.label, net: t.net })),
  ];

  return {
    asOf: isoDate(FEED.date),
    sectors: SECTORS,
    lines: [...local, localNet, ...foreign, foreignNet, ...(['wtd', 'mtd', 'cy', 'fy'] as const).map(periodLine)],
    summary: [...foreign, foreignNet, ...local].map(summaryLine),
    chart,
    source: 'NCCPL, Akseer Research',
  };
}
