import { formatNumber } from '@akseer/ask-analyst-design-system';

/** Portfolio Investment prints every figure to two decimals, as the live page and its PDF do. */
export const FLOW_DECIMALS = 2;

/** Half the last printed digit: anything smaller prints as zero. */
const PRINTED_ZERO = 0.5 * 10 ** -FLOW_DECIMALS;

/**
 * A flow as the report prints it: USD millions to two decimals, negatives
 * in accounting parentheses — (0.29). A figure that rounds to zero prints
 * 0.00, as the benchmark prints it — a $396 sale is -0.000396 and must not
 * read "(0.00)", which the formatter gives because it signs the unrounded
 * value.
 */
export const flowFigure = (value: number | null): string =>
  formatNumber(value !== null && Math.abs(value) < PRINTED_ZERO ? 0 : value, {
    decimals: FLOW_DECIMALS,
    signStyle: 'parens',
  });
