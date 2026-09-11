import { Table } from '@mantine/core';
import { NOT_AVAILABLE, formatNumber, formatPercent } from '@akseer/ask-analyst-design-system';

import type { MtsRow } from '../../data/types';

import classes from './MtsTable.module.css';

/* ============================================================================
 * MTS TABLE
 * ============================================================================
 * Laid out exactly as the benchmark: one header row of seven columns, the
 * longer labels broken over two lines ("Current MTS / Volume (Mn)"), figures
 * centred under their headings, and the trailing "Symbol" column carried
 * through verbatim.
 *
 * Two headings read "Value (PKR Mn)". They look the same, as in the
 * benchmark, but each carries an aria-label naming its group, so a screen
 * reader announces "Open value (PKR Mn)" rather than the same words for two
 * different numbers.
 *
 * Precision is the published precision, column by column: current figures to
 * one decimal, open figures to two, the rate to one.
 *
 * On a narrow screen the table scrolls inside its own region, never the page,
 * with the ticker pinned; no column is dropped from a published report.
 * ========================================================================= */

const oneDp = (v: number | null) => formatNumber(v, { decimals: 1 });
const twoDp = (v: number | null) => formatNumber(v, { decimals: 2 });
const rate = (v: number | null) => formatPercent(v, { decimals: 1 });

/** A heading broken over two lines, read as one phrase. */
function TwoLine({ top, bottom }: { top: string; bottom: string }) {
  return (
    <>
      <span className={classes.line}>{top}</span> <span className={classes.line}>{bottom}</span>
    </>
  );
}

export function MtsTable({
  rows,
  labelledBy,
  caption,
}: {
  rows: MtsRow[];
  /** Id of the report title; the scroll region takes its name. */
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
      /* The design system's compact density: 4px cell padding, type size
         unchanged. Twenty rows then fit one screen with the letterhead. */
      data-density="compact"
    >
      <Table className={classes.table}>
        <caption className="sr-only">{caption}</caption>
        <Table.Thead>
          <Table.Tr>
            <Table.Th scope="col" className={classes.pin}>
              Symbol
            </Table.Th>
            <Table.Th scope="col">
              <TwoLine top="Current MTS" bottom="Volume (Mn)" />
            </Table.Th>
            <Table.Th scope="col" aria-label="Current MTS value (PKR Mn)">
              <TwoLine top="Value" bottom="(PKR Mn)" />
            </Table.Th>
            <Table.Th scope="col">MTS Rate</Table.Th>
            <Table.Th scope="col">
              <TwoLine top="Open" bottom="Volume (Mn)" />
            </Table.Th>
            <Table.Th scope="col" aria-label="Open value (PKR Mn)">
              <TwoLine top="Value" bottom="(PKR Mn)" />
            </Table.Th>
            <Table.Th scope="col">Symbol</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((r) => (
            <Table.Tr key={r.symbol}>
              <Table.Th scope="row" className={classes.pin}>
                {r.symbol}
              </Table.Th>
              <Table.Td data-numeric>{oneDp(r.currentVolumeMn)}</Table.Td>
              <Table.Td data-numeric>{oneDp(r.currentValuePkrMn)}</Table.Td>
              <Table.Td data-numeric>{rate(r.mtsRatePct)}</Table.Td>
              <Table.Td data-numeric>{twoDp(r.openVolumeMn)}</Table.Td>
              <Table.Td data-numeric>{twoDp(r.openValuePkrMn)}</Table.Td>
              <Table.Td className={classes.tag}>{r.trailingSymbol ?? NOT_AVAILABLE}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
