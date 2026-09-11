import { tokens } from '@akseer/ask-analyst-design-system/tokens';

import { textOn } from '../branding/contrast';
import { CHART_DEFAULTS, REPORT_SIZES, fontById, type Branding } from '../branding/types';
import type { PortfolioLine, PortfolioReport, Publisher } from '../data/types';
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
 * PORTFOLIO INVESTMENT — Excel download
 * ============================================================================
 * BOTH TABLES AND THE CHART in one sheet, as the user asked: the letterhead,
 * the main table with its sectors and source, then the second table with
 * the chart beside it, as on the page. Built from the DATA, so every figure
 * is a real number at the feed's precision — (0.29) is -0.292162 — and the
 * chart is Excel's own, drawn from the second table's Net cells: change a
 * figure and its bar follows. Its bars carry the page's names ("FIPI",
 * "Broker").
 *
 * Figures show as the sheet prints them, two decimals in parentheses, and a
 * figure that rounds to zero shows 0.00 rather than (0.00) — a conditional
 * number format, checked in Excel 16.
 *
 * Laid out like the sheet: the publisher and title on tinted bands, the
 * date, the masthead in words (a workbook cannot carry the logo), each
 * table's two-row header — the band naming its parts, then the headings —
 * tinted between two rules, the net totals bold and the main table's Net
 * column tinted. Colours are the design system's light tokens, or the Report
 * style's where the publisher has chosen them. Landscape, to print the
 * fifteen columns across one page.
 *
 * Imports only server-safe modules, so it also runs in Node.
 * ========================================================================= */

const color = tokens.semanticLight;
const INK = color['text-primary'];
const SECONDARY = color['text-secondary'];
const MUTED = color['text-tertiary'];
const BAND = color['bg-brand-subtle'];
const RULE = color['border-brand'];
const CHART = tokens.chartSurface.light;

/** The parts of the Report style a workbook carries. */
export type PortfolioWorkbookStyle = Pick<Branding, 'font' | 'size' | 'rule' | 'fill' | 'highlight' | 'bar'>;

/** Two decimals, negatives in parentheses, and zero for anything that rounds to it. */
const FLOW_FORMAT = '[<=-0.005](#,##0.00);[>=0.005]#,##0.00;0.00';
const AXIS_FORMAT = '#,##0.0;(#,##0.0)';

/** Excel's character units at 11pt. */
const WIDTH = { flow: 10, sector: 10 };
const LABEL_WIDTH = { min: 16, max: 40 };
/** The bands span columns until they hold a 48-character company name at 12pt. */
const BAND_WIDTH = 50;
/** The chart's cells: from the column after the second table's gap, this many rows tall. */
const CHART_ROWS = 16;

const FLOWS = ['Buy', 'Sell', 'Net'] as const;

/** 0 -> A. The sheet has fifteen columns, so one letter always does. */
const letter = (index: number) => String.fromCharCode(65 + index);

