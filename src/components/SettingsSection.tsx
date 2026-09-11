'use client';

import { useId, type ReactNode } from 'react';
import { Text } from '@mantine/core';

import classes from './SettingsSection.module.css';

/* ============================================================================
 * SETTINGS SECTION
 * ============================================================================
 * A labelled group inside a drawer: the small uppercase label, the controls,
 * and an optional hint. Shared by the auth pages' menu drawer and the account
 * drawer, so the two read as one product.
 *
 * The label names the group for assistive technology too, so a screen
 * reader entering the Report style's fields hears "Report style, group"
 * before the first of them.
 * ========================================================================= */

export function SettingsSection({
  label,
  hint,
  stretch = false,
  children,
}: {
  label: string;
  hint?: string;
  /** Let the controls take the drawer's full width, as form fields do. */
  stretch?: boolean;
  children: ReactNode;
}) {
  const labelId = useId();
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={`${classes.group} ${stretch ? classes.stretch : ''}`}
    >
      <Text component="p" id={labelId} className={classes.label}>
        {label}
      </Text>
      {children}
      {hint && (
        <Text component="p" className={classes.hint}>
          {hint}
        </Text>
      )}
    </div>
  );
}
