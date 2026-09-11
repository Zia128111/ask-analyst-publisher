'use client';

import { SegmentedControl, type SegmentedControlItem } from '@mantine/core';

import { MASTHEADS } from '../../data/publications';
import type { MastheadChoice } from '../../data/types';

import chrome from '../ChromeToggle.module.css';

/* ============================================================================
 * MASTHEAD TOGGLE
 * ============================================================================
 * The benchmark's "Alpha Capital | Ask Analyst" switch above the sheet. It
 * chooses the logo the report is printed under; the figures do not change.
 * Once a company logo is uploaded in the account drawer's Report style, it
 * joins as a third choice, named after the company.
 *
 * A segmented control, not tabs: the choices are peers of one setting, and
 * the radio group it renders announces exactly that. It takes the design
 * system's neutral "chrome" look (a raised surface pill on a muted track), as
 * in the benchmark, rather than the brand-blue indicator the system reserves
 * for data controls such as the 1D / 1M / 1Y switch — this one changes how the
 * sheet is branded, not what it shows.
 * ========================================================================= */

const BUILT_IN: SegmentedControlItem<MastheadChoice>[] = (['alphacapital', 'askanalyst'] as const).map(
  (value) => ({ value, label: MASTHEADS[value].label }),
);

export function MastheadToggle({
  value,
  onChange,
  customLabel,
}: {
  value: MastheadChoice;
  onChange: (value: MastheadChoice) => void;
  /** The uploaded logo's name; omitted when there is no uploaded logo. */
  customLabel?: string;
}) {
  const data: SegmentedControlItem<MastheadChoice>[] = customLabel
    ? [...BUILT_IN, { value: 'custom', label: <span className={chrome.truncate}>{customLabel}</span> }]
    : BUILT_IN;

  return (
    <SegmentedControl<MastheadChoice>
      className={chrome.root}
      aria-label="Masthead"
      value={value}
      onChange={onChange}
      data={data}
    />
  );
}