export function buildPortfolioWorkbook({
  report,
  title,
  publisher,
  attribution,
  source,
  style,
}: {
  report: PortfolioReport;
  /** "FIPI / LIPI Daily Movement". */
  title: string;
  publisher: Publisher;
  /** Who the report is published under, in words. '' leaves the line empty. */
  attribution: string;
  source: string;
  style: PortfolioWorkbookStyle;
}): Uint8Array {
  const { sectors, lines, summary } = report;
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
  const text = (font: XlsxFont, extra: XlsxStyle = {}) => styles.add({ font: { ...face, ...font }, ...extra });

  /* The letterhead's bands, and each table's header: its band between the
     top rule and its headings, the headings above the bottom rule. */
  const band = (points: number, h: 'left' | 'center' = 'left', top?: XlsxEdge) =>
    text({ bold: true, size: points, color: onFill }, { fill, h, v: 'center', ...(top ? { top } : {}) });
  const heading = text({ bold: true, size, color: onFill }, { fill, bottom: rule, h: 'right', v: 'center' });
  const labelCell = (bold: boolean) =>
    text({ bold, size, color: INK }, { bottom: rule, h: 'left', v: 'center', wrap: true });
  const figure = (value: number | null, bold: boolean, filled: boolean): XlsxCell => ({
    value,
    style: text(
      { bold, size, color: filled ? onHighlight : INK },
      { bottom: rule, h: 'right', v: 'center', numFmt: FLOW_FORMAT, ...(filled ? { fill: highlight } : {}) },
    ),
  });
  const note = (value: string) => ({ value, style: text({ italic: true, size: 9, color: MUTED }) });

  const columnCount = 1 + FLOWS.length + sectors.length;
  const longest = Math.max('Portfolio Investment'.length, ...[...lines, ...summary].map((l) => l.label.length));
  const labelWidth = Math.min(LABEL_WIDTH.max, Math.max(LABEL_WIDTH.min, Math.ceil(longest * 1.1) + 2));
  const widths = [labelWidth, ...FLOWS.map(() => WIDTH.flow), ...sectors.map(() => WIDTH.sector)];

  /* The letterhead's bands run across as many columns as a long company name needs. */
  let bandColumns = 1;
  for (let sum = widths[0]; sum < BAND_WIDTH && bandColumns < widths.length; bandColumns += 1) sum += widths[bandColumns];
  const bandRow = (value: string, style: number, height: number): XlsxRow => ({
    height,
    cells: Array.from({ length: bandColumns }, (_, i) => ({ value: i === 0 ? value : null, style })),
  });

  /** A table's band and headings, and its lines. */
  const table = (rows: readonly PortfolioLine[], withSectors: boolean, highlightNet: boolean): XlsxRow[] => {
    const span = band(size, 'center', rule);
    const count = 1 + FLOWS.length + (withSectors ? sectors.length : 0);
    return [
      {
        height: excel.row + 4,
        cells: Array.from({ length: count }, (_, i) => ({
          value: i === 0 ? 'Portfolio Investment' : i === 1 ? '(Figures in USD mn)' : i === 4 ? 'Sector Wise Investment' : null,
          style: i === 0 ? band(size, 'left', rule) : span,
        })),
      },
      {
        height: excel.row + 4,
        cells: [
          { value: null, style: heading },
          ...FLOWS.map((f) => ({ value: f, style: heading })),
          ...(withSectors ? sectors.map((s) => ({ value: s, style: heading })) : []),
        ],
      },
      ...rows.map(
        (line): XlsxRow => ({
          height: excel.row,
          cells: [
            { value: line.label, style: labelCell(line.bold) },
            figure(line.buy, line.bold, false),
            figure(line.sell, line.bold, false),
            figure(line.net, line.bold, highlightNet),
            ...(withSectors ? sectors.map((_, i) => figure(line.sectors[i] ?? null, line.bold, false)) : []),
          ],
        }),
      ),
    ];
  };

  const letterhead: XlsxRow[] = [
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
  ];
  const main = table(lines, true, true);
  const second = table(summary, false, false);

  /* Row indices, zero-based, of each table's band. */
  const mainTop = letterhead.length;
  const secondTop = mainTop + main.length + 2;
  const sheetRows: XlsxRow[] = [
    ...letterhead,
    ...main,
    { cells: [note(`Source: ${source}`)] },
    { cells: [] },
    ...second,
    { cells: [note(`Source: ${source}`)] },
  ];

  /* The chart's bars are the second table's last lines — the foreign net,
     then each local type — in the same order (src/data/portfolio.ts). */
  const firstBar = summary.length - report.chart.length;
  report.chart.forEach((bar, i) => {
    if (summary[firstBar + i]?.net !== bar.net) throw new Error(`Chart bar "${bar.label}" is not in the second table`);
  });
  const firstBarRow = secondTop + 2 + firstBar;
  const chartColumn = 1 + FLOWS.length + 1;
  const excelRow = (index: number) => index + 1;

  return buildXlsx({
    title: `${title}, ${report.asOf}`,
    author: publisher.name,
    sheetName: 'Portfolio Investment',
    columns: widths.map((w) => Math.round(w * excel.widthScale * 2) / 2),
    rows: sheetRows,
    styles: styles.list,
    merges: [
      `A1:${letter(bandColumns - 1)}1`,
      `A3:${letter(bandColumns - 1)}3`,
      `B${excelRow(mainTop)}:D${excelRow(mainTop)}`,
      `E${excelRow(mainTop)}:${letter(columnCount - 1)}${excelRow(mainTop)}`,
      `B${excelRow(secondTop)}:D${excelRow(secondTop)}`,
    ],
    showGrid: false,
    orientation: 'landscape',
    charts: [
      {
        anchor: {
          from: { column: chartColumn, row: secondTop },
          to: { column: columnCount, row: secondTop + CHART_ROWS },
        },
        description: `Column chart: the day's net portfolio investment by investor type, USD millions — ${report.chart
          .map((b) => b.label)
          .join(', ')}.`,
        seriesName: 'Net',
        categories: report.chart.map((b) => b.label),
        values: { column: 3, firstRow: firstBarRow, lastRow: firstBarRow + report.chart.length - 1 },
        cached: report.chart.map((b) => b.net),
        color: style.bar ?? CHART_DEFAULTS.bar,
        labelFormat: FLOW_FORMAT,
        axisFormat: AXIS_FORMAT,
        axisTitle: 'USD mn',
        font: { name: typeface.excelName, size: 9, color: CHART.axisLabel },
        gridColor: CHART.grid,
        axisColor: CHART.axis,
        background: CHART.surface,
      },
    ],
  });
}
