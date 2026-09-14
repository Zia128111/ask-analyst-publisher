import { figure, isoDate, list, text, webLink } from './feedValues';
import type {
  BriefingCommodity,
  BriefingCurrency,
  BriefingIndex,
  BriefingNet,
  BriefingSector,
  BriefingStory,
  MorningBriefing,
} from './types';

/* ============================================================================
 * MORNING BRIEFING
 * ============================================================================
 * The ONLY file that knows where the Morning Briefing comes from: the live
 * feed the live page reads, api.askanalyst.com.pk/api/morningbriefingchart —
 * the first publication here connected to its feed (the user: "News will
 * come from api"). Read on the server, so the news is in the page's HTML, and
 * kept for REFRESH_SECONDS before the feed is asked again. If the feed cannot
 * be read, or answers in a shape this does not know, the page shows the copy
 * transcribed below on 11 September 2026 and says so in the server log.
 *
 * THE FEED, as it answers:
 *
 *   date2   "11 September, 2026", the briefing's day (the letterhead's date)
 *   date    "2026-09-10", the session the market tables are for
 *   news    the stories: title, description, link, position (their order),
 *           and sector / type / classification, which the page does not print
 *   net     the Net LIPI/FIPI Position: label, value (the day, USD mn), cy
 *   sector  the foreign investors' net by sector; the live page leaves out
 *           Cement and Fertilizer, and so does this
 *   indices label, value (a string), change, fytd, cytd (percent); the live
 *           page leaves out the Dow Jones, and so does this
 *   commodities  label, unit, value (a string), change (percent)
 *   currency     label ("USD", read "PKR/USD"), value (a string), change,
 *                cytd (percent)
 *   announcement, pdf   not printed (the page makes its own PDF)
 * ========================================================================= */

const FEED_URL = 'https://api.askanalyst.com.pk/api/morningbriefingchart';

/** A briefing is published once a day; five minutes old is fresh enough. */
const REFRESH_SECONDS = 300;
/** Past this, the page does not wait for the feed. */
const FEED_TIMEOUT_MS = 8000;

/** Sectors and indices the live page leaves out of its tables. */
const HIDDEN_SECTORS = new Set(['Cement', 'Fertilizer']);
const HIDDEN_INDICES = new Set(['DOW JONES']);

interface FeedStory {
  id: number;
  title: string;
  description: string;
  link: string | null;
  position: number;
}

interface Feed {
  date: string;
  date2: string;
  news: FeedStory[];
  net: { label: string; value: number; cy: number }[];
  sector: { label: string; value: number }[];
  indices: { label: string; value: string; change: number; fytd: number; cytd: number }[];
  commodities: { label: string; unit: string; value: string; change: number }[];
  currency: { label: string; value: string; change: number; cytd: number }[];
}

/* The feed as it answered on 11 September 2026, less the fields the page does
   not print (each story's sector, type, classification and timestamps). */
