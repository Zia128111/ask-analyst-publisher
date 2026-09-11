import { tokens } from '@akseer/ask-analyst-design-system/tokens';

import { PAPER, readableOn, textOn } from '../branding/contrast';
import { REPORT_SIZES, fontById, type Branding } from '../branding/types';
import type { MorningBriefing, Publisher } from '../data/types';
import {
  buildXlsx,
  styleRegistry,
  type XlsxCell,
  type XlsxEdge,
  type XlsxFont,
  type XlsxLink,
  type XlsxRow,
  type XlsxSheet,
  type XlsxStyle,
} from '../lib/xlsx';

/* ============================================================================
 * MORNING BRIEFING — Excel download
 * ============================================================================
 * Two sheets, each headed as the briefing is — its date, who it goes out
 * under (in words: a workbook cannot carry the logo) and "Morning Briefing"
 * in blue between two rules:
 *
 *   News     one row per story: its number, headline, summary, and "Click
 *            here for more", a real link to the full story. Wrapped, the rows
 *            sized to their text; the headings frozen.
 *   Markets  the five tables as the sheet draws them: the name in blue, the
 *            headings bold and centred between rules, every other row filled,
 *            the figures centred, a rule under the last row.
 *
 * Built from the DATA, so every figure is a number: flows at the feed's
 * precision, changes as fractions ("0.0%"), shown as the sheet shows them —
 * signed, and 0.00 where they round to zero (conditional formats, as on
 * Portfolio Investment's workbook). Colours are the system's light tokens, or
 * the Report style's.
 *
 * Imports only server-safe modules, so it also runs in Node.
 * ========================================================================= */

const color = tokens.semanticLight;
const INK = color['text-primary'];
const SECONDARY = color['text-secondary'];
const MUTED = color['text-tertiary'];
const LINK = color['text-link'];
const STRIPE = color['bg-brand-subtle'];
const RULE = color['border-brand'];

/** The parts of the Report style a workbook carries. */
export type BriefingWorkbookStyle = Pick<Branding, 'font' | 'size' | 'rule' | 'fill'>;

/** Signed, and plain zero for anything that rounds to it: the sheet's figures, as Excel formats. */
const FORMAT = {
  flow: '[<=-0.005]-#,##0.00;[>=0.005]#,##0.00;0.00',
  level: '#,##0',
  price: '#,##0.00',
  rate: '#,##0.0000',
  change1: '[<=-0.0005]-0.0%;[>=0.0005]+0.0%;0.0%',
  change2: '[<=-0.00005]-0.00%;[>=0.00005]+0.00%;0.00%',
  date: 'd mmmm", "yyyy',
} as const;

/** -1.79 (percent) -> -0.0179, without floating-point dust. */
const fraction = (percent: number | null) => (percent === null ? null : Math.round(percent * 1e6) / 1e8);

/** Excel's character units at 11pt. */
const NEWS_WIDTH = { number: 5, headline: 42, summary: 90, link: 20 };
const MARKET_WIDTH = { label: 20, figure: 13 };
/** A wrapped line at 11pt, in points; the text size scales it. */
const LINE_POINTS = 15;

const letter = (index: number) => String.fromCharCode(65 + index);

