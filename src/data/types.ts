/* ============================================================================
 * WIRE TYPES
 * ============================================================================
 * The shapes a real feed will return. Numeric fields are `number | null`,
 * never a pre-formatted string and never `undefined`: `null` means the source
 * did not publish the value and renders as NOT_AVAILABLE (an em dash).
 * ========================================================================= */

/** A masthead a publication goes out under. Each is a URL segment. */
export interface Edition {
  slug: string;
  label: string;
  /** Publications this edition carries, in navigation order. */
  publications: string[];
}

/** One entry in the publication navigation. */
export interface Publication {
  slug: string;
  label: string;
  /** The report's full title, used on the sheet and in the page title. */
  title: string;
}

/** A group in the publication sidebar. The sidebar picks each group's icon. */
export type NavGroupId = 'market' | 'research' | 'companies' | 'economy' | 'sector';

export interface NavGroup {
  id: NavGroupId;
  label: string;
  /** Publication slugs, in the sidebar's order. */
  publications: string[];
}

/** A group as the sidebar draws it for one edition: its publications resolved. */
export interface NavSection {
  id: NavGroupId;
  label: string;
  publications: Publication[];
}

/** The legal entity that publishes every report, printed on the letterhead. */
export interface Publisher {
  name: string;
}

/**
 * The brand a report sheet is printed under, chosen with the toggle above
 * the sheet. Each has its own logo; the Alpha Capital one carries both SECP
 * registrations inside the artwork. Akseer's bilingual logo heads KSA's
 * reports.
 */
export type Masthead = 'alphacapital' | 'askanalyst' | 'akseer';

/**
 * What the masthead toggle can print a sheet under: a built-in masthead, or
 * the company logo uploaded in the account drawer's Report style.
 */
export type MastheadChoice = Masthead | 'custom';

/**
 * One row of the Margin Trading System position report.
 *
 * Volumes and values are published IN MILLIONS, and the column headers carry
 * the unit, so these fields hold millions rather than raw shares and rupees.
 * The suffix on each name says so, so nobody multiplies twice.
 */
export interface MtsRow {
  symbol: string;
  currentVolumeMn: number | null;
  currentValuePkrMn: number | null;
  /** Financing rate, in percent: 14.1 means 14.1%. */
  mtsRatePct: number | null;
  openVolumeMn: number | null;
  openValuePkrMn: number | null;
  /**
   * Published under a second "Symbol" heading at the far end of the table.
   * Every row on the source page reads "A", and the page does not say what it
   * encodes, so it is carried through verbatim rather than interpreted.
   */
  trailingSymbol: string | null;
}

export interface MtsReport {
  /** The trading session the positions are as of. ISO date, PKT. */
  asOf: string;
  /** Attribution printed at the foot of the sheet. */
  source: string;
  rows: MtsRow[];
}

/** A listed company, as the Latest Result page's company search lists it. */
export interface Company {
  /** The feed's own id for the company. */
  id: number;
  /** PSX symbol, e.g. "LUCK". Also the page's `?company=` parameter. */
  ticker: string;
  name: string;
  /** PSX sector, in the feed's words, e.g. "CEMENT". */
  sector: string;
}

/**
 * A column of a company's result table, headed as the feed heads it.
 *
 *   quarter  one quarter's figures ("4QFY26")
 *   todate   the year, half or nine months to date ("FY26", "1HCY26", "9MFY26")
 *   change   the percentage change between two of those ("YoY(%)", "QoQ(%)")
 */
export interface ResultColumn {
  label: string;
  kind: 'quarter' | 'todate' | 'change';
  /** The period the result is FOR: the latest quarter and the period to date. */
  current: boolean;
  /** For a change column: the period it measures and the one it compares with. */
  compares?: { period: string; base: string };
}

/** What a row measures, which sets its precision: PKR millions, or rupees a share. */
export type ResultMeasure = 'amount' | 'eps' | 'dps';

export interface ResultRow {
  label: string;
  /** Totals and subtotals, set in bold as the feed marks them. */
  bold: boolean;
  measure: ResultMeasure;
  /** One per column, in column order. Changes are in percent: 14.7 means 14.7%. */
  values: (number | null)[];
}

export interface SharePrice {
  /** Closing price, PKR. */
  close: number | null;
  /** Change on the previous close, PKR. */
  change: number | null;
  /** The same change in percent: -1.76 means -1.76%. */
  changePct: number | null;
  /** The session the price is for. ISO date, PKT. */
  asOf: string;
}

/**
 * A column of a MONTHLY table — the shape BOP, OMC sales and the other
 * month-by-month reports share: the same month a year ago, last month and
 * this month, the change on the month and on the year, and from the second
 * month of a fiscal year the year to date then and now and its change.
 * Headed as the feed heads it.
 *
 *   amount  a figure for a period, in the report's unit: a month ("Jul-26",
 *           "Aug-2026") or a fiscal year to date ("2MFY27")
 *   change  the percentage change between two of those ("MoM", "YoY")
 */
