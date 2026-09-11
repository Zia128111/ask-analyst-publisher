import { Table } from '@mantine/core';
import { formatNumber } from '@akseer/ask-analyst-design-system';

import { decimalsFor } from '../../data/resultPrecision';
import type { ResultColumn, ResultRow } from '../../data/types';

import classes from './ResultTable.module.css';

/* ============================================================================
 * RESULT TABLE — a company's P&L summary
 * ============================================================================
 * Laid out as the Latest Result benchmark: one header row, the statement's
 * name over the labels ("P&L Summary") and the feed's own headings over the
 * figures — five quarters, the change on the year and on the quarter, two
 * periods to date and the change between them. Labels at the inline-start,
 * figures at the inline-end, totals in bold, negatives in accounting
 * parentheses, and the current quarter and period to date tinted from the
 * header to the last row.
 *
 * The columns and rows are the company's own, so nothing here names a row or
 * counts columns: a bank's mark-up rows and PSO's nine months lay out the
 * same way as the benchmark's cement maker.
 *
 * "YoY(%)" heads two columns. They look alike, as in the benchmark, but each
 * change heading carries an aria-label naming what it compares ("4QFY26 on
 * 4QFY25, % change"), so a screen reader does not announce the same words
 * for two different numbers.
 *
 * Precision is the feed's, by row and column (src/data/resultPrecision.ts).
 * On a narrow screen the table scrolls inside its own region, never the page,
 * with the labels pinned; no column is dropped from a published report.
 * ========================================================================= */

const changeLabel = (column: ResultColumn) =>
  column.compares ? `${column.compares.period} on ${column.compares.base}, % change` : undefined;

export function ResultTable({
  statement,
  columns,
  rows,
  labelledBy,
  caption,
}: {
  /** The heading over the labels: "P&L Summary". */
  statement: string;
  columns: ResultColumn[];
  rows: ResultRow[];
  /** Id of the report's heading; the scroll region takes its name. */
  labelledBy: string;
  caption: string;
}) {
  return (
    /* A scrolling region must be reachable by keyboard (tabIndex) and named
       (aria-labelledby), or a keyboard user cannot reach the hidden columns. */
    <div
      className={`ask-scroll-x ${classes.scroller}`}
      role="region"
      aria-labelledby={labelledBy}
      tabIndex={0}
      /* The design system's compact density, as on the MTS sheet, so a
         company's full statement fits one screen with its letterhead. */
      data-density="compact"
    >
      <Table className={classes.table}>
        <caption className="sr-only">{caption}</caption>
        <Table.Thead>
          <Table.Tr>
            <Table.Th scope="col" className={classes.pin}>
              {statement}
            </Table.Th>
            {columns.map((column, i) => (
              <Table.Th
                key={i}
                scope="col"
                data-numeric
                data-current={column.current || undefined}
                aria-label={changeLabel(column)}
              >
                {column.label}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, r) => (
            <Table.Tr key={r} data-bold={row.bold || undefined}>
              <Table.Th scope="row" className={classes.pin}>
                {row.label}
              </Table.Th>
              {columns.map((column, i) => (
                <Table.Td key={i} data-numeric data-current={column.current || undefined}>
                  {formatNumber(row.values[i] ?? null, {
                    decimals: decimalsFor(row.measure, column),
                    signStyle: 'parens',
                  })}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
