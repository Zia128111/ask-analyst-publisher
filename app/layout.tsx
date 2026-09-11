import type { Metadata } from 'next';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';

import { BRANDED_FLAG_SCRIPT } from '../src/data/branding';
import { Providers } from './providers';

/* ============================================================================
 * ROOT LAYOUT
 * ============================================================================
 * Import order is load-bearing, not cosmetic. The design system's layer
 * overrides Mantine's defaults — focus rings, touch targets, form borders — and
 * a stylesheet loaded after it silently wins. Ours goes last.
 * ========================================================================= */
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@akseer/ask-analyst-design-system/styles.css';

/* Next requires the metadata export to live beside the layout component. That
   is the framework's convention, not a fast-refresh mistake. */
// eslint-disable-next-line react/only-export-components
export const metadata: Metadata = {
  title: {
    default: 'Ask Analyst Publisher',
    template: '%s | Ask Analyst Publisher',
  },
  description:
    'Publish research reports, notes and briefings to Ask Analyst readers, and see who is reading them.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
     * `mantineHtmlProps` sets suppressHydrationWarning and the data attributes
     * ColorSchemeScript writes to. Without it React logs a hydration mismatch
     * on every load, because the script deliberately mutates <html> before
     * hydration.
     *
     * `dir` is not set here: the Arabic build serves dir="rtl" and
     * DirectionProvider reads it from the document — see providers.tsx.
     */
    <html lang="en" {...mantineHtmlProps}>
      <head>
        {/*
         * Runs BEFORE first paint and applies the reader's stored colour
         * scheme to <html>. Without it every visitor who prefers dark gets a
         * flash of the light theme while React hydrates.
         */}
        <ColorSchemeScript defaultColorScheme="light" />
        {/*
         * Also before first paint: marks <html> when this browser holds a
         * Report style, so a report waits for it rather than showing the
         * default letterhead first. See src/data/branding.ts.
         */}
        <script dangerouslySetInnerHTML={{ __html: BRANDED_FLAG_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