export interface MonthlyColumn {
  label: string;
  kind: 'amount' | 'change';
  /** The period the report is FOR: the latest month, and the year to date. */
  current: boolean;
  /** For a change column: the period it measures and the one it compares with. */
  compares?: { period: string; base: string };
}

/**
 * A monthly table's figure. Amounts are in the report's unit; changes are
 * percent, -60 meaning -60%. 'NM' is a published value of its own — "not
 * meaningful", where the base is negative, zero or too small for a
 * percentage to mean anything — and is not the same as a missing figure
 * (null).
 */
export type MonthlyValue = number | 'NM' | null;

export interface MonthlyRow {
  label: string;
  /** Totals and balances, set in bold as the live page sets them. */
  bold: boolean;
  /**
   * The total a line belongs to, when its label alone is ambiguous: "MS" is
   * PSO's motor spirit or Shell's, "Exports" goods or services. Read before
   * the label by screen readers; not printed.
   */
  group?: string;
  /**
   * Steps in from the labels' edge, where the feed indents a line that
   * details the one above it (the trade feeds' `step`: Textile's cotton
   * cloth, knitwear …). None is flush.
   */
  indent?: number;
  /** A section's name over the lines that follow ("Exports", "Imports"): a row with no figures. */
  heading?: boolean;
  /** A blank line the feed puts between sections (msg/trade's, before the imports): no label, no figures. */
  spacer?: boolean;
  /** One per column, in column order. */
  values: MonthlyValue[];
}

/** A monthly report's table, under the publisher's letterhead. */
export interface MonthlyReport {
  /** The day the report is published. ISO date, PKT. */
  asOf: string;
  /** The table's first heading, the unit of every amount: "(USD mn)", "K Tonnes". */
  units: string;
  columns: MonthlyColumn[];
  rows: MonthlyRow[];
  /** Decimal places the feed publishes its changes to: whole percent (BOP, OMC) unless set. */
  changeDecimals?: number;
  /** Attribution printed at the foot of the sheet. */
  source: string;
}

/** One month of the chart's series. */
export interface BopMonth {
  /** ISO year and month, "2026-07". */
  month: string;
  /** As the feed heads it: "Jul-26". */
  label: string;
  /** The current account balance for the month, USD millions. */
  balance: number | null;
}

/** External Account Highlights: the balance of payments for the latest month. */
export interface BopReport extends MonthlyReport {
  /** The current account balance by month, oldest first, for the chart. */
  history: BopMonth[];
}

/** One month of the workers' remittances chart. */
export interface RemittanceMonth {
  /** ISO year and month, "2026-08". */
  month: string;
  /** As the feed labels it: "Aug-26". */
  label: string;
  /** Workers' remittances that month, USD millions. */
  total: number | null;
  /** The change on the same month a year before, percent; null where the feed has no year before. */
  yoy: number | null;
}

/** Workers' remittances: the month by country, and the months before it for the chart. */
export interface RemittanceReport extends MonthlyReport {
  /** Every month the feed sends, oldest first. */
  history: RemittanceMonth[];
}

/** A price's history, week by week: one region's cement price. */
export interface PriceSeries {
  /** "North Region" */
  label: string;
  /** Oldest first. */
  points: {
    /** ISO date, "2026-09-10". */
    date: string;
    /** As the feed labels it: "10-Sep-26". */
    label: string;
    value: number | null;
  }[];
}

/** Cement Price History: the latest weeks by region in the table, the year's weeks in the chart. */
export interface CementReport extends MonthlyReport {
  /** Each region's prices, every week the feed sends. */
  series: PriceSeries[];
}

/** A part of the exchange-rate table: the current date's rates, the previous date's, or the change. */
export interface RatesSection {
  /** "Current Date", "Previous Date", "Change". */
  label: string;
  /** Rates (rupees a unit, four decimals) or changes (rupees, two). */
  kind: 'rate' | 'change';
  /** "Buying", "Selling": one figure per currency, in the report's order. */
  rows: { label: string; values: (number | null)[] }[];
}

/** Weighted average exchange rates: buying and selling, two dates and the change. */
export interface CurrencyReport {
  /** The rates' date. ISO date, PKT. */
  asOf: string;
  /** The currencies, in the table's order: "CNY" … "USD". */
  currencies: string[];
  sections: RatesSection[];
  /** Attribution printed at the foot of the sheet. */
  source: string;
}

/** One of the day's most traded stocks, and how its trades settled (NCCPL). */
export interface SettlementLine {
  symbol: string;
  /** Shares traded, millions. */
  volume: number | null;
  /** Value traded, PKR millions. */
  value: number | null;
  /** Settlement under UIN and under CM, percent, as published. */
  uin: number | null;
  cm: number | null;
}

