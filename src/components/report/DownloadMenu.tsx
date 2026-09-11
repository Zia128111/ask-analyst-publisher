'use client';

import { useState } from 'react';
import { Button, Loader, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Icons } from '@akseer/ask-analyst-design-system';

import classes from './DownloadMenu.module.css';

/* ============================================================================
 * DOWNLOAD MENU
 * ============================================================================
 * "Download" opens a menu of named formats — PNG, PDF, Excel — in place of
 * the benchmark's three colour-coded icons, which relied on colour and icon
 * alone and gave CSV and Excel the same green.
 *
 * While a file is being made the button shows a spinner and says so to
 * assistive tech (aria-busy), but it is NOT disabled: disabling the focused
 * button would drop keyboard focus onto the page body. A second choice made
 * while one is running is simply ignored.
 * ========================================================================= */

export interface DownloadFormat {
  id: string;
  label: string;
  /** Shown beside the label, e.g. ".pdf". */
  extension: string;
  run: () => Promise<void>;
}

export function DownloadMenu({ formats }: { formats: DownloadFormat[] }) {
  const [busy, setBusy] = useState<string | null>(null);

  const choose = async (format: DownloadFormat) => {
    if (busy) return;
    setBusy(format.id);
    try {
      await format.run();
    } catch {
      notifications.show({
        color: 'negative',
        title: `Could not make the ${format.label}`,
        message: 'Please try again. If it keeps failing, reload the page.',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <Button
          aria-busy={busy !== null}
          leftSection={busy ? <Loader size="xs" /> : <Icons.download size="md" />}
          rightSection={<Icons.chevronDown size="xs" />}
        >
          {/* A flex item of its own, so its line box can be trimmed to the
              capitals and centred optically (see the CSS). */}
          <span className={classes.label}>Download</span>
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Download as</Menu.Label>
        {formats.map((f) => (
          <Menu.Item
            key={f.id}
            onClick={() => choose(f)}
            rightSection={<span className={classes.extension}>{f.extension}</span>}
          >
            {f.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
