'use client';

import { useMemo } from 'react';
import { Skeleton, useDirection } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { Chart } from 'react-google-charts';
import {
  Logo,
  barChartOptions,
  mergeChartOptions,
  mirrorValueAxis,
  tokens,
  type Dir,
  type Scheme,
} from '@akseer/ask-analyst-design-system';

import type { PortfolioBar } from '../../data/types';
import { flowFigure } from './flowFigure';

import classes from './ReportChart.module.css';

/* ============================================================================
 * PORTFOLIO CHART — the day's net by investor type
 * ============================================================================
 * The benchmark's column chart beside the second table: one bar per
 * investor type — the foreign investors' net (FIPI), then each local type's —
 * its value printed at the bar's end as the table prints it, "(0.29)", and
 * a "USD mn" value axis. A Google Charts column chart on the design system's
 * bar preset, so its axes, grid, type and tooltip are the system's and its
 * baseline is zero: a bar's length is its size.
 *
 * The bar colour is a literal — Google Charts cannot read CSS — from the
 * Report style or the system's palette, and the scheme is an input, so the
 * chart follows the page.
 *
 * NARROW, it reads as the benchmark prints it: the investor types stand
 * upright under their bars, and the bars carry no figures, which would run
 * into each other at a phone's width — the table above has them.
 *
 * ACCESSIBILITY, as the system's AskChart does it: the picture is hidden
 * from assistive technology, and a visually hidden table carries the same
 * figures. The figure is named by a hidden caption (the benchmark prints no
 * title over the chart). "Powered by" + the Ask Analyst logo sit under it,
 * as in the benchmark.
 * ========================================================================= */

/** The benchmark's chart is 368px tall; the system's bar charts sit at 400. */
const CHART_HEIGHT = 400;
/** The benchmark's "Powered By" badge is 20px tall. */
const POWERED_BY_HEIGHT = tokens.iconSize.md;

/** Space for the value axis's labels and its "USD mn" title. */
const AXIS_GUTTER = 72;
const EDGE = 16;
/** Room above the tallest bar for its label. */
const TOP_SPACE = 24;
/** Room under the plot for the investor types: two lines where they wrap, or upright. */
const CATEGORY_SPACE = { level: 48, upright: 96 };
/**
 * Narrower than this, nine bars leave each figure less room than "(12.11)"
 * takes, so the figures would collide and the names be cut.
 */
const NARROW = 560;

export function PortfolioChart({
  title,
  bars,
  scheme,
  bar,
  fontName,
}: {
  /** Names the figure for assistive technology; not printed. */
  title: string;
  bars: readonly PortfolioBar[];
  scheme: Scheme;
  /** #rrggbb */
  bar: string;
  /** The report's typeface, by family name, for the axes and labels. */
  fontName: string;
}) {
  const { dir } = useDirection();
  const { ref, width } = useElementSize();
  /* Unmeasured (the first render) counts as wide, the desktop layout. */
  const narrow = width > 0 && width < NARROW;

  const data = useMemo(
    () => [
      ['Investor type', 'Net', ...(narrow ? [] : [{ role: 'annotation' }])],
      ...bars.map((b) => [
        b.label,
        b.net === null ? null : { v: b.net, f: flowFigure(b.net) },
        ...(narrow ? [] : [flowFigure(b.net)]),
      ]),
    ],
    [bars, narrow],
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
        format: '#,##0.##;(#,##0.##)',
        // With minValue 0 from the preset, zero is always on the axis, so
        // every bar starts at zero whichever way the day went.
        maxValue: 0,
      },
      hAxis: {
        textStyle: { ...preset.hAxis.textStyle, ...face },
        slantedText: narrow,
        slantedTextAngle: 90,
        maxTextLines: 2,
        showTextEvery: 1,
      },
      annotations: {
        alwaysOutside: true,
        stem: { length: 4, color: 'transparent' },
        textStyle: { color: axisLabel, fontName, fontSize: preset.fontSize, bold: false, auraColor: 'none' },
      },
    });
    const mirrored = mirrorValueAxis(themed, dir as Dir, 1) as typeof themed & {
      series?: Record<number, object>;
    };
    return {
      ...mirrored,
      series: { 0: { ...mirrored.series?.[0], color: bar } },
      bar: { groupWidth: '56%' },
      chartArea: {
        ...mirrored.chartArea,
        top: TOP_SPACE,
        bottom: narrow ? CATEGORY_SPACE.upright : CATEGORY_SPACE.level,
        ...(dir === 'rtl' ? { left: EDGE, right: AXIS_GUTTER } : { left: AXIS_GUTTER, right: EDGE }), // rtl-ok: Google Charts option keys; the axis is drawn on the right in Arabic
      },
    };
  }, [scheme, dir, fontName, bar, narrow]);

  return (
    <figure ref={ref} className={classes.figure}>
      <figcaption className="sr-only">{title}</figcaption>

      {/* The picture, hidden from assistive technology: the table below
          carries the same figures in a form a screen reader can read. */}
      <div aria-hidden="true" className="ask-chart-frame">
        <Chart
          chartType="ColumnChart"
          data={data}
          options={options}
          width="100%"
          height={`${CHART_HEIGHT}px`}
          loader={<Skeleton height={CHART_HEIGHT} radius="sm" />}
        />
      </div>

      {/* Hidden in a div, not by putting sr-only on the table: a table
          ignores the 1px width and widens to its text (finding 8). */}
      <div className="sr-only">
        <table>
          <caption>{title}, in USD millions.</caption>
          <thead>
            <tr>
              <th scope="col">Investor type</th>
              <th scope="col">Net</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((b) => (
              <tr key={b.label}>
                <th scope="row">{b.label}</th>
                <td>{flowFigure(b.net)}</td>
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
