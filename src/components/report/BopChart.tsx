'use client';

import { useMemo } from 'react';
import { Skeleton, useDirection } from '@mantine/core';
import { Chart } from 'react-google-charts';
import {
  Logo,
  barChartOptions,
  formatNumber,
  mergeChartOptions,
  mirrorValueAxis,
  tokens,
  type Dir,
  type Scheme,
} from '@akseer/ask-analyst-design-system';

import { yearToDate } from '../../data/fiscalYear';
import type { BopMonth } from '../../data/types';

import classes from './ReportChart.module.css';

/* ============================================================================
 * BOP CHART — Historical Current A/c Balance
 * ============================================================================
 * The current account balance month by month as BARS, and its running total
 * for the fiscal year as a LINE over them (the user's choice, 2026-09-11):
 * a Google Charts ComboChart, as the user asked, built on the design
 * system's bar preset so its axes, grid, type and tooltip are the system's.
 * One value axis: both series are USD millions (the system's single-axis
 * rule). The line starts again each July, drawn as one series per fiscal
 * year so no stroke joins June to July.
 *
 * COLOURS are literal values — Google Charts cannot read CSS — so the bar
 * and line colours come in as props, from the Report style or the system's
 * chart palette, and the scheme is an input: the chart on screen follows
 * the page, the copy drawn for a download is always light.
 *
 * ACCESSIBILITY, as the system's AskChart does it: the picture is hidden
 * from assistive technology and a visually hidden table carries the same
 * figures, formatted as the sheet formats them.
 *
 * The downloads leave the chart out: they are the table part only.
 * ========================================================================= */

/** The benchmark's chart height. */
const CHART_HEIGHT = 400;
/** The benchmark's "Powered By" badge is 20px tall. */
const POWERED_BY_HEIGHT = tokens.iconSize.md;

const BAR_LABEL = 'Current A/c balance';
const LINE_LABEL = 'Fiscal year to date';

/** Space for the value axis's labels and its "USD mn" title, and for the legend. */
const AXIS_GUTTER = 80;
const EDGE = 16;
const LEGEND_SPACE = 40;
/** The plot's rough width on the desktop sheet, to size the bars. */
const PLOT_WIDTH = 430;

const amount = (value: number | null) => formatNumber(value, { decimals: 0, signStyle: 'parens' });

/** A Google data cell: the number to draw and the text its tooltip shows. */
const cell = (value: number | null) => (value === null ? null : { v: value, f: amount(value) });

export function BopChart({
  title,
  months,
  scheme,
  bar,
  line,
  fontName,
}: {
  title: string;
  months: readonly BopMonth[];
  scheme: Scheme;
  /** #rrggbb */
  bar: string;
  /** #rrggbb */
  line: string;
  /** The report's typeface, by family name, for the axes and legend. */
  fontName: string;
}) {
  const { dir } = useDirection();
  const points = useMemo(() => yearToDate(months), [months]);
  const years = useMemo(() => [...new Set(points.map((p) => p.fiscalYear))], [points]);

  const data = useMemo(
    () => [
      ['Month', BAR_LABEL, ...years.map(() => LINE_LABEL)],
      ...points.map((p) => [
        p.month.label,
        cell(p.month.balance),
        ...years.map((year) => (year === p.fiscalYear ? cell(p.total) : null)),
      ]),
    ],
    [points, years],
  );

  const options = useMemo(() => {
    const preset = barChartOptions(scheme, dir as Dir);
    const face = { fontName };
    const axisLabel = tokens.chartSurface[scheme].axisLabel;
    // Before mirroring, so the right-hand axis of the Arabic build gets them too.
    const themed = mergeChartOptions(preset, {
      fontName,
      vAxis: {
        textStyle: { ...preset.vAxis.textStyle, ...face },
        title: 'USD mn',
        titleTextStyle: { color: axisLabel, fontName, fontSize: preset.fontSize, italic: false },
        format: '#,##0;(#,##0)',
        // With minValue 0 from the preset, zero is always on the axis: a bar's
        // length is its size, so the bars always start at zero.
        maxValue: 0,
      },
      hAxis: { textStyle: { ...preset.hAxis.textStyle, ...face } },
      legend: { ...preset.legend, position: 'top', textStyle: { ...preset.legend.textStyle, ...face } },
    });
    const count = 1 + years.length;
    const mirrored = mirrorValueAxis(themed, dir as Dir, count) as typeof themed & {
      series?: Record<number, object>;
    };
    const series = Object.fromEntries(
      Array.from({ length: count }, (_, i) => [
        i,
        {
          ...mirrored.series?.[i],
          ...(i === 0
            ? { type: 'bars', color: bar }
            : {
                type: 'line',
                color: line,
                lineWidth: tokens.chartMark.lineWidth,
                pointSize: tokens.chartMark.markerSize,
                visibleInLegend: i === 1,
              }),
        },
      ]),
    );
    const perMonth = PLOT_WIDTH / Math.max(1, months.length);
    return {
      ...mirrored,
      seriesType: 'bars',
      series,
      focusTarget: 'category',
      bar: { groupWidth: Math.max(8, Math.min(40, Math.round(perMonth * 0.62))) },
      chartArea: {
        ...mirrored.chartArea,
        top: LEGEND_SPACE,
        ...(dir === 'rtl' ? { left: EDGE, right: AXIS_GUTTER } : { left: AXIS_GUTTER, right: EDGE }), // rtl-ok: Google Charts option keys; the axis is drawn on the right in Arabic
      },
    };
  }, [scheme, dir, fontName, years, bar, line, months.length]);

  return (
    <figure className={classes.figure}>
      <figcaption className={classes.title}>{title}</figcaption>

      {/* The picture, hidden from assistive technology: the table below
          carries the same figures in a form a screen reader can read. */}
      <div aria-hidden="true" className="ask-chart-frame">
        <Chart
          chartType="ComboChart"
          data={data}
          options={options}
          width="100%"
          height={`${CHART_HEIGHT}px`}
          loader={<Skeleton height={CHART_HEIGHT} radius="sm" />}
        />
      </div>

      {/* Hidden in a div, not by putting sr-only on the table: a table
          ignores the 1px width and widens to its text, and the page
          scrolled sideways by 70px. */}
      <div className="sr-only">
        <table>
          <caption>
            {title}: the current account balance each month and its total for the fiscal year, from July, in USD
            millions.
          </caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">{BAR_LABEL}</th>
              <th scope="col">{LINE_LABEL}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.month.month}>
                <th scope="row">{p.month.label}</th>
                <td>{amount(p.month.balance)}</td>
                <td>{amount(p.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={classes.powered}>
        Powered by <Logo height={POWERED_BY_HEIGHT} title="Ask Analyst" />
      </p>
    </figure>
  );
}
