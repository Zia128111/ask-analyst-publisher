import { tokens } from '@akseer/ask-analyst-design-system/tokens';

import { textOn } from '../branding/contrast';
import { REPORT_SIZES, fontById } from '../branding/types';
import type { MonthlyLook } from '../components/report/monthlyLook';
import type { CementReport, Publisher } from '../data/types';
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
 * CEMENT — Excel download
 * ============================================================================
 * Two sheets, as the sheet has two parts:
 *
 *   Cement    the latest five weeks by region, laid out as the other
 *             monthly reports' workbooks (monthlyWorkbook.ts): letterhead,
 *             table, source.
 *   History   every week the chart draws — the week as a date shown
 *             "dd-mmm-yy", each region's price — and beside them the chart
 *             as a NATIVE Excel line chart drawn from those cells, both
 *             regions on one axis, in the palette's colours as on the sheet.
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

const PRICE_FORMAT = '#,##0';
/** Character units at 11pt: the week, then a column per region. */
const WEEK_WIDTH = 11;
const REGION_WIDTH = 15;
/** Where the history's header sits (zero-based); its weeks follow. */
const HEADER_ROW = 3;
/** The chart's place, right of the figures and under the frozen header: columns F to Q, rows 5 to 28. */
const CHART_AREA = { from: { column: 5, row: HEADER_ROW + 1 }, to: { column: 17, row: HEADER_ROW + 25 } } as const;
/** Name every fourth week on the axis, about once a month. */
const LABEL_EVERY = 4;

export function buildCementWorkbook({
  report,
  title,
  chartTitle,
  publisher,
  attribution,
  source,
  style,
  look,
}: {
  report: CementReport;
  /** "Cement Price History (PKR/bag)". */
  title: string;
  /** Over the history: "Cement Price History". */
  chartTitle: string;
  publisher: Publisher;
  attribution: string;
  source: string;
  style: MonthlyWorkbookStyle;
  look: MonthlyLook;
}): Uint8Array {
  const styles = styleRegistry();
  const table = monthlySheet({ report, title, sheetName: 'Cement', publisher, attribution, source, style, look }, styles);

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
  const weekCell = text({ size, color: INK }, { bottom: rule, h: 'left', numFmt: 'dd-mmm-yy' });
  const priceCell = text({ size, color: INK }, { bottom: rule, h: 'right', numFmt: PRICE_FORMAT });

  const [north, south] = report.series;
  const weeks = (north?.points ?? []).map((p) => p.date);
  const priceOn = (series: CementReport['series'][number] | undefined, date: string) =>
    series?.points.find((p) => p.date === date)?.value ?? null;

  const rows: XlsxRow[] = [
    { height: 24, cells: [{ value: chartTitle, style: text({ bold: true, size: 13, color: INK }) }] },
    {
      cells: [
        { value: 'The price of a bag of cement each week, by region, in rupees.', style: text({ size: 9, color: MUTED }) },
      ],
    },
    { cells: [] },
    {
      height: excel.row + 4,
      cells: [
        { value: 'Week', style: head('left') },
        ...report.series.map((s) => ({ value: `${s.label} (PKR/bag)`, style: head('right') })),
      ],
    },
    ...weeks.map(
      (date): XlsxRow => ({
        height: excel.row,
        cells: [
          { value: new Date(`${date}T00:00:00Z`), style: weekCell },
          ...report.series.map((s) => ({ value: priceOn(s, date), style: priceCell })),
        ],
      }),
    ),
    { cells: [] },
    { cells: [{ value: `Source: ${source}`, style: text({ italic: true, size: 9, color: MUTED }) }] },
  ];

  const firstWeek = HEADER_ROW + 1;
  const lastWeek = HEADER_ROW + weeks.length;
  const labels = (north?.points ?? []).map((p) => p.label);
  const span = `${labels[0] ?? ''} to ${labels[labels.length - 1] ?? ''}`;
  const charts: XlsxChart[] = north
    ? [
        {
          kind: 'line',
          anchor: CHART_AREA,
          description: `Line chart: ${chartTitle}, ${span} — the price of a bag in the ${report.series
            .map((s) => s.label)
            .join(' and ')}, rupees.`,
          seriesName: north.label,
          categories: labels,
          values: { column: 1, firstRow: firstWeek, lastRow: lastWeek },
          cached: weeks.map((date) => priceOn(north, date)),
          color: tokens.chartCategorical[0],
          axisFormat: PRICE_FORMAT,
          ...(south
            ? {
                second: {
                  axis: 'primary' as const,
                  seriesName: south.label,
                  values: { column: 2, firstRow: firstWeek, lastRow: lastWeek },
                  cached: weeks.map((date) => priceOn(south, date)),
                  color: tokens.chartCategorical[1],
                  axisFormat: PRICE_FORMAT,
                },
              }
            : {}),
          labelEvery: LABEL_EVERY,
          font: { name: typeface.excelName, size: 9, color: CHART.axisLabel },
          gridColor: CHART.grid,
          axisColor: CHART.axis,
          background: CHART.surface,
        },
      ]
    : [];

  const history: XlsxSheet = {
    name: 'History',
    columns: [WEEK_WIDTH, ...report.series.map(() => REGION_WIDTH)].map((w) => Math.round(w * excel.widthScale * 2) / 2),
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
