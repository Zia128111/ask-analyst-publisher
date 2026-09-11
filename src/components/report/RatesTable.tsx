import { Fragment } from 'react';
import { Table } from '@mantine/core';
import { formatNumber } from '@akseer/ask-analyst-design-system';

import type { RatesSection } from '../../data/types';

import classes from './RatesTable.module.css';

/* ============================================================================
 * RATES TABLE — Weighted Average Exchange Rates
 * ============================================================================
 * Laid out as the benchmark (the live /currency page): one header row —
 * "Currency" over the labels, a column per currency — then each part of the
 * table: its name as a bold row of its own ("Current Date", "Previous
 * Date", "Change") and its Buying and Selling rows a step in, each closing
 * on a rule. Every heading centred — "Currency" too — and every figure, as
 * the benchmark prints them (the user's calls, 2026-09-11); the row labels
 * start. The highlighted currency's column (USD, as live) tinted from the
 * header to the last row.
 *
 * Rates print to four decimals and changes to two, the part's `kind`; a
 * change that rounds to zero is 0.00, never "-0.00". "Buying" is read with
 * its part first — "Current Date, Buying" — so the six Buying rows are not
 * the same words to a screen reader. On a narrow screen the table scrolls
 * inside its own region with the labels pinned.
 * ========================================================================= */

const rate = (value: number | null) => formatNumber(value, { decimals: 4 });
/** Two decimals; anything that rounds to zero is plain zero, unsigned. */
const change = (value: number | null) =>
  formatNumber(value !== null && Math.abs(value) < 0.005 ? 0 : value, { decimals: 2 });

export function RatesTable({
  currencies,
  sections,
  highlight,
  labelledBy,
  caption,
}: {
  currencies: readonly string[];
  sections: readonly RatesSection[];
  /** The currency whose column is tinted: "USD". */
  highlight?: string;
  /** Id of the report's title; the scroll region takes its name. */
  labelledBy: string;
  caption: string;
}) {
  const tinted = (symbol: string) => (symbol === highlight ? true : undefined);
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
    >
      <Table className={classes.table}>
        <caption className="sr-only">{caption}</caption>
        <Table.Thead>
          <Table.Tr>
            <Table.Th scope="col" className={classes.pin}>
              Currency
            </Table.Th>
            {currencies.map((symbol) => (
              <Table.Th key={symbol} scope="col" data-numeric data-highlight={tinted(symbol)}>
                {symbol}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sections.map((section) => (
            <Fragment key={section.label}>
              {/* The part's name: a row of its own, no figures. */}
              <Table.Tr data-heading>
                <Table.Th scope="row" className={classes.pin}>
                  {section.label}
                </Table.Th>
                {currencies.map((symbol) => (
                  <Table.Td key={symbol} data-highlight={tinted(symbol)} />
                ))}
              </Table.Tr>
              {section.rows.map((row) => (
                <Table.Tr key={row.label}>
                  <Table.Th scope="row" className={classes.pin} data-indent>
                    <span className="sr-only">{section.label}, </span>
                    {row.label}
                  </Table.Th>
                  {currencies.map((symbol, i) => (
                    <Table.Td key={symbol} data-numeric data-highlight={tinted(symbol)}>
                      {section.kind === 'change' ? change(row.values[i] ?? null) : rate(row.values[i] ?? null)}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Fragment>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
