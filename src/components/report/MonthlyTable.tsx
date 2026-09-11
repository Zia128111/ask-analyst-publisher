import type { CSSProperties } from 'react';
import { Table } from '@mantine/core';
import { NOT_AVAILABLE, formatNumber, formatPercent } from '@akseer/ask-analyst-design-system';

import type { MonthlyColumn, MonthlyRow, MonthlyValue } from '../../data/types';
import { MONTHLY_LOOK, type MonthlyLook } from './monthlyLook';

import classes from './MonthlyTable.module.css';

/* ============================================================================
 * MONTHLY TABLE — BOP, OMC sales, the trade sheets and the other
 * month-by-month reports
 * ============================================================================
 * Laid out as their benchmarks: one header row, the unit over the labels
 * ("(USD mn)", "K Tonnes") and the feed's own headings over the figures —
 * the month a year ago, last month, this month, the change on the month and
 * on the year, and from the second month of a fiscal year the year to date
 * then and now and its change. Labels at the inline-start, figures at the
 * inline-end, totals in bold. What each benchmark sets off is its `look`
 * (monthlyLook.ts): BOP and OMC tint the current month and year to date
 * from the header to the last row; the trade sheets tint nothing.
 *
 * NEGATIVE AMOUNTS are in accounting parentheses: (2,679). On BOP they are
 * also in the negative colour, as its live page prints them red — the
 * parentheses carry the sign, so the colour is emphasis and never the only
 * signal; the trade sheets print them in the text colour, as theirs do.
 * Changes are printed as published, "-60%", in the text colour, to the
 * feed's precision (`changeDecimals`: whole percent, or one decimal on the
 * trade feeds, where "8%" prints "8.0%" beside "10.4%"). "NM" is the feeds'
 * "not meaningful" and a missing figure the system's em dash; the view's
 * caption spells both out for screen readers.
 *
 * A line that details the one above it is indented a step (the trade
 * feeds' Textile), a section's name ("Exports", "Imports") is a row of its
 * own with no figures, and a blank line between sections (Trade-SBP's) is
 * drawn as a row and hidden from screen readers. Where the title band
 * carries the unit (Trade-SBP), the heading over the labels is blank on the
 * sheet and still read aloud. A line whose label alone is ambiguous ("MS"
 * under PSO and under Shell, "Foods" under Exports and under Imports) is
 * read with what it belongs to first — "PSO, MS" — from `group`, which is
 * not printed. "MoM" and "YoY" carry aria-labels naming what they compare
 * ("Aug-2026 on Jul-2026, % change"). On a narrow screen the table scrolls
 * inside its own region, with the labels pinned; no column is dropped.
 * ========================================================================= */

const changeLabel = (column: MonthlyColumn) =>
  column.compares ? `${column.compares.period} on ${column.compares.base}, % change` : undefined;

/** An amount in the report's unit, whole, negatives in parentheses: (2,679). */
const amount = (value: number | null) => formatNumber(value, { decimals: 0, signStyle: 'parens' });

/** A change as the feed publishes it, to its precision, with a minus; or NM. */
const change = (value: number | null, decimals: number) =>
  value === null ? NOT_AVAILABLE : formatPercent(value, { decimals, signStyle: 'minus' });

function Figure({
  column,
  value,
  changeDecimals,
  look,
}: {
  column: MonthlyColumn;
  value: MonthlyValue;
  changeDecimals: number;
  look: MonthlyLook;
}) {
  const negative = look.colourNegatives && column.kind === 'amount' && typeof value === 'number' && value < 0;
  return (
    <Table.Td
      data-numeric
      data-current={(look.tintCurrent && column.current) || undefined}
      data-negative={negative || undefined}
    >
      {value === 'NM' ? 'NM' : column.kind === 'amount' ? amount(value) : change(value, changeDecimals)}
    </Table.Td>
  );
}

export function MonthlyTable({
  units,
  columns,
  rows,
  labelledBy,
  caption,
  changeDecimals = 0,
  look = MONTHLY_LOOK,
}: {
  /** The heading over the labels: "(USD mn)", "K Tonnes". */
  units: string;
  columns: MonthlyColumn[];
  rows: MonthlyRow[];
  /** Id of the report's title; the scroll region takes its name. */
  labelledBy: string;
  caption: string;
  /** The changes' decimal places, as the feed publishes them (MonthlyReport). */
  changeDecimals?: number;
  look?: MonthlyLook;
}) {
  return (
    /* A scrolling region must be reachable by keyboard (tabIndex) and named
       (aria-labelledby), or a keyboard user cannot reach the hidden columns. */
    <div
      className={`ask-scroll-x ${classes.scroller}`}
      role="region"
      aria-labelledby={labelledBy}
      tabIndex={0}
      /* The design system's compact density, as on the other sheets. */
      data-density="compact"
      data-one-line={look.oneLineLabels || undefined}
    >
      <Table className={classes.table}>
        <caption className="sr-only">{caption}</caption>
        <Table.Thead>
          <Table.Tr>
            <Table.Th scope="col" className={classes.pin}>
              {look.unitsInTitle ? <span className="sr-only">{units}</span> : units}
            </Table.Th>
            {columns.map((column, i) => (
              <Table.Th
                key={i}
                scope="col"
                data-numeric
                data-current={(look.tintCurrent && column.current) || undefined}
                aria-label={changeLabel(column)}
              >
                {column.label}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, r) =>
            row.spacer ? (
              /* A blank line between sections, drawn as the benchmark draws it
                 (a row's height, its rule, the tint running through); nothing
                 in it to read, so screen readers skip it. */
              <Table.Tr key={r} aria-hidden="true" data-spacer>
                <Table.Td className={classes.pin}>&nbsp;</Table.Td>
                {columns.map((column, i) => (
                  <Table.Td key={i} data-current={(look.tintCurrent && column.current) || undefined} />
                ))}
              </Table.Tr>
            ) : (
              <Table.Tr key={r} data-bold={row.bold || undefined}>
                <Table.Th
                  scope="row"
                  className={classes.pin}
                  data-indent={row.indent || undefined}
                  style={row.indent ? ({ '--monthly-indent': row.indent } as CSSProperties) : undefined}
                >
                  {row.group && <span className="sr-only">{row.group}, </span>}
                  {row.label}
                </Table.Th>
                {columns.map((column, i) =>
                  /* A section's name has no figures: its cells stay empty, not dashed. */
                  row.heading ? (
                    <Table.Td key={i} data-current={(look.tintCurrent && column.current) || undefined} />
                  ) : (
                    <Figure
                      key={i}
                      column={column}
                      value={row.values[i] ?? null}
                      changeDecimals={changeDecimals}
                      look={look}
                    />
                  ),
                )}
              </Table.Tr>
            ),
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}