export function buildBriefingWorkbook({
  briefing,
  title,
  publisher,
  attribution,
  style,
}: {
  briefing: MorningBriefing;
  /** "Morning Briefing". */
  title: string;
  publisher: Publisher;
  /** Who the briefing goes out under, in words. '' leaves the line empty. */
  attribution: string;
  style: BriefingWorkbookStyle;
}): Uint8Array {
  const excel = REPORT_SIZES[style.size].excel;
  const size = excel.size;
  const typeface = fontById(style.font);
  const face: XlsxFont = { name: typeface.excelName, family: typeface.excelFamily };

  const stripe = style.fill ?? STRIPE;
  const onStripe = style.fill ? textOn(style.fill).color : INK;
  const rule: XlsxEdge = { style: 'thin', color: style.rule ?? RULE };
  /* The title and the tables' names: the chosen border colour where it reads
     as text, as on the sheet; the system's blue for text otherwise. */
  const accent = style.rule ? readableOn(style.rule, PAPER) : LINK;

  const styles = styleRegistry();
  const text = (font: XlsxFont, extra: XlsxStyle = {}) => styles.add({ font: { ...face, ...font }, ...extra });
  const lineHeight = Math.round(LINE_POINTS * (size / 11) * 2) / 2;

  /**
   * The briefing's header: the date, the masthead in words, the title between
   * rules. The date spans two columns: a date that does not fit its cell
   * shows as "###", and the News sheet's first column is only its numbers.
   */
  const header = (columns: number): { rows: XlsxRow[]; merges: string[] } => {
    const band = text({ bold: true, size: 16, color: accent }, { top: rule, bottom: rule, v: 'center' });
    return {
      rows: [
        {
          cells: [
            {
              value: new Date(`${briefing.asOf}T00:00:00Z`),
              style: text({ size: 11, color: INK }, { numFmt: FORMAT.date, h: 'left' }),
            },
          ],
        },
        { cells: attribution ? [{ value: attribution, style: text({ size: 9, color: MUTED }) }] : [] },
        { cells: [] },
        {
          height: 28,
          cells: Array.from({ length: columns }, (_, i) => ({ value: i === 0 ? title : null, style: band })),
        },
        { cells: [] },
      ],
      merges: ['A1:B1', `A4:${letter(columns - 1)}4`],
    };
  };

  /* ------------------------------------------------------------------ News */
  const newsHeader = header(4);
  const headingCell = (h: 'left' | 'center') =>
    text({ bold: true, size, color: INK }, { top: rule, bottom: rule, h, v: 'center' });
  const wrapped = (bold: boolean, colour: string) =>
    text({ bold, size, color: colour }, { bottom: rule, h: 'left', v: 'top', wrap: true });
  const linkCell = text({ size, color: LINK, underline: true }, { bottom: rule, h: 'left', v: 'top' });
  const numberCell = text({ size, color: SECONDARY }, { bottom: rule, h: 'center', v: 'top' });

  const firstStory = newsHeader.rows.length + 1;
  const links: XlsxLink[] = [];
  const storyRows: XlsxRow[] = briefing.stories.map((story, i) => {
    const row = firstStory + i + 1;
    if (story.link) links.push({ cell: `D${row}`, url: story.link });
    const lines = Math.max(
      Math.ceil(story.title.length / (NEWS_WIDTH.headline * 0.9)),
      Math.ceil(story.summary.length / (NEWS_WIDTH.summary * 1.05)),
      1,
    );
    return {
      height: lines * lineHeight + 4,
      cells: [
        { value: i + 1, style: numberCell },
        { value: story.title, style: wrapped(true, INK) },
        { value: story.summary, style: wrapped(false, SECONDARY) },
        story.link ? { value: 'Click here for more', style: linkCell } : { value: null, style: numberCell },
      ],
    };
  });

  const news: XlsxSheet = {
    name: 'News',
    columns: [NEWS_WIDTH.number, NEWS_WIDTH.headline, NEWS_WIDTH.summary, NEWS_WIDTH.link].map(
      (w) => Math.round(w * excel.widthScale * 2) / 2,
    ),
    rows: [
      ...newsHeader.rows,
      {
        height: excel.row + 4,
        cells: [
          { value: 'No.', style: headingCell('center') },
          { value: 'Headline', style: headingCell('left') },
          { value: 'Summary', style: headingCell('left') },
          { value: 'Link', style: headingCell('left') },
        ],
      },
      ...storyRows,
    ],
    merges: newsHeader.merges,
    freezeRows: firstStory,
    showGrid: false,
    orientation: 'landscape',
    links,
  };

  /* --------------------------------------------------------------- Markets */
  const marketsHeader = header(5);
  const nameCell = text({ bold: true, size: size + 1, color: accent });
  const columnHeading = (h: 'left' | 'center') =>
    text({ bold: true, size, color: INK }, { top: rule, bottom: rule, h, v: 'center' });

  /** A table's cell: filled on every other row, closed by the rule on its last. */
  const cellStyle = (h: 'left' | 'center', filled: boolean, last: boolean, numFmt?: string) =>
    text(
      { size, color: filled ? onStripe : INK },
      {
        h,
        v: 'center',
        ...(filled ? { fill: stripe } : {}),
        ...(last ? { bottom: rule } : {}),
        ...(numFmt ? { numFmt } : {}),
      },
    );

  type Figure = { value: number | string | null; format?: string };
  const table = (name: string, labelHeading: string, headings: string[], rows: { label: string; figures: Figure[] }[]) => {
    const out: XlsxRow[] = [
      { height: excel.row + 2, cells: [{ value: name, style: nameCell }] },
      {
        height: excel.row + 4,
        cells: [
          { value: labelHeading || null, style: columnHeading('left') },
          ...headings.map((h) => ({ value: h, style: columnHeading('center') })),
        ],
      },
      ...rows.map((r, i): XlsxRow => {
        const filled = i % 2 === 0;
        const last = i === rows.length - 1;
        return {
          height: excel.row + 2,
          cells: [
            { value: r.label, style: cellStyle('left', filled, last) },
            ...r.figures.map((f): XlsxCell => ({ value: f.value, style: cellStyle('center', filled, last, f.format) })),
          ],
        };
      }),
      { cells: [] },
    ];
    return out;
  };

  const markets: XlsxSheet = {
    name: 'Markets',
    columns: [MARKET_WIDTH.label, ...Array.from({ length: 4 }, () => MARKET_WIDTH.figure)].map(
      (w) => Math.round(w * excel.widthScale * 2) / 2,
    ),
    rows: [
      ...marketsHeader.rows,
      ...table(
        'Net LIPI/FIPI Position',
        '',
        ['USD mn', 'CYTD'],
        briefing.net.map((r) => ({
          label: r.label,
          figures: [
            { value: r.day, format: FORMAT.flow },
            { value: r.cytd, format: FORMAT.flow },
          ],
        })),
      ),
      ...table(
        'FIPI Sector-wise',
        '',
        ['USD mn'],
        briefing.sectors.map((r) => ({ label: r.label, figures: [{ value: r.net, format: FORMAT.flow }] })),
      ),
      ...table(
        'Major Indices',
        'Index',
        ['Value', 'Change', 'FYTD', 'CYTD'],
        briefing.indices.map((r) => ({
          label: r.label,
          figures: [
            { value: r.value, format: FORMAT.level },
            { value: fraction(r.change), format: FORMAT.change1 },
            { value: fraction(r.fytd), format: FORMAT.change1 },
            { value: fraction(r.cytd), format: FORMAT.change1 },
          ],
        })),
      ),
      ...table(
        'Commodities',
        '',
        ['Unit', 'Price', 'Change'],
        briefing.commodities.map((r) => ({
          label: r.label,
          figures: [
            { value: r.unit },
            { value: r.price, format: FORMAT.price },
            { value: fraction(r.change), format: FORMAT.change2 },
          ],
        })),
      ),
      ...table(
        'Inter-Bank Currency Rates',
        '',
        ['Last Close', 'Change', 'CYTD %'],
        briefing.currencies.map((r) => ({
          label: r.pair,
          figures: [
            { value: r.close, format: FORMAT.rate },
            { value: fraction(r.change), format: FORMAT.change2 },
            { value: fraction(r.cytd), format: FORMAT.change2 },
          ],
        })),
      ),
    ],
    merges: marketsHeader.merges,
    showGrid: false,
  };

  return buildXlsx({
    title: `${title}, ${briefing.asOf}`,
    author: publisher.name,
    styles: styles.list,
    sheets: [news, markets],
  });
}
