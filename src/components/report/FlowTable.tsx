import { useId } from 'react';
import { Table } from '@mantine/core';

import type { PortfolioLine } from '../../data/types';
import { flowFigure } from './flowFigure';

import classes from './FlowTable.module.css';

/* ============================================================================
 * FLOW TABLE — Portfolio Investment's two tables
 * ============================================================================
 * Laid out as the benchmark (the live page and its PDF): a two-row header —
 * the band naming the table and its parts, "Portfolio Investment", "(Figures
 * in USD mn)" over Buy, Sell and Net and "Sector Wise Investment" over the
 * sectors, then the column headings — then the lines, each closing on a
 * rule. Labels at the inline-start, figures at the inline-end, the net
 * totals in bold. The colours are every sheet's, not the live page's dark
 * blue and grey (the user's call): the header tinted between two rules.
 *
 * The main table has the sectors and its Net column tinted down the table
 * (`highlightNet`, the report's highlight colour); the second table is the
 * same without either, as on the live page.
 *
 * Figures are two decimals with negatives in parentheses, in the text
 * colour, as published; a figure that rounds to zero is 0.00 (flowFigure).
 * The two spanning headings are column-group headers, so a screen reader
 * hears "Sector Wise Investment, Cement" on a sector's figure; the periods
 * to date (WTD …) are read with their group first, "FIPI, WTD". On a narrow
 * screen the table scrolls inside its own region with the labels pinned.
 * ========================================================================= */

const FLOWS = ['Buy', 'Sell', 'Net'] as const;

function Figure({ value, net = false }: { value: number | null; net?: boolean }) {
  return (
    <Table.Td data-numeric data-net={net || undefined}>
      {flowFigure(value)}
    </Table.Td>
  );
}

export function FlowTable({
  title,
  units,
  sectorsTitle,
  sectors,
  lines,
  highlightNet = false,
  labelledBy,
  caption,
}: {
  /** The first heading, over the labels: "Portfolio Investment". */
  title: string;
  /** Over Buy, Sell and Net: "(Figures in USD mn)". */
  units: string;
  /** Over the sectors, when there are any: "Sector Wise Investment". */
  sectorsTitle?: string;
  /** The sectors' names; none for the second table. */
  sectors: readonly string[];
  lines: readonly PortfolioLine[];
  /** Fill the Net column down the table (the main table). */
  highlightNet?: boolean;
  /** Id of what names the scroll region; the table's own title by default. */
  labelledBy?: string;
  caption: string;
}) {
  const titleId = useId();
  return (
    /* A scrolling region must be reachable by keyboard (tabIndex) and named
       (aria-labelledby), or a keyboard user cannot reach the hidden columns. */
    <div
      className={`ask-scroll-x ${classes.scroller}`}
      role="region"
      aria-labelledby={labelledBy ?? titleId}
      tabIndex={0}
      /* The design system's compact density, as on the other sheets. */
      data-density="compact"
    >
      <Table className={classes.table}>
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          <col />
        </colgroup>
        <colgroup span={FLOWS.length} />
        {sectors.length > 0 && <colgroup span={sectors.length} />}
        <Table.Thead>
          <Table.Tr className={classes.band}>
            <Table.Th id={titleId} scope="col" className={classes.pin}>
              {title}
            </Table.Th>
            <Table.Th scope="colgroup" colSpan={FLOWS.length} data-span>
              {units}
            </Table.Th>
            {sectors.length > 0 && (
              <Table.Th scope="colgroup" colSpan={sectors.length} data-span>
                {sectorsTitle}
              </Table.Th>
            )}
          </Table.Tr>
          <Table.Tr className={classes.headings}>
            {/* Over the labels the benchmark has nothing: the band names them. */}
            <Table.Td className={classes.pin} />
            {FLOWS.map((flow) => (
              <Table.Th key={flow} scope="col" data-numeric>
                {flow}
              </Table.Th>
            ))}
            {sectors.map((sector) => (
              <Table.Th key={sector} scope="col" data-numeric>
                {sector}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {lines.map((line) => (
            <Table.Tr key={`${line.group ?? ''}${line.label}`} data-bold={line.bold || undefined}>
              <Table.Th scope="row" className={classes.pin}>
                {line.group && <span className="sr-only">{line.group}, </span>}
                {line.label}
              </Table.Th>
              <Figure value={line.buy} />
              <Figure value={line.sell} />
              <Figure value={line.net} net={highlightNet} />
              {sectors.map((sector, i) => (
                <Figure key={sector} value={line.sectors[i] ?? null} />
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
