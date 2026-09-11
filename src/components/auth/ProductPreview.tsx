import { Paper, Table, Text } from '@mantine/core';
import {
  DIRECTION_ICON,
  DIRECTION_LABEL,
  direction,
  formatCompact,
  formatNumber,
  formatPercent,
} from '@akseer/ask-analyst-design-system';

import classes from './ProductPreview.module.css';

/* ============================================================================
 * PRODUCT PREVIEW
 * ============================================================================
 * A still of the Publisher desk, built from the same components the desk will
 * use, so the preview cannot drift from the product. Sample figures only; the
 * whole thing is aria-hidden by its container.
 *
 * The figures still go through the formatters and the delta still carries all
 * three signals (colour, glyph, hidden word). Not because a hidden mock needs
 * them, but because this is the pattern the real desk will copy from.
 * ========================================================================= */

interface Stat {
  label: string;
  value: string;
  /** Percentage change, signed. */
  change?: number;
}

const STATS: Stat[] = [
  { label: 'Reports published', value: formatNumber(128, { decimals: 0 }) },
  { label: 'Reads, last 30 days', value: formatCompact(42_600), change: 12.4 },
  { label: 'Subscribers', value: formatNumber(3_140, { decimals: 0 }), change: 3.1 },
];

interface Publication {
  title: string;
  sector: string;
  reads: number;
}

const LATEST: Publication[] = [
  { title: 'OGDC: exploration upside priced in', sector: 'Oil & Gas', reads: 1_204 },
  { title: 'Banks: margins to compress in 2HFY26', sector: 'Banks', reads: 986 },
  { title: 'Cement dispatches, August 2026', sector: 'Cement', reads: 742 },
  { title: 'HBL: deposit growth ahead of the sector', sector: 'Banks', reads: 655 },
  { title: 'Fertiliser: urea offtake, August 2026', sector: 'Fertiliser', reads: 590 },
];

function Delta({ value }: { value: number }) {
  const dir = direction(value);
  const Icon = DIRECTION_ICON[dir];
  return (
    <span className={classes.delta} data-direction={dir}>
      <Icon size="xs" />
      <span className="sr-only">{DIRECTION_LABEL[dir]} </span>
      <span data-numeric>{formatPercent(value, { decimals: 1, showPlus: true })}</span>
    </span>
  );
}

export function ProductPreview() {
  return (
    <Paper radius="xl" shadow="xl" withBorder={false} className={classes.card}>
      <div className={classes.head}>
        <Text className={classes.kicker}>Publisher desk</Text>
        <Text className={classes.greeting}>Good morning, Akseer Research</Text>
      </div>

      <dl className={classes.stats}>
        {STATS.map((stat) => (
          <div key={stat.label} className={classes.stat}>
            <dt className={classes.statLabel}>{stat.label}</dt>
            <dd className={classes.statValue}>
              <span data-numeric>{stat.value}</span>
              {stat.change !== undefined && <Delta value={stat.change} />}
            </dd>
          </div>
        ))}
      </dl>

      <Table className={classes.table}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Latest publications</Table.Th>
            <Table.Th>Sector</Table.Th>
            <Table.Th data-numeric>Reads</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {LATEST.map((row) => (
            <Table.Tr key={row.title}>
              <Table.Th scope="row" className={classes.titleCell}>
                {row.title}
              </Table.Th>
              <Table.Td className={classes.sectorCell}>{row.sector}</Table.Td>
              <Table.Td data-numeric>{formatNumber(row.reads, { decimals: 0 })}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
