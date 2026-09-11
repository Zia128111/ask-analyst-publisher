'use client';

import { useMemo, useState } from 'react';
import { Skeleton, useDirection } from '@mantine/core';
import { Chart } from 'react-google-charts';
import {
  formatNumber,
  lineChartOptions,
  mergeChartOptions,
  mirrorValueAxis,
  tokens,
  type Dir,
  type Scheme,
} from '@akseer/ask-analyst-design-system';

import type { PriceSeries } from '../../data/types';

import classes from './ReportChart.module.css';

/* ============================================================================
 * CEMENT CHART — the price of a bag, week by week, by region
 * ============================================================================
 * The benchmark's chart under the table: one line per region over the
 * year's weeks, smoothed as the live page draws them, the legend under the
 * plot. A Google Charts line chart on the design system's line preset — its
 * value axis fits the prices ('pretty', not from zero: a level, not a size)
 * — with a DATE axis, so a week the survey skipped leaves its gap in time,
 * the months named along it.
 *
 * COLOURS are the system's chart palette in its fixed order, keyed by the
 * series (North first) — Google Charts cannot read CSS — and the scheme is
 * an input: the chart on screen follows the page, the copy drawn for a
 * download is always light. The frame says when the chart has drawn
 * (`data-ready`), so a download waits for it.
 *
 * ACCESSIBILITY, as the system's AskChart does it: the picture is hidden
 * from assistive technology and a visually hidden table carries the same
 * figures. The benchmark prints no title over the chart; a hidden caption
 * names it.
 * ========================================================================= */

/** The benchmark's plot, its months and legend under it. */
const CHART_HEIGHT = 340;
const AXIS_GUTTER = 56;
const EDGE = 16;
const TOP = 12;
/** Under the plot: the months, then the legend. */
const BOTTOM = 64;

const price = (value: number | null) => formatNumber(value, { decimals: 0 });

/** "2026-09-10" -> a Date at that day, for the date axis. */
const dayOf = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function CementChart({
  title,
  series,
  scheme,
  fontName,
}: {
  /** Names the figure for assistive technology; not printed. */
  title: string;
  series: readonly PriceSeries[];
  scheme: Scheme;
  /** The report's typeface, by family name, for the axes and legend. */
  fontName: string;
}) {
  const { dir } = useDirection();
  const [drawn, setDrawn] = useState(false);

  /* Every week any region has, oldest first, each region's price then. */
  const weeks = useMemo(() => {
    const byDate = new Map<string, string>();
    for (const s of series) for (const p of s.points) byDate.set(p.date, p.label);
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, label]) => ({ date, label }));
  }, [series]);

  const data = useMemo(
    () => [
      ['Week', ...series.map((s) => s.label)],
      ...weeks.map((week) => [
        { v: dayOf(week.date), f: week.label },
        ...series.map((s) => {
          const value = s.points.find((p) => p.date === week.date)?.value ?? null;
          return value === null ? null : { v: value, f: price(value) };
        }),
      ]),
    ],
    [series, weeks],
  );

  const options = useMemo(() => {
    const preset = lineChartOptions(scheme, dir as Dir, { curve: true });
    const face = { fontName };
    const themed = mergeChartOptions(preset, {
      fontName,
      legend: { ...preset.legend, position: 'bottom', alignment: 'center', textStyle: { ...preset.legend.textStyle, ...face } },
      vAxis: { textStyle: { ...preset.vAxis.textStyle, ...face }, format: '#,##0' },
      hAxis: { textStyle: { ...preset.hAxis.textStyle, ...face }, format: 'MMM yy' },
    });
    const mirrored = mirrorValueAxis(themed, dir as Dir, series.length) as typeof themed & {
      series?: Record<number, object>;
    };
    return {
      ...mirrored,
      /* The palette in its fixed order, one colour per region. */
      series: Object.fromEntries(
        series.map((_, i) => [
          i,
          { ...mirrored.series?.[i], color: tokens.chartCategorical[i % tokens.chartCategorical.length] },
        ]),
      ),
      chartArea: {
        ...mirrored.chartArea,
        top: TOP,
        bottom: BOTTOM,
        ...(dir === 'rtl' ? { left: EDGE, right: AXIS_GUTTER } : { left: AXIS_GUTTER, right: EDGE }), // rtl-ok: Google Charts option keys; the axis is drawn on the right in Arabic
      },
    };
  }, [scheme, dir, fontName, series]);

  return (
    <figure className={classes.figure}>
      <figcaption className="sr-only">{title}</figcaption>

      {/* The picture, hidden from assistive technology: the table below
          carries the same figures in a form a screen reader can read. */}
      <div aria-hidden="true" className="ask-chart-frame" data-chart data-ready={drawn || undefined}>
        <Chart
          chartType="LineChart"
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
          <caption>{title}: the price of a bag of cement each week, by region, in rupees.</caption>
          <thead>
            <tr>
              <th scope="col">Week</th>
              {series.map((s) => (
                <th key={s.label} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week.date}>
                <th scope="row">{week.label}</th>
                {series.map((s) => (
                  <td key={s.label}>{price(s.points.find((p) => p.date === week.date)?.value ?? null)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
