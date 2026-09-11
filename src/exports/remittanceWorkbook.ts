import { tokens } from '@akseer/ask-analyst-design-system/tokens';

import { textOn } from '../branding/contrast';
import { CHART_DEFAULTS, REPORT_SIZES, fontById, type Branding } from '../branding/types';
import type { MonthlyLook } from '../components/report/monthlyLook';
import { remittanceAxes } from '../components/report/remittanceAxes';
import type { Publisher, RemittanceMonth, RemittanceReport } from '../data/types';
import {
  buildXlsx,
  styleRegistry,
  type XlsxChart,
  type XlsxEdge,
  type XlsxFont,
  type XlsxRow,
  type XlsxSheet,
  type XlsxStyle,
} from '../lib/xlsx';
import { monthlySheet, type MonthlyWorkbookStyle } from './monthlyWorkbook';

/* ============================================================================
 * REMITTANCE — Excel download
 * ============================================================================
 * Two sheets, as the sheet has two parts:
 *
 *   Remittances  the month by country, laid out as the other monthly
 *                reports' workbooks (monthlyWorkbook.ts): letterhead, table,
 *                this month filled, changes as fractions under "0.0%".
 *   History      the months the chart draws — the month as a date shown
 *                "mmm-yy", the total in USD millions, its change on the year
 *                as a fraction under "0.0%" — and beside them the chart as a
 *                NATIVE Excel chart drawn from those cells, as on the sheet:
 *                the total as columns on the left axis, the change as a line
 *                on the right, the two axes fixed to the sheet's scales so
 *                their gridlines match (remittanceAxes).
 *
 * Colours are the design system's light tokens, or the Report style's where
 * the publisher has chosen them. Imports only server-safe modules, so it
 * also runs in Node.
 * ========================================================================= */

const color = tokens.semanticLight;
const INK = color['text-primary'];
const MUTED = color['text-tertiary'];
const BAND = color['bg-brand-subtle'];
const RULE = color['border-brand'];
const CHART = tokens.chartSurface.light;

/** The parts of the Report style a workbook carries. */
export type RemittanceWorkbookStyle = MonthlyWorkbookStyle & Pick<Branding, 'bar' | 'line'>;

const TOTAL_FORMAT = '#,##0';
const CHANGE_FORMAT = '0.0%';
/** Character units at 11pt: the month, the two figures. */
const HISTORY_WIDTHS = [10, 16, 16] as const;
/** Where the history's header sits (zero-based); its months follow. */
const HEADER_ROW = 3;
/**
 * The chart's place, right of the figures and under the frozen header, so
 * it does not straddle the frozen pane: columns E to P, rows 5 to 30.
 */
const CHART_AREA = { from: { column: 4, row: HEADER_ROW + 1 }, to: { column: 16, row: HEADER_ROW + 27 } } as const;
/** Name every other month on the axis, as the sheet does. */
const LABEL_EVERY = 2;

/** -9.4 (percent) -> -0.094, without floating-point dust. */
const fraction = (percent: number) => Math.round(percent * 1e6) / 1e8;

