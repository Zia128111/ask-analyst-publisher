'use client';

import { Loader, Select, type ComboboxItem, type OptionsFilter } from '@mantine/core';
import { Icons } from '@akseer/ask-analyst-design-system';

import type { Company } from '../../data/types';

import classes from './CompanySearch.module.css';

/* ============================================================================
 * COMPANY SEARCH
 * ============================================================================
 * The benchmark's search bar above the Latest Result sheet, doing its two
 * jobs in one field:
 *   - TYPE, and the list narrows to the companies that match, on the ticker
 *     or anywhere in the name: "luck", "cement" and "LUCK" all find Lucky
 *     Cement. A ticker that starts with what was typed comes first, then a
 *     name with a word that does, then everything else that matches, each
 *     group in the list's own order.
 *   - OPEN it, and every company is listed by name in a list that scrolls,
 *     ticker over name, as on the live page.
 * The field shows the chosen company's name; choosing another loads its
 * result (the view does that, through the URL).
 *
 * A visible label, not the benchmark's placeholder alone: the design
 * system's rule for form fields (§8.5), because a placeholder is gone the
 * moment someone types. The placeholder keeps the live page's wording.
 * While a company loads, the search icon gives way to a spinner.
 * ========================================================================= */

/** Matches on the ticker or the name, best matches first. */
const filter: OptionsFilter = ({ options, search }) => {
  const query = search.trim().toLowerCase();
  if (!query) return options;
  const rank = (item: ComboboxItem) =>
    item.value.toLowerCase().startsWith(query)
      ? 0
      : item.label
            .toLowerCase()
            .split(/\s+/)
            .some((word) => word.startsWith(query))
        ? 1
        : 2;
  return options
    .filter(
      (o): o is ComboboxItem =>
        'value' in o && (o.value.toLowerCase().includes(query) || o.label.toLowerCase().includes(query)),
    )
    .sort((a, b) => rank(a) - rank(b));
};

export function CompanySearch({
  companies,
  value,
  onChange,
  pending = false,
}: {
  companies: Company[];
  /** The chosen company's ticker. */
  value: string;
  onChange: (ticker: string) => void;
  /** A company is loading. */
  pending?: boolean;
}) {
  return (
    <Select
      className={classes.root}
      label="Company"
      placeholder="Search company"
      data={companies.map((c) => ({ value: c.ticker, label: c.name }))}
      value={value}
      onChange={(ticker) => {
        if (ticker && ticker !== value) onChange(ticker);
      }}
      searchable
      allowDeselect={false}
      filter={filter}
      nothingFoundMessage="No companies found"
      /* About five and a half options, so the list shows it scrolls. */
      maxDropdownHeight="calc(var(--ask-control-lg) * 6)"
      rightSection={pending ? <Loader size="xs" /> : <Icons.search size="sm" />}
      rightSectionPointerEvents="none"
      renderOption={({ option, checked }) => (
        <span className={classes.option}>
          <span className={classes.text}>
            <span className={classes.ticker}>{option.value}</span>
            <span className="sr-only">, </span>
            <span className={classes.name}>{option.label}</span>
          </span>
          {checked && <Icons.check size="xs" />}
        </span>
      )}
    />
  );
}
