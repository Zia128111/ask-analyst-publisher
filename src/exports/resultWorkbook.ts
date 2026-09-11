import { tokens } from '@akseer/ask-analyst-design-system/tokens';

import { textOn } from '../branding/contrast';
import { REPORT_SIZES, fontById, type Branding } from '../branding/types';
import { decimalsFor } from '../data/resultPrecision';
import type { LatestResult, Publisher } from '../data/types';
import { buildXlsx, styleRegistry, type XlsxEdge, type XlsxFont, type XlsxRow, type XlsxStyle } from '../lib/xlsx';

/* ============================================================================
 * LATEST RESULT — Excel download
 * ============================================================================
 * The sheet as a workbook, built from the result DATA rather than from the
 * page, so every figure is a real number with the sheet's precision as its
 * number format, negatives in the sheet's parentheses: (88,598) is -88598
 * formatted "#,##0;(#,##0)", and a change of 14.7 is 14.7 under its "(%)"
 * heading, as on the sheet.
 *
 * Laid out like the sheet: the ticker, name and units down column A with the
 * price beside them — close, change and change %, each a number, the change
 * signed and in the design system's direction colour — then the masthead in
 * words (a workbook cannot carry the logo), the header on its fill between
 * two rules, the rows with totals in bold and the current periods tinted,
 * and the source line when there is one. Colours are the design system's
 * light tokens, or the Report style's where the publisher has chosen them.
 *
 * Imports only server-safe modules, so it also runs in Node.
 * ========================================================================= */

const color = tokens.semanticLight;
const INK = color['text-primary'];
const SECONDARY = color['text-secondary'];
const MUTED = color['text-tertiary'];
const BAND = color['bg-brand-subtle'];
const RULE = color['border-brand'];
const DIRECTION = { up: color['positive-text'], down: color['negative-text'], flat: MUTED };

/** The parts of the Report style a workbook carries. */
export type ResultWorkbookStyle = Pick<Branding, 'font' | 'size' | 'rule' | 'fill' | 'highlight'>;

/** The sheet's precision as an Excel format, negatives in parentheses. */
const numberFormat = (decimals: number) => {
  const base = decimals > 0 ? `#,##0.${'0'.repeat(decimals)}` : '#,##0';
  return `${base};(${base})`;
};

/** -1.76 (percent) -> -0.0176, without floating-point dust. */
const fraction = (percent: number | null) =>
  percent === null ? null : Math.round(percent * 1e6) / 1e8;

/** Label column, then the figures, in Excel's character units at 11pt. */
const LABEL_WIDTH = 44;
const FIGURE_WIDTH = 11;

export function buildResultWorkbook({
  result,
  title,
  publisher,
  attribution,
  source,
  style,
}: {
  result: LatestResult;
  /** The publication's title: "Latest Results". */
  title: string;
  publisher: Publisher;
  /** Who the sheet is published under, in words. '' leaves the line empty. */
  attribution: string;
  /** The source line: the Report style's, or the result's own; '' for none. */
  source: string;
  style: ResultWorkbookStyle;
}): Uint8Array {
  const { company, price, columns, rows } = result;
  const excel = REPORT_SIZES[style.size].excel;
  const size = excel.size;
  const typeface = fontById(style.font);
  const face: XlsxFont = { name: typeface.excelName, family: typeface.excelFamily };

  const fill = style.fill ?? BAND;
  const onFill = style.fill ? textOn(style.fill).color : INK;
  const highlight = style.highlight ?? fill;
  const onHighlight = style.highlight ? textOn(style.highlight).color : onFill;
  const rule: XlsxEdge = { style: 'thin', color: style.rule ?? RULE };

  const styles = styleRegistry();
  const text = (font: XlsxFont, extra: XlsxStyle = {}) =>
    styles.add({ font: { ...face, ...font }, ...extra });

  const header = (h: 'left' | 'right') =>
    text({ bold: true, size, color: onFill }, { fill, top: rule, bottom: rule, h, v: 'center' });

  const labelCell = (bold: boolean) =>
    text({ bold, size, color: INK }, { bottom: rule, h: 'left', v: 'center', wrap: true });

  const figureCell = (decimals: number, bold: boolean, current: boolean) =>
    text(
      { bold, size, color: current ? onHighlight : INK },
      { bottom: rule, h: 'right', v: 'center', numFmt: numberFormat(decimals), ...(current ? { fill: highlight } : {}) },
    );

  const direction =
    price?.change == null ? DIRECTION.flat : price.change > 0 ? DIRECTION.up : price.change < 0 ? DIRECTION.down : DIRECTION.flat;
  const small = (colour: string) => text({ size: 9, color: colour });
  /* "PKR 408.03" in bold 12pt is wider than one figure column, and Excel
     shows a number that does not fit as "####" rather than letting it run
     into the next cell, so the close spans B:C. */
  const close = text({ bold: true, size: 12, color: INK }, { numFmt: '"PKR "#,##0.00', h: 'left' });

  const headerRow = 6;
  const sheetRows: XlsxRow[] = [
    {
      height: 20,
      cells: [
        { value: company.ticker, style: text({ bold: true, size: 13, color: INK }) },
        ...(price ? [{ value: 'Price as of', style: small(INK) }] : []),
      ],
    },
    {
      height: 18,
      cells: [
        { value: company.name, style: small(SECONDARY) },
        ...(price
          ? [
              { value: price.close, style: close },
              { value: null, style: close },
              {
                value: price.change,
                style: text({ bold: true, size: 9, color: direction }, { numFmt: '+#,##0.00;-#,##0.00;0.00' }),
              },
              {
                value: fraction(price.changePct),
                style: text({ bold: true, size: 9, color: direction }, { numFmt: '+0.00%;-0.00%;0.00%' }),
              },
            ]
          : []),
      ],
    },
    {
      cells: [
        { value: result.units, style: small(SECONDARY) },
        ...(price
          ? [{ value: new Date(`${price.asOf}T00:00:00Z`), style: text({ size: 9, color: SECONDARY }, { numFmt: 'mmm d, yyyy', h: 'left' }) }]
          : []),
      ],
    },
    { cells: attribution ? [{ value: attribution, style: small(MUTED) }] : [] },
    { cells: [] },
    {
      height: excel.row + 4,
      cells: [
        { value: result.statement, style: header('left') },
        ...columns.map((c) => ({ value: c.label, style: header('right') })),
      ],
    },
    ...rows.map(
      (r): XlsxRow => ({
        height: excel.row,
        cells: [
          { value: r.label, style: labelCell(r.bold) },
          ...columns.map((c, i) => ({
            value: r.values[i] ?? null,
            style: figureCell(decimalsFor(r.measure, c), r.bold, c.current),
          })),
        ],
      }),
    ),
    ...(source ? [{ cells: [{ value: `Source: ${source}`, style: text({ italic: true, size: 9, color: MUTED }) }] }] : []),
  ];

  return buildXlsx({
    title: `${title}, ${company.ticker}${price ? `, ${price.asOf}` : ''}`,
    author: publisher.name,
    sheetName: company.ticker,
    columns: [LABEL_WIDTH, ...columns.map(() => FIGURE_WIDTH)].map((w) => Math.round(w * excel.widthScale * 2) / 2),
    rows: sheetRows,
    styles: styles.list,
    merges: price ? ['B2:C2'] : [],
    freezeRows: headerRow,
    showGrid: false,
  });
}
