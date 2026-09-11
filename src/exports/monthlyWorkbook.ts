import { tokens } from '@akseer/ask-analyst-design-system/tokens';

import { readableOn, textOn } from '../branding/contrast';
import { REPORT_SIZES, fontById, type Branding } from '../branding/types';
import { MONTHLY_LOOK, type MonthlyLook } from '../components/report/monthlyLook';
import type { MonthlyColumn, MonthlyReport, MonthlyValue, Publisher } from '../data/types';
import {
  buildXlsx,
  styleRegistry,
  type XlsxCell,
  type XlsxEdge,
  type XlsxFont,
  type XlsxRow,
  type XlsxSheet,
  type XlsxStyle,
} from '../lib/xlsx';

/* ============================================================================
 * MONTHLY REPORTS — Excel download (BOP, OMC sales, the trade sheets)
 * ============================================================================
 * The report as a workbook, built from the DATA rather than from the page,
 * so every figure is a real number: (2,679) is -2679 formatted
 * "#,##0;(#,##0)" and a change of -60% is -0.6 formatted "0%" — "0.0%" where
 * the feed publishes one decimal. "NM" stays the word, as published; a
 * missing figure, and a section name's row, are empty cells.
 *
 * Laid out like the sheet: the publisher and title on tinted bands, the date,
 * the masthead in words (a workbook cannot carry the logo), the table with
 * its header between two rules, totals bold, detail lines indented and, as
 * the sheet's look has them (monthlyLook.ts), the current month and year to
 * date tinted and negative amounts in the negative colour; then the source
 * line. The table part only, as the PNG and PDF are. Colours are the design
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
const NEGATIVE = color['negative-text'];

/** The parts of the Report style a workbook carries. */
export type MonthlyWorkbookStyle = Pick<Branding, 'font' | 'size' | 'rule' | 'fill' | 'highlight' | 'negative'>;

const AMOUNT_FORMAT = '#,##0;(#,##0)';

/** "0%", or "0.0%" for changes published to one decimal. */
const changeFormat = (decimals: number) => (decimals > 0 ? `0.${'0'.repeat(decimals)}%` : '0%');

/** An Excel indent step is about three characters of the label column. */
const INDENT_CHARACTERS = 3;

/** -60 (percent) -> -0.6, without floating-point dust. */
const fraction = (percent: number) => Math.round(percent * 1e6) / 1e8;

/** Amounts and changes, in Excel's character units at 11pt. */
const WIDTH = { amount: 10, change: 8 };
/** The label column fits the longest label, in bold, within these bounds. */
const LABEL_WIDTH = { min: 12, max: 40 };
/** The bands span columns until they hold a 48-character company name at 12pt. */
const BAND_WIDTH = 50;

export interface MonthlyWorkbookOptions {
  report: MonthlyReport;
  /** The report's title: "External Account Highlights", "OMCs Cumulative Sales". */
  title: string;
  /** The worksheet's tab: "BOP", "OMC". */
  sheetName: string;
  publisher: Publisher;
  /** Who the report is published under, in words. '' leaves the line empty. */
  attribution: string;
  source: string;
  style: MonthlyWorkbookStyle;
  /** What the sheet sets off, as on screen. */
  look?: MonthlyLook;
}

/** The report's table as a workbook of its own. */
export function buildMonthlyWorkbook(options: MonthlyWorkbookOptions): Uint8Array {
  const styles = styleRegistry();
  const sheet = monthlySheet(options, styles);
  return buildXlsx({
    title: `${options.title}, ${options.report.asOf}`,
    author: options.publisher.name,
    sheetName: sheet.name,
    columns: sheet.columns,
    rows: sheet.rows,
    styles: styles.list,
    merges: sheet.merges,
    freezeRows: sheet.freezeRows,
    showGrid: sheet.showGrid,
  });
}

/**
 * The report's table as a worksheet — letterhead, table, source — with its
 * styles added to `styles`, so a workbook of several sheets (Remittance's
 * table and history) shares one style list.
 */
