import { tokens } from '@akseer/ask-analyst-design-system/tokens';

import { textOn } from '../branding/contrast';
import { REPORT_SIZES, fontById, type Branding } from '../branding/types';
import type { MtsReport, Publisher } from '../data/types';
import { buildXlsx, type XlsxEdge, type XlsxFont, type XlsxRow, type XlsxStyle } from '../lib/xlsx';

/* ============================================================================
 * MTS — Excel download
 * ============================================================================
 * The sheet as a workbook, built from the report DATA rather than from the
 * page, so every figure is a real number at full precision with the sheet's
 * precision as its number format: 14.1% is 0.141 formatted "0.0%", and
 * 1,615.29 is 1615.29 formatted "#,##0.00".
 *
 * Laid out like the sheet: publisher and title on tinted bands, the session
 * date, the masthead in words (a workbook cannot carry the logo), the header
 * between two rules with the same two-line labels, the rows, and the source
 * line. Colours come from the design system's light tokens, or from the
 * Report style where the publisher has chosen them — the typeface by name,
 * the table's text size, the rules, the fill and the text on it.
 *
 * Imports only server-safe modules, so it also runs in Node — which is how
 * it is checked against Excel.
 * ========================================================================= */

const color = tokens.semanticLight;
const INK = color['text-primary'];
const SECONDARY = color['text-secondary'];
const MUTED = color['text-tertiary'];
const BAND = color['bg-brand-subtle'];
const RULE = color['border-brand'];

/** The parts of the Report style a workbook carries. */
export type WorkbookStyle = Pick<Branding, 'font' | 'size' | 'rule' | 'fill'>;

/** Indexes into the style list, in the same order. */
const S = {
  publisher: 0,
  date: 1,
  title: 2,
  masthead: 3,
  head: 4,
  headStart: 5,
  symbol: 6,
  oneDp: 7,
  oneDpGrouped: 8,
  rate: 9,
  twoDp: 10,
  twoDpGrouped: 11,
  tag: 12,
  source: 13,
} as const;

function styles(style: WorkbookStyle): XlsxStyle[] {
  const typeface = fontById(style.font);
  const { size } = REPORT_SIZES[style.size].excel;
  const face: XlsxFont = { name: typeface.excelName, family: typeface.excelFamily };
  const fill = style.fill ?? BAND;
  const onFill = style.fill ? textOn(style.fill).color : INK;
  const headerRule: XlsxEdge = { style: 'medium', color: style.rule ?? RULE };
  const rowRule: XlsxEdge = { style: 'thin', color: style.rule ?? RULE };

  const cell = (numFmt?: string, h: 'left' | 'center' = 'center'): XlsxStyle => ({
    font: { ...face, size, color: INK },
    bottom: rowRule,
    h,
    v: 'center',
    ...(numFmt ? { numFmt } : {}),
  });

  const header = (h: 'left' | 'center'): XlsxStyle => ({
    font: { ...face, bold: true, size, color: onFill },
    fill,
    top: headerRule,
    bottom: headerRule,
    h,
    v: 'center',
    wrap: true,
  });

  return [
    { font: { ...face, bold: true, size: 12, color: onFill }, fill, v: 'center' },
    { font: { ...face, size: 9, color: SECONDARY }, numFmt: 'mmm d, yyyy', h: 'left' },
    { font: { ...face, bold: true, size: 13, color: onFill }, fill, v: 'center' },
    { font: { ...face, size: 9, color: MUTED } },
    header('center'),
    header('left'),
    cell(undefined, 'left'),
    cell('0.0'),
    cell('#,##0.0'),
    cell('0.0%'),
    cell('0.00'),
    cell('#,##0.00'),
    cell(),
    { font: { ...face, italic: true, size: 9, color: MUTED } },
  ];
}

/** The sheet's own header labels, with the same line breaks. */
const HEADER = [
  'Symbol',
  'Current MTS\nVolume (Mn)',
  'Value\n(PKR Mn)',
  'MTS Rate',
  'Open\nVolume (Mn)',
  'Value\n(PKR Mn)',
  'Symbol',
];

/** Column widths at 11pt, in Excel's character units. */
const COLUMNS = [10, 14, 13, 11, 14, 13, 9];

/** 14.1 (percent) -> 0.141, without floating-point dust such as 0.14100000000000001. */
const fraction = (percent: number | null) =>
  percent === null ? null : Math.round(percent * 1e6) / 1e8;

/** A band spans A:D, as the sheet's bands span four grid columns. */
const band = (text: string, style: number, height: number): XlsxRow => ({
  height,
  cells: [{ value: text, style }, { value: null, style }, { value: null, style }, { value: null, style }],
});

export function buildMtsWorkbook({
  report,
  title,
  publisher,
  attribution,
  source,
  style,
}: {
  report: MtsReport;
  title: string;
  publisher: Publisher;
  /** Who the sheet is published under, in words. '' leaves the line empty. */
  attribution: string;
  /** The source line: the Report style's, or the report's own. */
  source: string;
  style: WorkbookStyle;
}): Uint8Array {
  const size = REPORT_SIZES[style.size].excel;
  const headerRow = 6;
  const rows: XlsxRow[] = [
    band(publisher.name, S.publisher, 21),
    { cells: [{ value: new Date(`${report.asOf}T00:00:00Z`), style: S.date }] },
    band(title, S.title, 24),
    { cells: attribution ? [{ value: attribution, style: S.masthead }] : [] },
    { cells: [] },
    {
      height: size.header,
      cells: HEADER.map((label, i) => ({ value: label, style: i === 0 ? S.headStart : S.head })),
    },
    ...report.rows.map(
      (r): XlsxRow => ({
        height: size.row,
        cells: [
          { value: r.symbol, style: S.symbol },
          { value: r.currentVolumeMn, style: S.oneDp },
          { value: r.currentValuePkrMn, style: S.oneDpGrouped },
          { value: fraction(r.mtsRatePct), style: S.rate },
          { value: r.openVolumeMn, style: S.twoDp },
          { value: r.openValuePkrMn, style: S.twoDpGrouped },
          { value: r.trailingSymbol, style: S.tag },
        ],
      }),
    ),
    { cells: [{ value: `Source: ${source}`, style: S.source }] },
  ];

  return buildXlsx({
    title: `${title}, ${report.asOf}`,
    author: publisher.name,
    sheetName: 'MTS',
    columns: COLUMNS.map((w) => Math.round(w * size.widthScale * 2) / 2),
    rows,
    styles: styles(style),
    merges: ['A1:D1', 'A3:D3'],
    freezeRows: headerRow,
    showGrid: false,
  });
}