const FIXTURE: Feed = {
  date: '2026-09-10',
  date2: '11 September, 2026',
  news: [
    {
      id: 7626,
      title: 'SBP-held FX reserves surge USD 1.21Bn to USD 18.33Bn',
      description:
        'Foreign exchange reserves held by the State Bank of Pakistan (SBP) increased by USD 1.21Bn to USD 18.33Bn during the week ended September 4, 2026, mainly due to the receipt of government commercial loan proceeds.',
      link: 'https://www.brecorder.com/news/40438880/sbp-held-foreign-exchange-reserves-surge-121bn-to-1833bn',
      position: 1,
    },
    {
      id: 7627,
      title: 'IMF mission due on Sept 23 for biannual review',
      description:
        "An International Monetary Fund (IMF) mission is due to visit Pakistan on September 23 for a biannual review of the country's economic performance and implementation of the USD 7Bn Extended Fund Facility (EFF) and the USD 1.4Bn Resilience and Sustainability Facility (RSF) for the period ending June 30, 2026.",
      link: 'https://www.dawn.com/news/2028892/imf-mission-due-on-sept-23-for-biannual-review-of-pakistans-economic-performance',
      position: 2,
    },
    {
      id: 7628,
      title: 'PM approves targets to speed up trade, cargo clearance',
      description:
        'Prime Minister Shehbaz Sharif on Thursday approved targets for speeding up trade and cargo clearance, including achieving 30 per cent pre-arrival clearance and increasing the share of cargo processed through the green channel to 65 per cent by the end of the current financial year.',
      link: 'https://epaper.brecorder.com/2026/09/11/1-page/1119030-news.html',
      position: 3,
    },
    {
      id: 7629,
      title: 'SBP buys back PKR 585.36Bn of five-year floating PIBs',
      description:
        'In a move to proactively manage public debt, the State Bank of Pakistan (SBP) on Thursday conducted buy-back auction and accepted bids worth PKR 585.36Bn of five-year Pakistan Investment Bonds (PIBs) Floating Rate (PFL).',
      link: 'https://epaper.brecorder.com/2026/09/11/1-page/1119038-news.html',
      position: 4,
    },
    {
      id: 7630,
      title: 'Pakistan to expand USD 6.5Bn pipeline of 38 PPP projects',
      description:
        'Pakistan is set to expand its USD 6.5Bn pipeline of 38 public-private partnership (PPP) projects, as the government moves to unlock private and overseas Pakistani capital for major infrastructure schemes amid growing financing needs.',
      link: 'https://epaper.brecorder.com/2026/09/11/1-page/1119034-news.html',
      position: 5,
    },
    {
      id: 7631,
      title: 'Vessel carrying Qatari LNG arrives at Port Qasim',
      description:
        'A cargo ship carrying around 82,000 tonnes of liquefied natural gas (LNG) from Qatar arrived in Pakistan through the near-closed Strait of Hormuz, reported Anadolu news agency on Thursday.',
      link: 'https://www.dawn.com/news/2029001/vessel-carrying-qatari-lng-arrives-at-port-qasim',
      position: 6,
    },
    {
      id: 7632,
      title: 'Govt to cut HSD refining margin cap to USD 30',
      description:
        'The government has decided to reduce the maximum refining crack margin for high-speed diesel (HSD) from USD 41 to USD 30 per barrel during periods of market volatility, while retaining the existing petrol pricing formula.',
      link: 'https://e.thenews.pk/detail/?id=506611',
      position: 7,
    },
    {
      id: 7633,
      title: 'British firm expresses interest in power transmission',
      description:
        "British International Investment (BII) is exploring fresh private-sector investment in Pakistan's power transmission network, as the government rolls out an 8-to-10-year plan to modernise the national grid and drive the energy transition.",
      link: 'https://e.thenews.pk/detail/?id=506610',
      position: 8,
    },
  ],
  net: [
    { label: 'Foreign', value: -0.2921620000000248, cy: -587.8746041056694 },
    { label: 'Individuals', value: 1.2147420108292517, cy: 179.91873504480463 },
    { label: 'Companies', value: 1.521587000000497, cy: 520.3301555947546 },
    { label: 'Banks/DFIs', value: 12.333178003610108, cy: -41.95629302496915 },
    { label: 'MF', value: -2.573025014439745, cy: 26.288715708336895 },
    { label: 'Broker', value: -0.026932007235929256, cy: -27.536996493095607 },
    { label: 'Insurance', value: -12.109492999999983, cy: -95.79058810772909 },
  ],
  sector: [
    { label: 'Cement', value: -0.03162599638989688 },
    { label: 'Fertilizer', value: 0.081954 },
    { label: 'E&P', value: -0.34133000000000013 },
    { label: 'OMC', value: -0.26622100000000004 },
    { label: 'Banks', value: -0.2512860036101051 },
    { label: 'Tech', value: -0.08697999999999996 },
  ],
  indices: [
    { label: 'KSE-100', value: '168865.04', change: -1.7904418536335065, fytd: -8.250503531375418, cytd: -2.9812357084582852 },
    { label: 'SENSEX', value: '74902.59', change: 0.18506176014920772, fytd: -2.6260799161339277, cytd: -12.10782553595945 },
    { label: 'Nikkei 225', value: '65270.95', change: 0.1967524259787412, fytd: -7.384197167334339, cytd: 29.66278630882615 },
    { label: 'Hang Seng', value: '24954.47', change: -1.2680138761841708, fytd: 9.061877486230951, cytd: -2.639499044126248 },
    { label: 'S & P 500', value: '7591.7', change: -0.5848336118255304, fytd: 1.3615996325630375, cytd: 10.892491966111596 },
    { label: 'FTSE 100', value: '10617.21', change: -0.49531117913114153, fytd: 1.5918322433103427, cytd: 7.028326612903224 },
    { label: 'DOW JONES', value: '52064.1', change: -0.6043451915268006, fytd: -0.6788446001951498, cytd: 8.324045232858591 },
  ],
  commodities: [
    { label: 'Wti', unit: 'USD/bbl', value: '100.08', change: 3.882084284824572 },
    { label: 'Brent', unit: 'USD/bbl', value: '105.54', change: 4.319462291193044 },
    { label: 'Coal', unit: 'USD/ton', value: '139.75', change: 0 },
    { label: 'Gold', unit: 'USD/oz', value: '4398.1', change: -1.088496570336206 },
    { label: 'Silver', unit: 'USD/oz', value: '64.97', change: -4.610189399500808 },
    { label: 'Rubber', unit: 'USD/kg', value: '2.5', change: 0.40160642570279403 },
  ],
  currency: [
    { label: 'USD', value: '277.3522', change: -0.004470649823373751, cytd: -0.9891722603384112 },
    { label: 'JPY', value: '1.8056', change: -0.07194642758314718, cytd: 0.9166107757657249 },
    { label: 'THB', value: '8.4276', change: -0.09602048437000743, cytd: -5.125578358418981 },
  ],
};

