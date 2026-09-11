import type {
  Company,
  LatestResult,
  ResultColumn,
  ResultMeasure,
  ResultRow,
  SharePrice,
} from './types';

/* ============================================================================
 * LATEST RESULT — a listed company's last published result
 * ============================================================================
 * The ONLY file that knows where Latest Result data comes from. It is a
 * fixture today, transcribed on 10 September 2026 from what the live page
 * loads: its company list (api.askanalyst.com.pk/api/companylistwithids,
 * 361 companies there; the ten below here), each company's result
 * (/api/result/{id}) and the share price its letterhead prints. The
 * accessors are already async and return the wire shape, so pointing them at
 * the feed is a change to this file alone.
 *
 * THE FEED'S SHAPE is kept as it arrives: the column headings, then one line
 * per row, "label|bold|values", each value as the feed writes it. The rows are
 * the company's own — a bank's statement has mark-up and provisions, an
 * explorer's has royalty and exploration — and so are the periods: a June
 * year-end company reports 4QFY26 and FY26, a calendar-year one 2QCY26 and
 * 1HCY26, and PSO, whose fourth quarter is not out yet, 3QFY26 and 9MFY26.
 *
 * NORMALISING, below, is the only interpretation this file does:
 *   - a heading ending "(%)" is a change column, one starting "nQ" a
 *     quarter, anything else a period to date;
 *   - the CURRENT periods — highlighted on the sheet — are the quarter and
 *     the period to date immediately before a change column;
 *   - a quarter's YoY compares it with the quarter four columns back, and
 *     every other change with the column before;
 *   - EPS and DPS rows are per share, in rupees; every other row is PKR
 *     millions.
 * The feed marks every row "PKR(mn)" whatever it holds, so the unit is read
 * from the label, as the page's own units line does.
 * ========================================================================= */

/** The company the page opens on: the benchmark's. */
export const DEFAULT_TICKER = 'LUCK';

/** In the live list's order: alphabetical by name. */
const COMPANIES: Company[] = [
  { id: 1, ticker: 'ABOT', name: 'Abbot Laboratories (Pakistan) Ltd', sector: 'PHARMACEUTICALS' },
  { id: 97, ticker: 'EFERT', name: 'Engro Fertilizers Ltd', sector: 'FERTILIZER' },
  { id: 107, ticker: 'FFC', name: 'Fauji Fertilizer Company Ltd', sector: 'FERTILIZER' },
  { id: 189, ticker: 'LUCK', name: 'Lucky Cement Ltd', sector: 'CEMENT' },
  { id: 194, ticker: 'MARI', name: 'Mari Energies Limited', sector: 'OIL & GAS EXPLORATION COMPANIES' },
  { id: 199, ticker: 'MEBL', name: 'Meezan Bank Ltd', sector: 'COMMERCIAL BANKS' },
  {
    id: 223,
    ticker: 'OGDC',
    name: 'Oil & Gas Development Company Ltd',
    sector: 'OIL & GAS EXPLORATION COMPANIES',
  },
  { id: 247, ticker: 'PSO', name: 'Pakistan State Oil Company Ltd', sector: 'OIL & GAS MARKETING COMPANIES' },
  { id: 307, ticker: 'SYS', name: 'Systems Ltd', sector: 'TECHNOLOGY & COMMUNICATION' },
  { id: 318, ticker: 'HUBC', name: 'The Hub Power Company Ltd', sector: 'POWER GENERATION & DISTRIBUTION' },
];

const STATEMENT = 'P&L Summary';
const UNITS = 'Amount in PKR Mn; per share in PKR';

/** The session every price below is for. */
const PRICE_DATE = '2026-09-10';

/** Close, change and change %, as each company's letterhead printed them. */
const PRICES: Record<string, Omit<SharePrice, 'asOf'>> = {
  ABOT: { close: 914.91, change: -6.6, changePct: -0.72 },
  EFERT: { close: 183.96, change: -2.49, changePct: -1.34 },
  FFC: { close: 532.34, change: -9.04, changePct: -1.67 },
  HUBC: { close: 202.29, change: -3.76, changePct: -1.82 },
  LUCK: { close: 408.03, change: -7.33, changePct: -1.76 },
  MARI: { close: 645.21, change: -8.76, changePct: -1.34 },
  MEBL: { close: 536.21, change: -19.91, changePct: -3.58 },
  OGDC: { close: 315.92, change: -6.26, changePct: -1.94 },
  PSO: { close: 342.31, change: -10.48, changePct: -2.97 },
  SYS: { close: 123.07, change: -1.68, changePct: -1.35 },
};

