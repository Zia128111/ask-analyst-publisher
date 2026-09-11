import { useId } from 'react';
import { Table } from '@mantine/core';

import classes from './MarketTable.module.css';

/* ============================================================================
 * MARKET TABLE — the Morning Briefing's five small tables
 * ============================================================================
 * Net LIPI/FIPI Position, FIPI Sector-wise, Major Indices, Commodities and
 * Inter-Bank Currency Rates, stacked beside the news and drawn EXACTLY as the
 * benchmark draws them (the user's request, with its screenshot): the name
 * in blue above the table; a rule; the column headings in bold, centred; a
 * rule; the rows striped, every other one filled, the cells parted by fine
 * lines of the page's own colour; the figures centred; a rule to close. The
 * colours are the system's — the rules its brand blue, the name its blue for
 * text, the stripes its brand tint — or the Report style's.
 *
 * The name is a real heading (h2), so the tables can be reached by heading;
 * the scroll region and the caption take it too. Figures keep the system's
 * tabular digits, centred at the user's request as on MTS.
 * ========================================================================= */

export interface MarketColumn<Row> {
  heading: string;
  /** The heading in full, where the short one needs context: "Change on the day, %". */
  label?: string;
  /** Text, not a figure ("USD/bbl"): no tabular digits. */
  text?: boolean;
  value: (row: Row) => string;
}

export function MarketTable<Row>({
  title,
  labelHeading,
  columns,
  rows,
  rowLabel,
  caption,
}: {
  title: string;
  /** Over the labels; the benchmark leaves it empty except over the indices. */
  labelHeading?: string;
  columns: readonly MarketColumn<Row>[];
  rows: readonly Row[];
  rowLabel: (row: Row) => string;
  /** For screen readers: what the table holds, units and date. */
  caption: string;
}) {
  const titleId = useId();
  return (
    <div className={classes.block}>
      <h2 id={titleId} className={classes.title}>
        {title}
      </h2>
      {/* A scrolling region must be reachable by keyboard and named: on a
          phone the widest table scrolls inside it. */}
      <div
        className={`ask-scroll-x ${classes.scroller}`}
        role="region"
        aria-labelledby={titleId}
        tabIndex={0}
        data-density="compact"
      >
        <Table className={classes.table}>
          <caption className="sr-only">{caption}</caption>
          <Table.Thead>
            <Table.Tr>
              {labelHeading ? (
                <Table.Th scope="col" className={classes.label}>
                  {labelHeading}
                </Table.Th>
              ) : (
                <Table.Td className={classes.label} />
              )}
              {columns.map((column) => (
                <Table.Th key={column.heading} scope="col" aria-label={column.label}>
                  {column.heading}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={rowLabel(row)}>
                <Table.Th scope="row" className={classes.label}>
                  {rowLabel(row)}
                </Table.Th>
                {columns.map((column) => (
                  <Table.Td key={column.heading} data-numeric={column.text ? undefined : true}>
                    {column.value(row)}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
    </div>
  );
}