/* ----------------------------------------------------------------------------
 * Normalising — every field checked, so a feed that changes shape falls back
 * to the copy rather than rendering undefined.
 * ------------------------------------------------------------------------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "11 September, 2026" -> "2026-09-11". */
function isoFromLong(text: string): string {
  const match = /^(\d{1,2}) ([A-Za-z]+),? (\d{4})$/.exec(text.trim());
  const index = match ? MONTHS.findIndex((m) => match[2].startsWith(m)) : -1;
  if (!match || index < 0) throw new Error(`Unrecognised date "${text}"`);
  return `${match[3]}-${String(index + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
}

function normalise(feed: Feed): MorningBriefing {
  const stories: BriefingStory[] = list<FeedStory>(feed.news)
    .map((s, i) => ({ s, order: figure(s.position) ?? i }))
    .sort((a, b) => a.order - b.order)
    .map(({ s }) => ({ id: figure(s.id) ?? 0, title: text(s.title), summary: text(s.description), link: webLink(s.link) }))
    .filter((s) => s.title || s.summary);

  const net: BriefingNet[] = list<Feed['net'][number]>(feed.net).map((r) => ({
    label: text(r.label),
    day: figure(r.value),
    cytd: figure(r.cy),
  }));

  const sectors: BriefingSector[] = list<Feed['sector'][number]>(feed.sector)
    .filter((r) => !HIDDEN_SECTORS.has(text(r.label)))
    .map((r) => ({ label: text(r.label), net: figure(r.value) }));

  const indices: BriefingIndex[] = list<Feed['indices'][number]>(feed.indices)
    .filter((r) => !HIDDEN_INDICES.has(text(r.label)))
    .map((r) => ({
      label: text(r.label),
      value: figure(r.value),
      change: figure(r.change),
      fytd: figure(r.fytd),
      cytd: figure(r.cytd),
    }));

  const commodities: BriefingCommodity[] = list<Feed['commodities'][number]>(feed.commodities).map((r) => ({
    label: text(r.label),
    unit: text(r.unit),
    price: figure(r.value),
    change: figure(r.change),
  }));

  const currencies: BriefingCurrency[] = list<Feed['currency'][number]>(feed.currency).map((r) => ({
    pair: `PKR/${text(r.label)}`,
    close: figure(r.value),
    change: figure(r.change),
    cytd: figure(r.cytd),
  }));

  return {
    asOf: isoFromLong(text(feed.date2)),
    marketsAsOf: isoDate(text(feed.date)),
    stories,
    net,
    sectors,
    indices,
    commodities,
    currencies,
  };
}

export async function fetchMorningBriefing(): Promise<MorningBriefing> {
  try {
    const response = await fetch(FEED_URL, {
      headers: { accept: 'application/json' },
      next: { revalidate: REFRESH_SECONDS },
      signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`the feed answered ${response.status}`);
    return normalise((await response.json()) as Feed);
  } catch (error) {
    console.warn(
      `Morning Briefing: showing the copy of ${FIXTURE.date2}, because the live feed could not be read ` +
        `(${error instanceof Error ? error.message : String(error)}).`,
    );
    return normalise(FIXTURE);
  }
}