interface FeedResult {
  /** The column headings, comma-separated. */
  columns: string;
  /** One line per row: "label|bold|value,value,…". */
  rows: readonly string[];
}

const JUNE_YEAR = '4QFY25,1QFY26,2QFY26,3QFY26,4QFY26,YoY(%),QoQ(%),FY25,FY26,YoY(%)';
const CALENDAR_YEAR = '2QCY25,3QCY25,4QCY25,1QCY26,2QCY26,YoY(%),QoQ(%),1HCY25,1HCY26,YoY(%)';

const FEED: Record<string, FeedResult> = {
  ABOT: {
    columns: CALENDAR_YEAR,
    rows: [
      'Net sales|1|19061,19819,19171,17705,20322,6.6,14.8,36407,38027,4.4',
      'Cost of sales|0|-12288,-13093,-12059,-11007,-12570,2.3,14.2,-23793,-23577,-0.9',
      'Gross profit|1|6773,6726,7111,6698,7752,14.5,15.7,12615,14450,14.5',
      'Selling/distribution expenses|0|-2806,-2974,-2584,-2918,-3227,15.0,10.6,-5527,-6145,11.2',
      'Administrative expenses|0|-335,-334,-391,-380,-396,18.2,4.2,-638,-776,21.6',
      'Operating profit|1|3632,3418,4136,3399,4129,13.7,21.5,6450,7528,16.7',
      'Financial charges|0|-34,-18,-20,-18,-17,-50.0,-5.6,-38,-35,-7.9',
      'Other income|0|157,187,557,229,365,132.5,59.4,417,594,42.4',
      'Other charges|0|-505,-430,-331,-320,-567,12.3,77.2,-827,-887,7.3',
      'Profit before tax|1|3250,3156,4341,3291,3909,20.3,18.8,6002,7200,20.0',
      'Taxation|0|-1307,-1334,-1741,-1350,-1709,30.8,26.6,-2459,-3059,24.4',
      'Profit after tax|1|1943,1823,2601,1940,2200,13.2,13.4,3543,4140,16.9',
      'EPS - Basic|0|19.85,18.62,26.56,19.82,22.47,13.2,13.4,36.2,42.3,16.9',
      'EPS - Diluted|0|19.85,18.62,26.56,19.82,22.47,13.2,13.4,36.2,42.3,16.9',
      'DPS|1|0.00,0.00,40.00,0.00,0.00,0.0,0.0,0.00,0.00,0.0',
    ],
  },
  EFERT: {
    columns: CALENDAR_YEAR,
    rows: [
      'Net sales|1|50404,54764,101677,37790,33065,-34.4,-12.5,80690,70855,-12.2',
      'Cost of sales|0|-34560,-36923,-73491,-26059,-21239,-38.5,-18.5,-54164,-47298,-12.7',
      'Gross profit|1|15844,17841,28185,11731,11825,-25.4,0.8,26526,23556,-11.2',
      'Selling/distribution expenses|0|-3392,-5320,-8277,-3256,-3914,15.4,20.2,-6617,-7170,8.4',
      'Administrative expenses|0|-1759,-1278,-1006,-1197,-1328,-24.5,10.9,-2995,-2525,-15.7',
      'Operating profit|1|10694,11243,18903,7278,6582,-38.5,-9.6,16915,13860,-18.1',
      'Financial charges|0|-1769,-1262,-2050,-1427,-1867,5.5,30.8,-2859,-3294,15.2',
      'Other income|0|1286,534,1597,382,413,-67.9,8.1,1599,795,-50.3',
      'Other charges|0|-990,-939,-2142,-673,1426,-244.0,-311.9,-1508,753,-149.9',
      'Profit before tax|1|9222,9576,16308,5560,6554,-28.9,17.9,14148,12114,-14.4',
      'Taxation|0|-3656,-3765,-7954,-2242,-2754,-24.7,22.8,-5684,-4996,-12.1',
      'Profit after tax|1|5565,5811,8354,3319,3800,-31.7,14.5,8463,7119,-15.9',
      'EPS - Basic|0|4.17,4.35,6.26,2.49,2.85,-31.7,14.5,6.3,5.3,-15.8',
      'EPS - Diluted|0|4.17,4.35,6.26,2.49,2.85,-31.7,14.5,6.3,5.3,-15.8',
      'DPS|1|4.25,4.50,4.00,2.00,1.75,-58.0,-12.0,6.50,3.80,-42.0',
    ],
  },
  FFC: {
    columns: CALENDAR_YEAR,
    rows: [
      'Net sales|1|106595,140205,161311,109553,120573,13.1,10.1,182292,230126,26.2',
      'Cost of sales|0|-69474,-94557,-120879,-75221,-79308,14.2,5.4,-119492,-154529,29.3',
      'Gross profit|1|37120,45648,40431,34332,41264,11.2,20.2,62800,75596,20.4',
      'Selling/distribution expenses|0|-10319,-9853,-10480,-9396,-11565,12.1,23.1,-17752,-20961,18.1',
      'Operating profit|1|26802,35795,29951,24937,29699,10.8,19.1,45048,54636,21.3',
      'Financial charges|0|-1899,-1723,-1568,-2277,-2226,17.2,-2.2,-3824,-4503,17.8',
      'Other income|0|4798,4414,4286,4360,5302,10.5,21.6,9975,9662,-3.1',
      'Other charges|0|-2636,-3606,-3003,-2242,-2798,6.1,24.8,-4632,-5040,8.8',
      "Share of associates' profit/(loss)|0|6689,4190,7774,5580,5582,-16.5,0.0,13225,11162,-15.6",
      'Profit before tax|1|33754,39070,37439,30358,35559,5.3,17.1,59792,65917,10.2',
      'Taxation|0|-13437,-13982,-15535,-10393,-13107,-2.5,26.1,-21839,-23500,7.6',
      'Profit after tax|1|20317,25089,21904,19965,22452,10.5,12.5,37953,42417,11.8',
      'Profit after tax a/t non-controlling interest|0|633,554,353,370,250,-60.5,-32.4,868,620,-28.6',
      'Profit after tax a/t company owners|1|19684,24535,21552,19595,22202,12.8,13.3,37085,41797,12.7',
      'EPS - Basic|0|14.28,17.24,14.53,13.62,15.43,8.1,13.3,26.7,29.1,8.9',
      'EPS - Diluted|0|14.28,17.24,14.53,13.62,15.43,8.1,13.3,26.7,29.1,8.9',
      'DPS|1|12.00,9.50,8.50,8.50,14.50,20.0,70.0,19.00,23.00,21.0',
    ],
  },
  HUBC: {
    columns: JUNE_YEAR,
    rows: [
      'Net sales|1|18755,17397,16724,16454,20551,9.6,24.9,83351,71126,-14.7',
      'Cost of sales|0|-10339,-9811,-9296,-9856,-12475,20.7,26.6,-43528,-41438,-4.8',
      'Gross profit|1|8417,7586,7428,6598,8076,-4.1,22.4,39825,29688,-25.5',
      'Administrative expenses|0|-793,-623,-657,-437,-290,-63.4,-33.6,-1961,-2007,2.3',
      'Operating profit|1|7624,6964,6771,6161,7787,2.1,26.4,37863,27683,-26.9',
      'Financial charges|0|-2778,-2501,-2291,-2072,-2271,-18.3,9.6,-15230,-9135,-40.0',
      'Other income|0|73,1319,1348,3959,758,938.4,-80.9,4037,7384,82.9',
      'Other charges|0|-244,-119,-108,-265,-505,107.0,90.6,-3856,-997,-74.1',
      "Share of associates' profit/(loss)|0|10953,10794,10492,11023,13007,18.8,18.0,41310,45316,9.7",
      'Profit before tax|1|15627,16456,16212,18805,18775,20.1,-0.2,64123,70248,9.6',
      'Taxation|0|-3133,-3177,-3866,-6680,-268,-91.4,-96.0,-12496,-13991,12.0',
      'Profit after tax|1|13480,13279,12346,12125,18507,37.3,52.6,51746,56257,8.7',
      'Profit after tax a/t non-controlling interest|0|1742,1650,1718,1319,1940,11.4,47.1,5643,6627,17.4',
      'Profit after tax a/t company owners|1|11738,11628,10629,10806,16567,41.1,53.3,46104,49630,7.6',
      'EPS - Basic|0|9.16,8.96,8.19,8.33,12.78,39.5,53.4,35.7,38.3,7.3',
      'EPS - Diluted|0|9.16,8.96,8.19,8.33,12.78,39.5,53.4,35.7,38.3,7.3',
      'DPS|1|10.00,5.00,5.00,5.00,5.00,-50.0,0.0,15.00,20.00,33.0',
    ],
  },
  LUCK: {
    columns: JUNE_YEAR,
    rows: [
      'Net sales|1|121245,123595,123490,130240,139034,14.7,6.8,454060,516359,13.7',
      'Cost of sales|0|-88598,-92114,-92018,-99527,-101395,14.4,1.9,-326892,-385054,17.8',
      'Gross profit|1|32648,31481,31472,30713,37639,15.3,22.6,127168,131305,3.3',
      'Selling/distribution expenses|0|-4212,-4157,-3961,-4190,-4632,10.0,10.5,-17254,-16940,-1.8',
      'Administrative expenses|0|-876,-2110,-2567,-2443,-1464,67.1,-40.1,-7559,-8584,13.6',
      'Operating profit|1|27560,25214,24944,24079,31543,14.5,31.0,102354,105780,3.3',
      'Financial charges|0|-5217,-4808,-4859,-4574,-4702,-9.9,2.8,-25498,-18943,-25.7',
      'Other income|0|619,4143,7788,3376,5665,815.2,67.8,16183,20972,29.6',
      'Other charges|0|-1096,0,-3229,-1509,-3268,198.2,116.6,-4729,-8006,69.3',
      "Share of associates' profit/(loss)|0|4849,5404,5151,2718,3480,-28.2,28.0,17780,16753,-5.8",
      'Profit before tax|1|26715,29953,29795,24091,32718,22.5,35.8,106090,116557,9.9',
      'Taxation|0|-5353,-6391,-5325,-3651,-4733,-11.6,29.6,-21592,-20100,-6.9',
      'Profit after tax|1|21362,23561,24470,20440,27985,31.0,36.9,84499,96456,14.2',
      'Profit after tax a/t non-controlling interest|0|1719,1567,1850,1368,2630,53.0,92.3,7543,7415,-1.7',
      'Profit after tax a/t company owners|1|19643,21995,22619,19072,25356,29.1,32.9,76956,89042,15.7',
      'EPS - Basic|0|13.41,15.01,15.44,13.02,17.31,29.1,32.9,52.5,60.8,15.7',
      'EPS - Diluted|0|13.41,15.01,15.44,13.02,17.31,29.1,32.9,52.5,60.8,15.7',
      'DPS|1|4.00,0.00,0.00,0.00,5.00,25.0,0.0,4.00,5.00,25.0',
    ],
  },
  MARI: {
    columns: JUNE_YEAR,
    rows: [
      'Net sales|1|44803,45351,44770,48178,53363,19.1,10.8,177097,191662,8.2',
      'Royalty|0|-10453,-11274,-10649,-11242,-12552,20.1,11.7,-35611,-45717,28.4',
      'Operating/field costs|0|-9380,-8369,-12027,-10650,-12292,31.0,15.4,-40863,-43338,6.1',
      'Gross profit|1|24970,25708,22094,26286,28519,14.2,8.5,100623,102607,2.0',
      'Exploration costs|0|-5235,-2212,-1864,-4876,-8281,58.2,69.8,-14862,-17233,16.0',
      'Operating profit|1|19735,23496,20230,21411,20239,2.6,-5.5,85761,85376,-0.4',
      'Financial charges|0|-929,-977,-988,-987,-1511,62.6,53.1,-3478,-4463,28.3',
      'Other income|0|2923,1878,1763,2429,1407,-51.9,-42.1,10959,7477,-31.8',
      'Other charges|0|-647,-1380,-1127,-1262,-1070,65.4,-15.2,-5359,-4839,-9.7',
      "Share of associates' profit/(loss)|0|629,34,-230,-161,52,-91.7,-132.3,291,-305,-204.8",
      'Profit before tax|1|21711,23051,19648,21431,19117,-11.9,-10.8,88174,83247,-5.6',
      'Taxation|0|-2873,-7411,-6848,-260,18340,-738.4,-7153.8,-23037,3821,-116.6',
      'Profit after tax|1|18837,15640,12800,21171,37457,98.8,76.9,65136,87068,33.7',
      'EPS - Basic|0|15.69,13.03,10.66,17.63,31.2,98.9,77.0,54.3,72.5,33.7',
      'EPS - Diluted|0|15.69,13.03,10.66,17.63,31.2,98.9,77.0,54.3,72.5,33.7',
      'DPS|1|21.70,0.00,8.30,0.00,18.70,-13.0,0.0,21.70,27.00,24.0',
    ],
  },
  MEBL: {
    columns: CALENDAR_YEAR,
    rows: [
      'Mark-up/interest revenue|0|101915,102591,108355,105846,116975,14.8,10.5,209535,222821,6.3',
      'Mark-up/interest expense|0|-37957,-40119,-44114,-44415,-49611,30.7,11.7,-83794,-94026,12.2',
      'Net mark-up/interest income|1|63958,62472,64242,61431,67364,5.3,9.7,125741,128795,2.4',
      'Total non-mark-up/interest income|1|10041,13820,8139,11129,13355,33.0,20.0,19621,24484,24.8',
      ' - Fee commission and brokerage income|0|6813,7818,7908,9086,8757,28.5,-3.6,14025,17843,27.2',
      ' - Dividend income|0|116,59,148,141,114,-1.7,-19.1,173,255,47.4',
      ' - Income from dealing in foreign currencies|0|1641,2749,-510,1798,2532,54.3,40.8,3239,4330,33.7',
      ' - Gain/(loss) on sale of securities|0|658,359,-39,953,65,-90.1,-93.2,669,1018,52.2',
      ' - Other income|0|440,342,449,364,412,-6.4,13.2,804,776,-3.5',
      ' - Share of profit of associates|0|373,2493,183,-1213,1475,295.4,-221.6,711,262,-63.2',
      'Total Revenue|1|73999,76292,72381,72561,80719,9.1,11.2,145362,153280,5.4',
      'Total provisions|1|-1520,-255,-253,-449,-2155,41.8,380.0,-3378,-2604,-22.9',
      'Administrative expense|0|-16209,-26523,-23506,-23086,-22191,36.9,-3.9,-35376,-45277,28.0',
      'Other charges|0|-54,-5,-13,-1,-2,-96.3,100.0,-63,-3,-95.2',
      'Workers welfare fund|0|-1174,-1129,-1017,-965,-1176,0.2,21.9,-2218,-2141,-3.5',
      'Profit before tax|1|55042,48380,47592,48060,55196,0.3,14.8,104327,103256,-1.0',
      'Total taxation|1|-30320,-24998,-25936,-25658,-28957,-4.5,12.9,-57186,-54615,-4.5',
      'Profit after tax|1|24722,23382,21655,22402,26239,6.1,17.1,47141,48641,3.2',
      'Profit after tax a/t non-controlling interest|0|225,660,265,88,454,101.8,415.9,536,542,1.1',
      'Profit after tax a/t company owners|1|24497,22722,21390,22315,25785,5.3,15.6,46605,48100,3.2',
      'EPS - Basic|0|13.65,12.64,11.88,12.39,14.32,4.9,15.6,26.0,26.7,2.8',
      'EPS - Diluted|0|13.57,12.56,11.79,12.39,14.32,5.5,15.6,25.8,26.7,3.4',
      'DPS|0|7.00,7.00,7.00,7.50,8.00,14.0,6.0,14.00,15.50,10.0',
    ],
  },
  OGDC: {
    columns: JUNE_YEAR,
    rows: [
      'Net sales|1|90271,96192,96638,107297,149064,65.1,38.9,401178,449191,12.0',
      'Cost of sales|0|-565,-505,-579,-602,-428,-24.2,-28.9,-2228,-2114,-5.1',
      'Royalty|0|-10208,-10598,-11954,-12824,-17243,68.9,34.5,-47145,-52619,11.6',
      'Operating/field costs|0|-35217,-28803,-36932,-31002,-50956,44.7,64.4,-120197,-147693,22.9',
      'Gross profit|1|44280,56285,47173,62869,80437,81.7,27.9,231607,246764,6.5',
      'Exploration costs|0|-4096,-3082,-8817,-6004,-10878,165.6,81.2,-18767,-28781,53.4',
      'Administrative expenses|0|-1902,-2095,-2449,-2650,-3869,103.4,46.0,-7516,-11063,47.2',
      'Operating profit|1|38283,51108,35907,54216,65689,71.6,21.2,205327,206920,0.8',
      'Financial charges|0|-1332,-1221,-1201,-1392,-1286,-3.5,-7.6,-5807,-5100,-12.2',
      'Other income|0|17129,12185,14753,11563,15885,-7.3,37.4,81821,54386,-33.5',
      'Other charges|0|-2959,-3262,-2573,-3418,-4387,48.3,28.3,-14701,-13640,-7.2',
      "Share of associates' profit/(loss)|0|5093,3173,1997,3970,7452,46.3,87.7,12674,16592,30.9",
      'Profit before tax|1|56215,61982,48883,64939,83352,48.3,28.4,279315,259156,-7.2',
      'Taxation|0|-15917,-23677,-14169,-22695,43780,-375.1,-292.9,-109411,-16761,-84.7',
      'Profit after tax|1|40298,38305,34714,42244,127132,215.5,200.9,169904,242395,42.7',
      'EPS - Basic|0|9.37,8.91,8.07,9.82,29.55,215.4,200.9,39.5,56.4,42.7',
      'EPS - Diluted|0|9.37,8.91,8.07,9.82,29.55,215.4,200.9,39.5,56.4,42.7',
      'DPS|1|5.00,3.50,4.25,3.25,6.00,20.0,84.0,15.10,17.00,13.0',
    ],
  },
  PSO: {
    columns: '3QFY25,4QFY25,1QFY26,2QFY26,3QFY26,YoY(%),QoQ(%),9MFY25,9MFY26,YoY(%)',
    rows: [
      'Net sales|1|711251,812837,737186,761413,742457,4.4,-2.5,2336552,2241056,-4.1',
      'Cost of sales|0|-688729,-789421,-707135,-744362,-655939,-4.8,-11.9,-2263259,-2107436,-6.9',
      'Gross profit|1|22522,23417,30051,17051,86518,284.1,407.4,73294,133620,82.3',
      'Selling/distribution expenses|0|-5115,-6558,-4895,-5837,-5626,10.0,-3.6,-14520,-16358,12.7',
      'Administrative expenses|0|-2123,-2208,-1533,-2182,-1804,-15.0,-17.3,-5224,-5519,5.6',
      'Operating profit|1|15283,14651,23624,9031,79088,417.5,775.7,53549,111743,108.7',
      'Financial charges|0|-7665,-6854,-5953,-5446,-5887,-23.2,8.1,-26865,-17286,-35.7',
      'Other income|0|4840,6967,4556,4077,4095,-15.4,0.4,15164,12728,-16.1',
      'Other charges|0|-1199,180,-1577,-530,-12453,938.6,2249.6,-4315,-14560,237.4',
      "Share of associates' profit/(loss)|0|189,-529,-49,-14,-49,-125.9,250.0,843,-112,-113.3",
      'Profit before tax|1|11447,14417,20601,7117,64794,466.0,810.4,38376,92512,141.1',
      'Taxation|0|-7357,-8774,-11211,-4383,-38799,427.4,785.2,-23107,-54393,135.4',
      'Profit after tax|1|4090,5642,9390,2734,25995,535.6,850.8,15269,38119,149.6',
      'EPS - Basic|0|8.71,12.02,20,5.82,55.37,535.7,851.4,32.5,81.2,149.7',
      'EPS - Diluted|0|8.71,12.02,20,5.82,55.37,535.7,851.4,32.5,81.2,149.7',
      'DPS|1|0.00,10.00,0.00,0.00,0.00,0.0,0.0,0.00,0.00,0.0',
    ],
  },
  SYS: {
    columns: CALENDAR_YEAR,
    rows: [
      'Net sales|1|18660,20680,22973,23978,25738,37.9,7.3,36740,49716,35.3',
      'Cost of sales|0|-13924,-14541,-15987,-17939,-19088,37.1,6.4,-27454,-37027,34.9',
      'Gross profit|1|4735,6139,6985,6038,6650,40.4,10.1,9285,12688,36.7',
      'Selling/distribution expenses|0|-676,-769,-1029,-867,-882,30.5,1.7,-1300,-1749,34.5',
      'Administrative expenses|0|-1439,-1616,-1763,-1964,-2050,42.5,4.4,-2849,-4014,40.9',
      'Operating profit|1|2620,3754,4194,3207,3718,41.9,15.9,5136,6925,34.8',
      'Financial charges|0|-76,-80,-91,-129,-174,128.9,34.9,-166,-303,82.5',
      'Other income|0|487,-117,148,340,227,-53.4,-33.2,821,567,-30.9',
      'Other charges|0|-5,-381,-644,-91,-295,5800.0,224.2,-54,-386,614.8',
      "Share of associates' profit/(loss)|0|-47,-28,12,0,0,-100.0,0,-56,0,-100.0",
      'Profit before tax|1|2978,3148,3618,3327,3475,16.7,4.4,5682,6802,19.7',
      'Taxation|0|-328,-356,-522,-301,-451,37.5,49.8,-530,-752,41.9',
      'Profit after tax|1|2651,2792,3096,3026,3025,14.1,0.0,5152,6051,17.4',
      'Profit after tax a/t non-controlling interest|0|0,0,-1,0,0,0,0,0,0,0',
      'Profit after tax a/t company owners|1|2651,2792,3097,3026,3025,14.1,0.0,5152,6051,17.4',
      'EPS - Basic|0|1.81,1.9,2.1,2.05,1.98,9.4,-3.4,3.5,4.0,14.5',
      'EPS - Diluted|0|1.8,1.88,2.08,1.96,1.95,8.3,-0.5,3.5,3.9,11.7',
      'DPS|1|0.00,0.00,2.00,0.00,0.00,0.0,0.0,0.00,0.00,0.0',
    ],
  },
};

