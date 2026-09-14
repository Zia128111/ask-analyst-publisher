import { DEFAULT_STYLE, type Branding } from './types';

/* ============================================================================
 * PLACEMENT — which Report style settings a report offers, and where they land
 * ============================================================================
 * The Report style is kept once for the account, but the reports are laid
 * out differently, and each offers its own set of settings:
 *
 *   MTS (and every report without an entry) offers them all: the company
 *   name on its publisher band, the logo, typeface, text size, rules, the
 *   fill of its bands and header, and the source line.
 *
 *   LATEST RESULT offers only the logo, the border colour, the row fills
 *   (the header row's fill, and the highlight on the latest quarter and
 *   period to date in every row), the typeface and the text size — the
 *   user's list for this screen. It prints no source line and no publisher
 *   name, whatever another report has set.
 *
 *   BOP offers Latest Result's list and four more, the user's additions:
 *   the company name on its publisher band (it has MTS's letterhead), the
 *   colour of negative figures, and the chart's bar and line colours. Its
 *   fill is the bands and the header, as on MTS.
 *
 *   OIL MARKETING offers what its screen shows (the user left it to the
 *   screen): MTS's list — company name, logo, typeface, text size, rules,
 *   fill, source, whose line names the publisher — and the highlight on its
 *   current month and year to date. No negative figures colour (sales are
 *   never negative, and the live page colours no change) and no chart.
 *
 *   PORTFOLIO INVESTMENT offers what its screen shows, by the same rule:
 *   MTS's list, the highlight (the main table's Net column) and the chart's
 *   bar colour. Its fill is the letterhead's bands and both tables' headers.
 *   No negative figures colour (the live page prints them in black) and no
 *   line colour (its chart has none). Its colours default as every other
 *   sheet's do — the brand tint, the highlight following the fill — not the
 *   live page's dark blue and grey (the user's call, 2026-09-11).
 *
 *   MORNING BRIEFING offers what its sheet shows (the user: "update it
 *   according to screen"): the logo, the typeface and text size — of the
 *   news and the tables alike — the rules (the title's and the tables'; the
 *   title and the tables' names take the colour too where it reads as text)
 *   and the fill of the tables' striped rows. Its header is the benchmark's —
 *   date, logo, title — with no publisher band, so no company name; no
 *   highlight (no column is current), no negative colour (printed as the
 *   text), no chart and no source line (every story links its own source).
 *
 *   KSA'S MORNING BRIEFING, a report of its own, offers only the logo, the
 *   heading colour and the tag colour — the user's list for this screen
 *   (2026-09-14). Its header is the benchmark's (the KSA tag, the date, the
 *   title and Akseer's logo) over a table of topics whose look stays the
 *   system's. It is found by edition as well as by name
 *   (`ksa/morning-briefing`), since the other editions' Morning Briefing is
 *   another sheet, and its fields sit under "Header" in the drawer.
 *
 *   TRADE-PBS offers what its screen shows (the user: "Adjust drawer filters
 *   accordingly"): MTS's list — company name, logo, typeface, text size,
 *   rules, the fill of the bands and header, and the source, whose line
 *   names the publisher. Its table sets nothing else off, as the live page:
 *   no highlight (no column is tinted), no negative figures colour (the
 *   deficit prints in the text colour) and no chart.
 *
 *   TRADE-SBP offers what its screen shows, by the same rule: Oil
 *   Marketing's list — MTS's and the highlight, for this month and the year
 *   to date, which its live page tints. No negative figures colour (its
 *   amounts are never negative) and no chart.
 *
 *   REMITTANCE offers what its screen shows: MTS's list, the highlight (its
 *   current month, which the live page tints) and, under Chart, the bar and
 *   line colours of its two panels. No negative figures colour (the
 *   amounts are never negative).
 *
 *   CENTRAL GOVERNMENT DEBT offers what its screen shows: Oil Marketing's
 *   list — MTS's and the highlight on its current month, which the live
 *   page tints. No negative figures colour (none) and no chart.
 *
 *   FERTILIZER offers what its screen shows: Oil Marketing's list — MTS's
 *   and the highlight on its month and calendar year to date, which the
 *   live page tints.
 *
 *   CEMENT offers what its screen shows: MTS's list. Nothing in its table
 *   is tinted, and its chart's two lines take the system's palette in its
 *   fixed order — the drawer's bar and line colours are one each — so no
 *   highlight and no Chart group.
 *
 *   SETTLEMENT offers what its screen shows: MTS's list — its sheet has the
 *   publisher band, the logo, the rules, the tinted bands and header and a
 *   source line naming the publisher. No highlight (no column is tinted),
 *   no negative figures colour (none is negative) and no chart.
 *
 *   CURRENCY offers what its screen shows: MTS's list and the highlight on
 *   the USD column, which the live page tints. No negative figures colour
 *   (the changes print in the text colour, as live) and no chart.
 *
 *   AUTO offers what its screen shows: Oil Marketing's list — MTS's and the
 *   highlight on its current month, which the live page tints. No negative
 *   figures colour (falls print in the text colour, as live) and no chart.
 *
 * The account drawer shows only the settings the report in view offers, each
 * explained for that report, and Reset style resets only those. The report
 * applies only those too (`styleOnReport`), so nothing on a sheet comes from
 * a setting its drawer does not show. The company name still names an
 * uploaded logo everywhere: it belongs to the logo, not to the style.
 *
 * Adding a publication whose sheet differs from MTS = an entry here.
 * ========================================================================= */

