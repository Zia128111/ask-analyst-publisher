'use client';

import { DirectionProvider, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme, cssVariablesResolver } from '@akseer/ask-analyst-design-system';

/* ============================================================================
 * PROVIDERS
 * ============================================================================
 * Mantine's context providers hold state, so they are a client component. The
 * layout above stays a server component and only renders this boundary.
 * ========================================================================= */

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    /*
     * `detectDirection` reads dir from the document rather than exposing a
     * switch: reading direction is a locale decision, and the Arabic build
     * serves <html dir="rtl">. Every rule in this app uses logical
     * properties, so it needs no second stylesheet.
     */
    <DirectionProvider detectDirection initialDirection="ltr">
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        defaultColorScheme="light"
      >
        <Notifications position="bottom-right" limit={3} />
        {children}
      </MantineProvider>
    </DirectionProvider>
  );
}