const kindOf = (label: string): ResultColumn['kind'] =>
  /\(%\)$/.test(label) ? 'change' : /^\dQ/.test(label) ? 'quarter' : 'todate';

function toColumns(headings: string): ResultColumn[] {
  const labels = headings.split(',');
  const kinds = labels.map(kindOf);
  const current = labels.map((_, i) => kinds[i] !== 'change' && kinds[i + 1] === 'change');
  return labels.map((label, i) => {
    const column: ResultColumn = { label, kind: kinds[i], current: current[i] };
    if (kinds[i] === 'change') {
      const period = current.lastIndexOf(true, i);
      const base = period - (kinds[period] === 'quarter' && label.startsWith('YoY') ? 4 : 1);
      if (period >= 0 && base >= 0) column.compares = { period: labels[period], base: labels[base] };
    }
    return column;
  });
}

const measureOf = (label: string): ResultMeasure =>
  /^EPS\b/i.test(label) ? 'eps' : /^DPS\b/i.test(label) ? 'dps' : 'amount';

/** A number, or null for anything the feed left blank or unreadable. */
function toValue(raw: string): number | null {
  const text = raw.trim();
  const value = Number(text);
  return text === '' || !Number.isFinite(value) ? null : value;
}

function toRow(line: string): ResultRow {
  const [label, bold, values] = line.split('|');
  const name = label.trim();
  return { label: name, bold: bold === '1', measure: measureOf(name), values: values.split(',').map(toValue) };
}

export async function fetchCompanies(): Promise<Company[]> {
  return COMPANIES;
}

/** The company's latest result, or null when the ticker is not listed. */
export async function fetchLatestResult(ticker: string): Promise<LatestResult | null> {
  const company = COMPANIES.find((c) => c.ticker === ticker.trim().toUpperCase());
  const feed = company && FEED[company.ticker];
  if (!company || !feed) return null;
  const price = PRICES[company.ticker];
  return {
    company,
    statement: STATEMENT,
    units: UNITS,
    price: price ? { ...price, asOf: PRICE_DATE } : null,
    columns: toColumns(feed.columns),
    rows: feed.rows.map(toRow),
    source: null,
  };
}
