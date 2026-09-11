'use client';

import { useMemo, useState } from 'react';
import { Skeleton, useDirection } from '@mantine/core';
import { Chart } from 'react-google-charts';
import {
  Logo,
  NOT_AVAILABLE,
  barChartOptions,
  formatNumber,
  formatPercent,
  mergeChartOptions,
  tokens,
  type Dir,
  type Scheme,
} from '@akseer/ask-analyst-design-system';

import type { RemittanceMonth } from '../../data/types';
import { remittanceAxes } from './remittanceAxes';

import classes from './ReportChart.module.css';

/* ============================================================================
 * REMITTANCE CHART — Workers' Remittances, month by month
 * ============================================================================
 * The benchmark's chart, as the live page draws it: the month's total as
 * BARS on a USD axis and its change on the year as a LINE on a percent
 * axis, in one plot, the legend under it naming both. Two value axes on one
 * chart is what the design system's single-axis rule refuses; this chart is
 * the one exception, the user's call (2026-09-11). What is kept: the bars
 * count up from zero (a bar's length is its size), and the two axes share
 * their gridlines (remittanceAxes), with zero on one of them, so neither
 * scale is stretched to suggest a match.
 *
 * The months are named every other one, upright, as in the benchmark; the
 * axes' units sit over them, "USD mn" at the bars' side and "%" at the
 * line's. In the Arabic build the two sides swap, the bars' axis on the
 * right.
 *
 * Google Charts, on the system's bar preset. COLOURS are literal values —
 * Google cannot read CSS — from the Report style or the system's chart
 * palette, and the scheme is an input: the chart on screen follows the
 * page, the copy drawn for a download is always light. The frame says when
 * the chart has drawn (`data-ready`), so a download waits for it.
 *
 * ACCESSIBILITY, as the system's AskChart does it: the picture is hidden
 * from assistive technology and a visually hidden table carries the same
 * figures, formatted as the sheet formats them.
 * ========================================================================= */

/** The benchmark's plot and its upright months, in the system's 400px chart height and a little more. */
const CHART_HEIGHT = 440;
/** The benchmark's "Powered By" badge is 20px tall. */
const POWERED_BY_HEIGHT = tokens.iconSize.md;

/** Room at each side for its axis's labels ("5,000", "-40%"). */
const AXIS_GUTTER = 56;
const TOP = 12;
/** Under the plot: the months upright, then the legend. */
const BOTTOM = 96;

export const TOTAL_LABEL = 'Total';
export const CHANGE_LABEL = 'YoY Change';

const amount = (value: number | null) => formatNumber(value, { decimals: 0 });
const change = (value: number | null) =>
  value === null ? NOT_AVAILABLE : formatPercent(value, { decimals: 1, signStyle: 'minus' });

export function RemittanceChart({
  title,
  months,
  scheme,
  bar,
  line,
  fontName,
}: {
  title: string;
  /** The months to draw, oldest first. */
  months: readonly RemittanceMonth[];
  scheme: Scheme;
  /** #rrggbb */
  bar: string;
  /** #rrggbb */
  line: string;
  /** The report's typeface, by family name, for the axes and legend. */
  fontName: string;
}) {
  const { dir } = useDirection();
  const [drawn, setDrawn] = useState(false);
  const axes = useMemo(() => remittanceAxes(months), [months]);

  const data = useMemo(
    () => [
      ['Month', TOTAL_LABEL, CHANGE_LABEL],
      ...months.map((m) => [
        m.label,
        m.total === null ? null : { v: m.total, f: amount(m.total) },
        /* Fractions on the percent axis; the tooltip reads as the table does. */
        m.yoy === null ? null : { v: m.yoy / 100, f: change(m.yoy) },
      ]),
    ],
    [months],
  );

  const options = useMemo(() => {
    const preset = barChartOptions(scheme, dir as Dir);
    const face = { fontName };
    const themed = mergeChartOptions(preset, {
      fontName,
      legend: { ...preset.legend, position: 'bottom', alignment: 'center', textStyle: { ...preset.legend.textStyle, ...face } },
      hAxis: {
        textStyle: { ...preset.hAxis.textStyle, ...face },
        slantedText: true,
        slantedTextAngle: 90,
        showTextEvery: 2,
      },
    });
    const { textStyle, gridlines, baselineColor } = preset.vAxis;
    const axisText = { ...textStyle, ...face };

    /* Google draws axis 0 on the left and axis 1 on the right; the Arabic
       build puts the bars' axis on the right. */
    const [barsAxis, lineAxis] = dir === 'rtl' ? [1, 0] : [0, 1];
    const { total, change: yoy } = axes;
    return {
      ...themed,
      seriesType: 'bars',
      focusTarget: 'category',
      bar: { groupWidth: '72%' },
      series: {
        0: { type: 'bars', targetAxisIndex: barsAxis, color: bar },
        1: { type: 'line', targetAxisIndex: lineAxis, color: line, lineWidth: tokens.chartMark.lineWidth, pointSize: 0 },
      },
      vAxes: {
        [barsAxis]: {
          textStyle: axisText,
          gridlines,
          minorGridlines: { count: 0 },
          baselineColor,
          viewWindow: { min: total.min, max: total.max },
          ticks: total.ticks.map((v) => ({ v, f: amount(v) })),
        },
        [lineAxis]: {
          textStyle: axisText,
          /* Its gridlines are the bars' axis's, at the same heights. */
          gridlines: { color: 'transparent' },
          minorGridlines: { count: 0 },
          baselineColor,
          viewWindow: { min: yoy.min / 100, max: yoy.max / 100 },
          ticks: yoy.ticks.map((v) => ({ v: v / 100, f: formatPercent(v, { decimals: 0, signStyle: 'minus' }) })),
        },
      },
      chartArea: { ...themed.chartArea, top: TOP, bottom: BOTTOM, left: AXIS_GUTTER, right: AXIS_GUTTER }, // rtl-ok: Google Charts option keys; the gutters are even
    };
  }, [scheme, dir, fontName, bar, line, axes]);

  return (
    <figure className={classes.figure}>
      <figcaption className={classes.title}>{title}</figcaption>

      {/* The picture, hidden from assistive technology: the table below
          carries the same figures in a form a screen reader can read. */}
      <div aria-hidden="true" className="ask-chart-frame" data-chart data-ready={drawn || undefined}>
        <p className={classes.axes}>
          <span>USD mn</span>
          <span>%</span>
        </p>
        <Chart
          chartType="ComboChart"
          data={data}
          options={options}
          chartEvents={[{ eventName: 'ready', callback: () => setDrawn(true) }]}
          width="100%"
          height={`${CHART_HEIGHT}px`}
          loader={<Skeleton height={CHART_HEIGHT} radius="sm" />}
        />
      </div>

      {/* Hidden in a div, not by putting sr-only on the table: a table
          ignores the 1px width and widens to its text (finding 8). */}
      <div className="sr-only">
        <table>
          <caption>
            {title}, month by month: the total in USD millions, and its change on the same month a year before, in
            percent.
          </caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">{TOTAL_LABEL}, USD millions</th>
              <th scope="col">{CHANGE_LABEL}, %</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month}>
                <th scope="row">{m.label}</th>
                <td>{amount(m.total)}</td>
                <td>{change(m.yoy)}</td>
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
