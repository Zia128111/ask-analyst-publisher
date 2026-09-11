'use client';

import { useState } from 'react';
import { Burger, Drawer } from '@mantine/core';
import { ColorSchemeToggle } from '@akseer/ask-analyst-design-system';

import { SettingsSection } from '../SettingsSection';

/* ============================================================================
 * AUTH MENU
 * ============================================================================
 * The header's only control: a burger at the inline-end that opens a drawer,
 * the same pattern the design system's AppHeader uses for its navigation on
 * narrow screens. The colour-scheme toggle lives inside the drawer rather than
 * in the header row, so the row is the lockup and one target at every size;
 * on a phone the Light / Dark labels no longer wrap the header onto two lines.
 * ========================================================================= */

export function AuthMenu() {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Burger
        opened={opened}
        onClick={() => setOpened((o) => !o)}
        aria-label={opened ? 'Close menu' : 'Open menu'}
        aria-expanded={opened}
        size="sm"
      />

      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        title="Menu"
        size="xs"
        position="right"
        /* Mantine's close button is an icon with no name of its own. */
        closeButtonProps={{ 'aria-label': 'Close menu' }}
      >
        <SettingsSection label="Appearance" hint="Remembered on this device.">
          <ColorSchemeToggle />
        </SettingsSection>
      </Drawer>
    </>
  );
}
