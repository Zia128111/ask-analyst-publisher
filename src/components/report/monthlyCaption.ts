import type { MonthlyColumn } from '../../data/types';

/** ["Jul-25", "Jun-26", "Jul-26"] -> "Jul-25, Jun-26 and Jul-26". */
const inWords = (items: string[]) =>
  items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/**
 * A MonthlyTable's caption, for screen readers: what it holds, in which unit,
 * and the report's own notes — which rows are totals, what NM and a dash
 * mean. Each change heading names its own comparison (its aria-label).
 * Apart from the component so Fast Refresh can swap either on its own.
 */
export const monthlyCaption = ({
  title,
  unit,
  columns,
  notes,
}: {
  title: string;
  /** The unit in words: "USD millions", "thousand tonnes". */
  unit: string;
  columns: MonthlyColumn[];
  notes: string;
}) =>
  `${title}, in ${unit}: ${inWords(columns.filter((c) => c.kind === 'amount').map((c) => c.label))}, ` +
  `with the changes between them in percent. ${notes}`;
