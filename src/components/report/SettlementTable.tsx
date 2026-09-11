import { Table } from '@mantine/core';
import { formatNumber } from '@akseer/ask-analyst-design-system';

import type { SettlementLine } from '../../data/types';

import classes from './SettlementTable.module.css';

/* ============================================================================
 * SETTLEMENT TABLE — the top 10 traded stocks and how their trades settled
 * ============================================================================
 * Laid out as the benchmark (the live /settlement page): a two-row header —
 * "Symbol" down both rows, "Trade" over Volume (mn shares) and Value (PKR
 * mn), "Settlement (%)" over UIN and CM — then a line per stock, each closing
 * on a rule. Each group's name sits on its own rule, broken between the
 * groups, and the symbols, headings and figures are centred in their
 * columns (the user's calls, 2026-09-11); the symbols in the figures'
 * weight, every figure to one decimal, as published. The colours are every
 * sheet's: the header tinted between two rules.
 *
 * The two spanning headings are column-group headers, so a screen reader
 * hears "Settlement (%), UIN" on a figure. On a narrow screen the table
 * scrolls inside its own region with the symbols pinned.
 * ========================================================================= */

const oneDp = (value: number | null) => formatNumber(value, { decimals: 1 });

export function SettlementTable({
  lines,
  labelledBy,
  caption,
}: {
  lines: readonly SettlementLine[];
  /** Id of the report's title; the scroll region takes its name. */
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
      /* The design system's compact density, as on the other sheets. */
      data-density="compact"
    >
      <Table className={classes.table}>
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          <col />
        </colgroup>
        <colgroup span={2} />
        <colgroup span={2} />
        <Table.Thead>
          <Table.Tr className={classes.band}>
            <Table.Th scope="col" rowSpan={2} className={classes.pin}>
              Symbol
            </Table.Th>
            <Table.Th scope="colgroup" colSpan={2} data-span>
              Trade
            </Table.Th>
            <Table.Th scope="colgroup" colSpan={2} data-span>
              Settlement (%)
            </Table.Th>
          </Table.Tr>
          <Table.Tr className={classes.headings}>
            <Table.Th scope="col" data-numeric>
              Volume (mn shares)
            </Table.Th>
            <Table.Th scope="col" data-numeric>
              Value (PKR mn)
            </Table.Th>
            <Table.Th scope="col" data-numeric>
              UIN
            </Table.Th>
            <Table.Th scope="col" data-numeric>
              CM
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {lines.map((line) => (
            <Table.Tr key={line.symbol}>
              <Table.Th scope="row" className={classes.pin}>
                {line.symbol}
              </Table.Th>
              <Table.Td data-numeric>{oneDp(line.volume)}</Table.Td>
              <Table.Td data-numeric>{oneDp(line.value)}</Table.Td>
              <Table.Td data-numeric>{oneDp(line.uin)}</Table.Td>
              <Table.Td data-numeric>{oneDp(line.cm)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