/** Settlement of the top 10 traded stocks, by volume. */
export interface SettlementReport {
  /** The trading day it covers. ISO date, PKT. */
  asOf: string;
  lines: SettlementLine[];
  /** Attribution printed at the foot of the sheet. */
  source: string;
}

/**
 * One line of the Portfolio Investment (FIPI / LIPI) tables: an investor
 * type, a net total or a period to date. USD millions, as published: sales
 * are negative, so buy + sell = net.
 */
export interface PortfolioLine {
  label: string;
  /** The net totals, LIPI Net and FIPI Net, set in bold as the live page sets them. */
  bold: boolean;
  /**
   * What the line is part of, when its label alone does not say: "FIPI" for
   * the periods to date (WTD, MTD …), which are the foreign investors'. Read
   * before the label by screen readers; not printed.
   */
  group?: string;
  buy: number | null;
  sell: number | null;
  net: number | null;
  /** The net by sector, one per `PortfolioReport.sectors`; empty where a table has no sectors. */
  sectors: (number | null)[];
}

/** One bar of the Portfolio Investment chart: an investor type's net, USD millions. */
export interface PortfolioBar {
  label: string;
  net: number | null;
}

/** The day's portfolio investment by local (LIPI) and foreign (FIPI) investors. */
export interface PortfolioReport {
  /** The session the flows are for. ISO date, PKT. */
  asOf: string;
  /** The sectors, as the feed names them: "Cement", "E&P". */
  sectors: string[];
  /**
   * The main table: each local investor type and their net (LIPI Net), each
   * foreign one and theirs (FIPI Net), then the foreign net for the week,
   * month, calendar year and fiscal year to date.
   */
  lines: PortfolioLine[];
  /** The second table: the day's flows by investor type, foreign first, without the sectors. */
  summary: PortfolioLine[];
  /** The chart: the foreign net, then each local investor type's. */
  chart: PortfolioBar[];
  /** Attribution printed at the foot of the sheet. */
  source: string;
}

/** One story in the Morning Briefing. */
export interface BriefingStory {
  id: number;
  title: string;
  /** One paragraph. */
  summary: string;
  /** The full story on its publisher's site; http(s) only, else null. */
  link: string | null;
}

/** A row of the Net LIPI/FIPI Position table: the day's net and the calendar year's, USD millions. */
export interface BriefingNet {
  label: string;
  day: number | null;
  cytd: number | null;
}

/** A row of the FIPI Sector-wise table: the foreign investors' net in a sector, USD millions. */
export interface BriefingSector {
  label: string;
  net: number | null;
}

/** A row of the Major Indices table. Changes in percent: -1.79 means -1.79%. */
export interface BriefingIndex {
  label: string;
  value: number | null;
  change: number | null;
  fytd: number | null;
  cytd: number | null;
}

/** A row of the Commodities table. The change in percent. */
export interface BriefingCommodity {
  label: string;
  /** "USD/bbl" */
  unit: string;
  price: number | null;
  change: number | null;
}

/** A row of the Inter-Bank Currency Rates table: rupees per unit. Changes in percent. */
export interface BriefingCurrency {
  /** "PKR/USD" */
  pair: string;
  close: number | null;
  change: number | null;
  cytd: number | null;
}

/** The day's Morning Briefing: the news, and the markets of the session before. */
export interface MorningBriefing {
  /** The day the briefing is published. ISO date, PKT. */
  asOf: string;
  /** The session its market tables are for, usually the working day before. ISO date. */
  marketsAsOf: string;
  stories: BriefingStory[];
  net: BriefingNet[];
  sectors: BriefingSector[];
  indices: BriefingIndex[];
  commodities: BriefingCommodity[];
  currencies: BriefingCurrency[];
}

/** How a KSA topic's reading is set: the positive or negative colour, or the text's. */
export type TopicTone = 'positive' | 'negative' | 'neutral';

/** One topic in KSA's Morning Briefing. */
export interface BriefingTopic {
  id: number;
  title: string;
  /** "Economy", "Real Estate Mgmt & Dev't". */
  category: string;
  /** The reading for the market, in the feed's own word: "Positive", "Negative", "Neutral". */
  sentiment: string;
  /** How that word is set; a word the page does not know reads neutral. */
  tone: TopicTone;
  /** The story on its publisher's site; http(s) only, else null. */
  link: string | null;
}

/** KSA's Morning Briefing: the day's topics, each with its category and its reading. */
export interface KsaMorningBriefing {
  /** The briefing's day. ISO date. */
  asOf: string;
  topics: BriefingTopic[];
}

/** One company's latest published result, with its share price. */
export interface LatestResult {
  company: Company;
  /** The table's first heading: "P&L Summary". */
  statement: string;
  /** The units line under the company name. */
  units: string;
  price: SharePrice | null;
  columns: ResultColumn[];
  rows: ResultRow[];
  /** Attribution printed at the foot of the sheet. The feed gives none today. */
  source: string | null;
}
