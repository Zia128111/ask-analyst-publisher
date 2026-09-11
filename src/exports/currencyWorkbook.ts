import { tokens } from '@akseer/ask-analyst-design-system/tokens';

import { textOn } from '../branding/contrast';
import { REPORT_SIZES, fontById, type Branding } from '../branding/types';
import type { CurrencyReport, Publisher } from '../data/types';
import {
  buildXlsx,
  styleRegistry,
  type XlsxCell,
  type XlsxEdge,
  type XlsxFont,
  type XlsxRow,
  type XlsxStyle,
} from '../lib/xlsx';

/* ============================================================================
 * CURRENCY — Excel download
 * ============================================================================
 * The rates as a workbook, built from the DATA rather than from the page, so
 * every figure is a number: rates under "#,##0.0000", changes under
 * "#,##0.00" — a change that rounds to zero written as zero. Laid out like
 * the sheet: the publisher and title on tinted bands, the date, the
 * masthead in words, the header between two rules, each part's name a bold
 * row and its rows indented, the highlighted currency's column filled,
 * everything centred but the labels, and the source. Colours are the design
 * system's light tokens, or the Report style's where the publisher has
 * chosen them.
 *
 * Imports only server-safe modules, so it also runs in Node.
 * ========================================================================= */

const color = tokens.semanticLight;
const INK = color['text-primary'];
const SECONDARY = color['text-secondary'];
const MUTED = color['text-tertiary'];
const BAND = color['bg-brand-subtle'];
const RULE = color['border-brand'];

/** The parts of the Report style a workbook carries. */
export type CurrencyWorkbookStyle = Pick<Branding, 'font' | 'size' | 'rule' | 'fill' | 'highlight'>;

const RATE_FORMAT = '#,##0.0000';
const CHANGE_FORMAT = '#,##0.00';
/** Character units at 11pt: the labels, then a column per currency. */
const LABEL_WIDTH = 16;
const FIGURE_WIDTH = 12;
/** The bands span columns until they hold a 48-character company name at 12pt. */
const BAND_WIDTH = 50;

export function buildCurrencyWorkbook({
  report,
  title,
  highlight,
  publisher,
  attribution,
  source,
  style,
}: {
  report: CurrencyReport;
  /** "Weighted Average Exchange Rates". */
  title: string;
  /** The currency whose column is filled: "USD". */
  highlight?: string;
  publisher: Publisher;
  /** Who the report is published under, in words. '' leaves the line empty. */
  attribution: string;
  source: string;
  style: CurrencyWorkbookStyle;
}): Uint8Array {
  const excel = REPORT_SIZES[style.size].excel;
  const size = excel.size;
  const typeface = fontById(style.font);
  const face: XlsxFont = { name: typeface.excelName, family: typeface.excelFamily };

  const fill = style.fill ?? BAND;
  const onFill = style.fill ? textOn(style.fill).color : INK;
  const tint = style.highlight ?? fill;
  const onTint = style.highlight ? textOn(style.highlight).color : onFill;
  const rule: XlsxEdge = { style: 'thin', color: style.rule ?? RULE };

  const styles = styleRegistry();
  const text = (font: XlsxFont, extra: XlsxStyle = {}) => styles.add({ font: { ...face, ...font }, ...extra });

  const band = (points: number) => text({ bold: true, size: points, color: onFill }, { fill, v: 'center' });
  /** Every heading, "Currency" included, centred between the header's rules. */
  const header = text({ bold: true, size, color: onFill }, { fill, top: rule, bottom: rule, h: 'center', v: 'center' });
  const highlighted = (symbol: string) => symbol === highlight;
  /** A figure's cell: centred on its rule, filled in the highlighted column. */
  const figureCell = (symbol: string, numFmt?: string) =>
    text(
      { size, color: highlighted(symbol) ? onTint : INK },
      { bottom: rule, h: 'center', v: 'center', numFmt, ...(highlighted(symbol) ? { fill: tint } : {}) },
    );

  const widths = [LABEL_WIDTH, ...report.currencies.map(() => FIGURE_WIDTH)];
  let bandColumns = 1;
  for (let sum = widths[0]; sum < BAND_WIDTH && bandColumns < widths.length; bandColumns += 1) sum += widths[bandColumns];
  const bandEnd = String.fromCharCode(64 + bandColumns);
  const bandRow = (value: string, style: number, height: number): XlsxRow => ({
    height,
    cells: Array.from({ length: bandColumns }, (_, i) => ({ value: i === 0 ? value : null, style })),
  });

  const sectionRows = report.sections.flatMap((section): XlsxRow[] => [
    {
      height: excel.row,
      cells: [
        { value: section.label, style: text({ bold: true, size, color: INK }, { bottom: rule, h: 'left', v: 'center' }) },
        ...report.currencies.map((symbol): XlsxCell => ({ value: null, style: figureCell(symbol) })),
      ],
    },
    ...section.rows.map(
      (row): XlsxRow => ({
        height: excel.row,
        cells: [
          { value: row.label, style: text({ size, color: INK }, { bottom: rule, h: 'left', v: 'center', indent: 1 }) },
          ...report.currencies.map((symbol, i): XlsxCell => {
            const value = row.values[i] ?? null;
            return section.kind === 'change'
              ? { value: value !== null && Math.abs(value) < 0.005 ? 0 : value, style: figureCell(symbol, CHANGE_FORMAT) }
              : { value, style: figureCell(symbol, RATE_FORMAT) };
          }),
        ],
      }),
    ),
  ]);

  /* Letterhead, header (row 6), the parts, the source. */
  const rows: XlsxRow[] = [
    bandRow(publisher.name, band(12), 21),
    {
      cells: [
        {
          value: new Date(`${report.asOf}T00:00:00Z`),
          style: text({ size: 9, color: SECONDARY }, { numFmt: 'mmm d, yyyy', h: 'left' }),
        },
      ],
    },
    bandRow(title, band(13), 24),
    { cells: attribution ? [{ value: attribution, style: text({ size: 9, color: MUTED }) }] : [] },
    { cells: [] },
    {
      height: excel.row + 4,
      cells: [
        { value: 'Currency', style: header },
        ...report.currencies.map((symbol) => ({
          value: symbol,
          style: highlighted(symbol)
            ? text({ bold: true, size, color: onTint }, { fill: tint, top: rule, bottom: rule, h: 'center', v: 'center' })
            : header,
        })),
      ],
    },
    ...sectionRows,
    { cells: [{ value: `Source: ${source}`, style: text({ italic: true, size: 9, color: MUTED }) }] },
  ];

  return buildXlsx({
    title: `${title}, ${report.asOf}`,
    author: publisher.name,
    sheetName: 'Currency',
    columns: widths.map((w) => Math.round(w * excel.widthScale * 2) / 2),
    rows,
    styles: styles.list,
    merges: [`A1:${bandEnd}1`, `A3:${bandEnd}3`],
    freezeRows: 6,
    showGrid: false,
  });
}
