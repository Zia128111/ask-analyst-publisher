import { tokens } from '@akseer/ask-analyst-design-system/tokens';

import { textOn } from '../branding/contrast';
import { REPORT_SIZES, fontById, type Branding } from '../branding/types';
import type { Publisher, SettlementReport } from '../data/types';
import {
  buildXlsx,
  styleRegistry,
  type XlsxAlign,
  type XlsxCell,
  type XlsxEdge,
  type XlsxFont,
  type XlsxRow,
  type XlsxStyle,
} from '../lib/xlsx';

/* ============================================================================
 * SETTLEMENT — Excel download
 * ============================================================================
 * The report as a workbook, built from the DATA rather than from the page,
 * so every figure is a real number at the feed's full precision, shown to
 * one decimal ("#,##0.0") as the sheet prints it: 1,261.1 is 1261.10493617.
 * The settlement percentages are percents, 39.28, under the heading's "(%)",
 * as published — not fractions.
 *
 * Laid out like the sheet: the publisher and title on tinted bands, the date,
 * the masthead in words (a workbook cannot carry the logo), the two-row
 * header — "Symbol" merged down both rows, "Trade" and "Settlement (%)"
 * merged over their columns, each on its own rule, a narrow blank column
 * between them — tinted between rules, a line per stock, everything
 * centred, the source. Colours are the design system's light tokens, or the
 * Report style's where the publisher has chosen them.
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
export type SettlementWorkbookStyle = Pick<Branding, 'font' | 'size' | 'rule' | 'fill'>;

const ONE_DP = '#,##0.0';

/**
 * Excel character units at 11pt: each column holds its heading in bold, and
 * a narrow blank column parts the two groups, so their rules break between
 * them as on the sheet (a cell's border cannot be trimmed).
 */
const WIDTH = { symbol: 13, volume: 20, value: 16, gap: 2, percent: 10 } as const;
/** The bands span columns until they hold a 48-character company name at 12pt. */
const BAND_WIDTH = 50;

export function buildSettlementWorkbook({
  report,
  title,
  publisher,
  attribution,
  source,
  style,
}: {
  report: SettlementReport;
  /** "Settlement of top 10 traded stocks". */
  title: string;
  publisher: Publisher;
  /** Who the report is published under, in words. '' leaves the line empty. */
  attribution: string;
  source: string;
  style: SettlementWorkbookStyle;
}): Uint8Array {
  const excel = REPORT_SIZES[style.size].excel;
  const size = excel.size;
  const typeface = fontById(style.font);
  const face: XlsxFont = { name: typeface.excelName, family: typeface.excelFamily };

  const fill = style.fill ?? BAND;
  const onFill = style.fill ? textOn(style.fill).color : INK;
  const rule: XlsxEdge = { style: 'thin', color: style.rule ?? RULE };

  const styles = styleRegistry();
  const text = (font: XlsxFont, extra: XlsxStyle = {}) => styles.add({ font: { ...face, ...font }, ...extra });

  const band = (points: number) => text({ bold: true, size: points, color: onFill }, { fill, v: 'center' });
  const head = (h: XlsxAlign, edges: Pick<XlsxStyle, 'top' | 'bottom'>) =>
    text({ bold: true, size, color: onFill }, { fill, h, v: 'center', ...edges });
  const symbolCell = text({ size, color: INK }, { bottom: rule, h: 'center', v: 'center' });
  const figureCell = text({ size, color: INK }, { bottom: rule, h: 'center', v: 'center', numFmt: ONE_DP });
  /** The blank column between the groups: the lines' rules run through it. */
  const gapCell: XlsxCell = { value: null, style: text({ size, color: INK }, { bottom: rule }) };

  const widths = [WIDTH.symbol, WIDTH.volume, WIDTH.value, WIDTH.gap, WIDTH.percent, WIDTH.percent];

  /* The bands run across as many columns as a long company name needs. */
  let bandColumns = 1;
  for (let sum = widths[0]; sum < BAND_WIDTH && bandColumns < widths.length; bandColumns += 1) sum += widths[bandColumns];
  const bandEnd = String.fromCharCode(64 + bandColumns);
  const bandRow = (value: string, style: number, height: number): XlsxRow => ({
    height,
    cells: Array.from({ length: bandColumns }, (_, i) => ({ value: i === 0 ? value : null, style })),
  });

  /* The header's first row: the names over the columns, on the top rule and
     each group's own rule — none over the gap; the second: the column
     headings, centred, on the header's closing rule. */
  const groupRow: XlsxCell[] = [
    { value: 'Symbol', style: head('center', { top: rule, bottom: rule }) },
    { value: 'Trade', style: head('center', { top: rule, bottom: rule }) },
    { value: null, style: head('center', { top: rule, bottom: rule }) },
    { value: null, style: head('center', { top: rule }) },
    { value: 'Settlement (%)', style: head('center', { top: rule, bottom: rule }) },
    { value: null, style: head('center', { top: rule, bottom: rule }) },
  ];
  const headingRow: XlsxCell[] = [
    { value: null, style: head('center', { bottom: rule }) },
    { value: 'Volume (mn shares)', style: head('center', { bottom: rule }) },
    { value: 'Value (PKR mn)', style: head('center', { bottom: rule }) },
    { value: null, style: head('center', { bottom: rule }) },
    { value: 'UIN', style: head('center', { bottom: rule }) },
    { value: 'CM', style: head('center', { bottom: rule }) },
  ];

  /* Letterhead, header (rows 6 and 7), the stocks, the source. */
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
    { height: excel.row + 4, cells: groupRow },
    { height: excel.row + 4, cells: headingRow },
    ...report.lines.map(
      (line): XlsxRow => ({
        height: excel.row,
        cells: [
          { value: line.symbol, style: symbolCell },
          { value: line.volume, style: figureCell },
          { value: line.value, style: figureCell },
          gapCell,
          { value: line.uin, style: figureCell },
          { value: line.cm, style: figureCell },
        ],
      }),
    ),
    { cells: [{ value: `Source: ${source}`, style: text({ italic: true, size: 9, color: MUTED }) }] },
  ];

  return buildXlsx({
    title: `${title}, ${report.asOf}`,
    author: publisher.name,
    sheetName: 'Settlement',
    columns: widths.map((w) => Math.round(w * excel.widthScale * 2) / 2),
    rows: sheetRows,
    styles: styles.list,
    merges: [`A1:${bandEnd}1`, `A3:${bandEnd}3`, 'A6:A7', 'B6:C6', 'E6:F6'],
    freezeRows: 7,
    showGrid: false,
  });
}
