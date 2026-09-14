'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Drawer, Stack, Text, UnstyledButton } from '@mantine/core';
import { ColorSchemeToggle, Icons } from '@akseer/ask-analyst-design-system';

import { CURRENT_ACCOUNT, signOut } from '../../auth/client';
import { discardBranding, useBranding } from '../../branding/store';
import { SettingsSection } from '../SettingsSection';
import { ReportStyleSettings } from './ReportStyleSettings';

import classes from './AccountMenu.module.css';

/* ============================================================================
 * ACCOUNT MENU
 * ============================================================================
 * The benchmark's avatar at the top right. It opens the same right-hand
 * drawer as the auth pages' menu, so the colour-scheme toggle lives in one
 * kind of place across the product: behind a control at the top right, never
 * bare in the header row.
 *
 * The drawer also holds the Report style, the white-label settings. Its
 * controls preview on the report as they change, so this drawer drops the
 * system's dimmed, blurred scrim: the report beside it has to be seen in its
 * true colours. It is still modal — focus stays inside, Escape and a click
 * outside close it — and the page can still scroll, so a long report can be
 * checked top to bottom while styling it.
 *
 * UNAPPLIED CHANGES ARE NEVER LOST SILENTLY. The Report style keeps nothing
 * until Apply, so a close while changes are pending (X, Escape, a click
 * outside) is held, and the drawer asks: Apply and close, or Discard and
 * close. Reloading or leaving the page with changes pending raises the
 * browser's own "leave site?" prompt. Signing out discards them.
 *
 * The trigger is a real button named for what it opens. The avatar inside it
 * is decorative; the chevron says "this opens something".
 * ========================================================================= */

export function AccountMenu({
  publication,
  edition,
}: {
  /** The publication in view, which sets what the Report style offers. */
  publication?: string | null;
  /** The edition in view: KSA lays its Morning Briefing out as a report of its own. */
  edition?: string | null;
}) {
  const router = useRouter();
  const { dirty } = useBranding();
  const [opened, setOpened] = useState(false);
  const [closeHeld, setCloseHeld] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const account = CURRENT_ACCOUNT;

  // Applied or discarded from the bar itself: nothing left to hold the close for.
  if (closeHeld && !dirty) setCloseHeld(false);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers show the prompt only when returnValue is set.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const close = () => {
    setCloseHeld(false);
    setOpened(false);
  };

  const requestClose = () => {
    if (dirty) setCloseHeld(true);
    else close();
  };

  const leave = async () => {
    setLeaving(true);
    discardBranding();
    const { redirectTo } = await signOut();
    router.push(redirectTo);
  };

  return (
    <>
      <UnstyledButton
        className={classes.trigger}
        onClick={() => setOpened(true)}
        aria-label={`Account: ${account.name}`}
        aria-haspopup="dialog"
        aria-expanded={opened}
      >
        <Avatar size={36} color="brand" aria-hidden="true">
          {account.initials}
        </Avatar>
        <Icons.chevronDown size="xs" />
      </UnstyledButton>

      <Drawer
        opened={opened}
        onClose={requestClose}
        title="Account"
        size="sm"
        position="right"
        overlayProps={{ backgroundOpacity: 0, blur: 0 }}
        lockScroll={false}
        /* Mantine's close button is an icon with no name of its own. */
        closeButtonProps={{ 'aria-label': 'Close account menu' }}
      >
        <Stack gap="xl">
          <div className={classes.identity}>
            <Avatar size={48} color="brand" aria-hidden="true">
              {account.initials}
            </Avatar>
            <div className={classes.who}>
              <Text className={classes.name}>{account.name}</Text>
              <Text className={classes.org}>{account.organisation}</Text>
            </div>
          </div>

          <SettingsSection label="Appearance" hint="Remembered on this device.">
            <ColorSchemeToggle />
          </SettingsSection>

          <ReportStyleSettings publication={publication} edition={edition} closeHeld={closeHeld} onDone={close} />

          <Button fullWidth onClick={leave} loading={leaving}>
            Sign out
          </Button>
        </Stack>
      </Drawer>
    </>
  );
}