export type StyleSetting =
  | 'company'
  | 'logo'
  | 'font'
  | 'size'
  | 'rule'
  | 'fill'
  | 'highlight'
  | 'negative'
  | 'bar'
  | 'line'
  | 'heading'
  | 'tag'
  | 'source';

export interface Placement {
  /** The settings this report offers. */
  offers: ReadonlySet<StyleSetting>;
  /** What each setting does on this report: its info tooltip. */
  describe: Readonly<Record<StyleSetting, string>>;
  /** The heading over the report's own fields in the drawer; "Table" where unset. */
  group?: string;
}

/*
 * One plain line per setting, saying what it changes on the report — the
 * user's ask, when the tooltips had grown into paragraphs of how and why.
 * Short enough to sit on one line of the tooltip. A report replaces only the
 * lines that differ on its sheet.
 */
const EXPLAIN: Record<StyleSetting, string> = {
  size: 'Sets the size of the table’s text.',
  logo: 'Adds your logo to the top of the report.',
  company: 'Shows your company name on the report.',
  font: 'Sets the font for the whole report.',
  rule: 'Colours the lines in the table.',
  fill: 'Fills the title bars and the table header.',
  highlight: 'Fills the columns with the latest figures.',
  negative: 'Colours the negative figures in the table.',
  bar: 'Colours the bars in the chart.',
  line: 'Colours the line in the chart.',
  heading: 'Colours the report’s title.',
  tag: 'Fills the tag beside the date.',
  source: 'Sets the source line under the report.',
};

const GENERAL: Placement = {
  offers: new Set(['company', 'logo', 'font', 'size', 'rule', 'fill', 'source']),
  describe: EXPLAIN,
};

const PLACEMENTS: Record<string, Placement> = {
  'latest-result': {
    offers: new Set(['logo', 'font', 'size', 'rule', 'fill', 'highlight']),
    describe: { ...EXPLAIN, fill: 'Fills the table’s header row.' },
  },
  bop: {
    offers: new Set(['company', 'logo', 'font', 'size', 'rule', 'fill', 'highlight', 'negative', 'bar', 'line']),
    describe: EXPLAIN,
  },
  'oil-marketing': {
    offers: new Set(['company', 'logo', 'font', 'size', 'rule', 'fill', 'highlight', 'source']),
    describe: EXPLAIN,
  },
  'portfolio-investment': {
    offers: new Set(['company', 'logo', 'font', 'size', 'rule', 'fill', 'highlight', 'bar', 'source']),
    describe: {
      ...EXPLAIN,
      fill: 'Fills the title bars and the table headers.',
      highlight: 'Fills the first table’s Net column.',
    },
  },
  'morning-briefing': {
    offers: new Set(['logo', 'font', 'size', 'rule', 'fill']),
    describe: {
      ...EXPLAIN,
      size: 'Sets the size of the news and the tables.',
      rule: 'Colours the lines and the headings.',
      fill: 'Fills every other row of the tables.',
    },
  },
  'ksa/morning-briefing': {
    offers: new Set(['logo', 'heading', 'tag']),
    group: 'Header',
    describe: {
      ...EXPLAIN,
      logo: 'Replaces the Akseer logo at the top.',
      heading: 'Colours the Morning Briefing title.',
      tag: 'Fills the KSA tag beside the date.',
    },
  },
  'trade-pbs': GENERAL,
  'trade-sbp': {
    offers: new Set(['company', 'logo', 'font', 'size', 'rule', 'fill', 'highlight', 'source']),
    describe: EXPLAIN,
  },
  settlement: GENERAL,
  cement: GENERAL,
  remittance: {
    offers: new Set(['company', 'logo', 'font', 'size', 'rule', 'fill', 'highlight', 'bar', 'line', 'source']),
    describe: EXPLAIN,
  },
  'central-government-debt': {
    offers: new Set(['company', 'logo', 'font', 'size', 'rule', 'fill', 'highlight', 'source']),
    describe: EXPLAIN,
  },
  fertilizer: {
    offers: new Set(['company', 'logo', 'font', 'size', 'rule', 'fill', 'highlight', 'source']),
    describe: EXPLAIN,
  },
  currency: {
    offers: new Set(['company', 'logo', 'font', 'size', 'rule', 'fill', 'highlight', 'source']),
    describe: { ...EXPLAIN, highlight: 'Fills the USD column.' },
  },
  auto: {
    offers: new Set(['company', 'logo', 'font', 'size', 'rule', 'fill', 'highlight', 'source']),
    describe: EXPLAIN,
  },
};

/**
 * The report in view's placement: its edition's own entry where there is
 * one (`ksa/morning-briefing`), else the report's, else MTS's.
 */
export const placementFor = (publication: string | null | undefined, edition?: string | null): Placement =>
  (publication
    ? ((edition ? PLACEMENTS[`${edition}/${publication}`] : undefined) ?? PLACEMENTS[publication])
    : undefined) ?? GENERAL;

type StyleKey = keyof typeof DEFAULT_STYLE;
const STYLE_KEYS = Object.keys(DEFAULT_STYLE) as StyleKey[];

/** The style settings a report offers, for Reset style. */
export const offeredStyle = (placement: Placement): StyleKey[] =>
  STYLE_KEYS.filter((key) => placement.offers.has(key));

/** The style a report applies: settings it does not offer keep their defaults. */
export function styleOnReport(placement: Placement, branding: Branding): Branding {
  const style = { ...branding };
  for (const key of STYLE_KEYS) {
    if (!placement.offers.has(key)) Object.assign(style, { [key]: DEFAULT_STYLE[key] });
  }
  return style;
}