export function buildRemittanceWorkbook({
  report,
  months,
  title,
  chartTitle,
  labels,
  publisher,
  attribution,
  source,
  style,
  look,
}: {
  report: RemittanceReport;
  /** The months the chart draws, oldest first. */
  months: readonly RemittanceMonth[];
  /** "Workers’ Remittances (USD Mn)". */
  title: string;
  /** "Workers’ Remittances", over the chart. */
  chartTitle: string;
  /** The panels' names: "Total (USD mn)", "YoY change (%)". */
  labels: { total: string; change: string };
  publisher: Publisher;
  attribution: string;
  source: string;
  style: RemittanceWorkbookStyle;
  look: MonthlyLook;
}): Uint8Array {
  const styles = styleRegistry();
  const table = monthlySheet(
    { report, title, sheetName: 'Remittances', publisher, attribution, source, style, look },
    styles,
  );

  const excel = REPORT_SIZES[style.size].excel;
  const size = excel.size;
  const typeface = fontById(style.font);
  const face: XlsxFont = { name: typeface.excelName, family: typeface.excelFamily };
  const fill = style.fill ?? BAND;
  const onFill = style.fill ? textOn(style.fill).color : INK;
  const rule: XlsxEdge = { style: 'thin', color: style.rule ?? RULE };
  const text = (font: XlsxFont, extra: XlsxStyle = {}) => styles.add({ font: { ...face, ...font }, ...extra });

  const head = (h: 'left' | 'right') =>
    text({ bold: true, size, color: onFill }, { fill, top: rule, bottom: rule, h, v: 'center' });
  const monthCell = text({ size, color: INK }, { bottom: rule, h: 'left', numFmt: 'mmm-yy' });
  const figureCell = (numFmt: string) => text({ size, color: INK }, { bottom: rule, h: 'right', numFmt });

  const rows: XlsxRow[] = [
    { height: 24, cells: [{ value: chartTitle, style: text({ bold: true, size: 13, color: INK }) }] },
    {
      cells: [
        {
          value: 'The total each month in USD millions, and its change on the same month a year before.',
          style: text({ size: 9, color: MUTED }),
        },
      ],
    },
    { cells: [] },
    {
      height: excel.row + 4,
      cells: [
        { value: 'Month', style: head('left') },
        { value: `${labels.total} (USD mn)`, style: head('right') },
        { value: `${labels.change} (%)`, style: head('right') },
      ],
    },
    ...months.map(
      (m): XlsxRow => ({
        height: excel.row,
        cells: [
          { value: new Date(`${m.month}-01T00:00:00Z`), style: monthCell },
          { value: m.total, style: figureCell(TOTAL_FORMAT) },
          { value: m.yoy === null ? null : fraction(m.yoy), style: figureCell(CHANGE_FORMAT) },
        ],
      }),
    ),
    { cells: [] },
    { cells: [{ value: `Source: ${source}`, style: text({ italic: true, size: 9, color: MUTED }) }] },
  ];

  const firstMonth = HEADER_ROW + 1;
  const lastMonth = HEADER_ROW + months.length;
  const span = `${months[0]?.label ?? ''} to ${months[months.length - 1]?.label ?? ''}`;
  const axes = remittanceAxes(months);
  const charts: XlsxChart[] = [
    {
      kind: 'column',
      anchor: CHART_AREA,
      description:
        `Combination chart: ${chartTitle}, ${span} — ${labels.total} in USD millions as columns on the left ` +
        `axis, ${labels.change} in percent as a line on the right axis.`,
      seriesName: labels.total,
      categories: months.map((m) => m.label),
      values: { column: 1, firstRow: firstMonth, lastRow: lastMonth },
      cached: months.map((m) => m.total),
      color: style.bar ?? CHART_DEFAULTS.bar,
      axisFormat: TOTAL_FORMAT,
      scale: axes.total,
      second: {
        seriesName: labels.change,
        values: { column: 2, firstRow: firstMonth, lastRow: lastMonth },
        cached: months.map((m) => (m.yoy === null ? null : fraction(m.yoy))),
        color: style.line ?? CHART_DEFAULTS.line,
        axisFormat: '0%',
        scale: { min: axes.change.min / 100, max: axes.change.max / 100, step: axes.change.step / 100 },
      },
      labelEvery: LABEL_EVERY,
      font: { name: typeface.excelName, size: 9, color: CHART.axisLabel },
      gridColor: CHART.grid,
      axisColor: CHART.axis,
      background: CHART.surface,
    },
  ];

  const history: XlsxSheet = {
    name: 'History',
    columns: HISTORY_WIDTHS.map((w) => Math.round(w * excel.widthScale * 2) / 2),
    rows,
    freezeRows: HEADER_ROW + 1,
    showGrid: false,
    charts,
  };

  return buildXlsx({
    title: `${title}, ${report.asOf}`,
    author: publisher.name,
    styles: styles.list,
    sheets: [table, history],
  });
}