export function monthlySheet(
  { report, title, sheetName, publisher, attribution, source, style, look = MONTHLY_LOOK }: MonthlyWorkbookOptions,
  styles: ReturnType<typeof styleRegistry>,
): XlsxSheet {
  const { columns, rows } = report;
  const changeFmt = changeFormat(report.changeDecimals ?? 0);
  const excel = REPORT_SIZES[style.size].excel;
  const size = excel.size;
  const typeface = fontById(style.font);
  const face: XlsxFont = { name: typeface.excelName, family: typeface.excelFamily };

  const fill = style.fill ?? BAND;
  const onFill = style.fill ? textOn(style.fill).color : INK;
  const highlight = style.highlight ?? fill;
  const onHighlight = style.highlight ? textOn(style.highlight).color : onFill;
  const negative = style.negative ?? NEGATIVE;
  const negativeOnHighlight = readableOn(negative, highlight);
  const rule: XlsxEdge = { style: 'thin', color: style.rule ?? RULE };

  const text = (font: XlsxFont, extra: XlsxStyle = {}) => styles.add({ font: { ...face, ...font }, ...extra });

  const band = (points: number) => text({ bold: true, size: points, color: onFill }, { fill, v: 'center' });
  const header = (h: 'left' | 'right') =>
    text({ bold: true, size, color: onFill }, { fill, top: rule, bottom: rule, h, v: 'center' });
  const labelCell = (bold: boolean, indent = 0) =>
    text({ bold, size, color: INK }, { bottom: rule, h: 'left', v: 'center', wrap: true, ...(indent ? { indent } : {}) });

  /** A figure cell: its number format, its colour, the tint of the current columns. */
  const figure = (value: MonthlyValue, kind: MonthlyColumn['kind'], bold: boolean, current: boolean): XlsxCell => {
    const tinted = look.tintCurrent && current;
    const isNegativeAmount = look.colourNegatives && kind === 'amount' && typeof value === 'number' && value < 0;
    const ink = isNegativeAmount ? (tinted ? negativeOnHighlight : negative) : tinted ? onHighlight : INK;
    const numFmt = value === 'NM' ? undefined : kind === 'amount' ? AMOUNT_FORMAT : changeFmt;
    return {
      value: value === 'NM' ? 'NM' : value === null ? null : kind === 'change' ? fraction(value) : value,
      style: text(
        { bold, size, color: ink },
        { bottom: rule, h: 'right', v: 'center', ...(numFmt ? { numFmt } : {}), ...(tinted ? { fill: highlight } : {}) },
      ),
    };
  };

  /* Blank where the title carries the unit, as on the sheet. */
  const unitsHeading = look.unitsInTitle ? '' : report.units;
  const longest = Math.max(
    unitsHeading.length,
    ...rows.map((r) => r.label.length + (r.indent ?? 0) * INDENT_CHARACTERS),
  );
  const labelWidth = Math.min(LABEL_WIDTH.max, Math.max(LABEL_WIDTH.min, Math.ceil(longest * 1.1) + 2));
  const widths = [labelWidth, ...columns.map((c) => (c.kind === 'amount' ? WIDTH.amount : WIDTH.change))];

  /* The bands run across as many columns as a long company name needs. */
  let bandColumns = 1;
  for (let sum = widths[0]; sum < BAND_WIDTH && bandColumns < widths.length; bandColumns += 1) sum += widths[bandColumns];
  const bandEnd = String.fromCharCode(64 + bandColumns);
  const bandRow = (value: string, style: number, height: number): XlsxRow => ({
    height,
    cells: Array.from({ length: bandColumns }, (_, i) => ({ value: i === 0 ? value : null, style })),
  });

  /* Letterhead, table, source. The header is row 6. */
  const headerRow = 6;
  const sheetRows: XlsxRow[] = [
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
        { value: unitsHeading || null, style: header('left') },
        ...columns.map((c) => ({ value: c.label, style: header('right') })),
      ],
    },
    ...rows.map(
      (r): XlsxRow => ({
        height: excel.row,
        cells: [
          { value: r.label, style: labelCell(r.bold, r.indent) },
          ...columns.map((c, j) => figure(r.values[j] ?? null, c.kind, r.bold, c.current)),
        ],
      }),
    ),
    { cells: [{ value: `Source: ${source}`, style: text({ italic: true, size: 9, color: MUTED }) }] },
  ];

  return {
    name: sheetName,
    columns: widths.map((w) => Math.round(w * excel.widthScale * 2) / 2),
    rows: sheetRows,
    merges: [`A1:${bandEnd}1`, `A3:${bandEnd}3`],
    freezeRows: headerRow,
    showGrid: false,
  };
}
