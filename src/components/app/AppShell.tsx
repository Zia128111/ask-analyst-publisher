'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import { Text } from '@mantine/core';
import { AppHeader } from '@akseer/ask-analyst-design-system';

import { EDITIONS, editionHome, findEdition, publicationsFor } from '../../data/publications';
import { ProductLockup } from '../ProductLockup';
import { AccountMenu } from './AccountMenu';
import { PublicationNav } from './PublicationNav';

import classes from './AppShell.module.css';

/* ============================================================================
 * APP SHELL — the signed-in Publisher
 * ============================================================================
 * Header, publication navigation, one <main>, footer. The benchmark's layout,
 * built from the design system's AppHeader so the skip link, landmarks, the
 * burger below 1280px and the "you are here" state come with it.
 *
 * The header's three links are EDITIONS — the masthead a report goes out
 * under. Switching edition keeps the reader on the same publication when the
 * other edition carries it, so Alpha Capital's MTS sits one click from Ask
 * Analyst's MTS rather than dumping the reader back on a home page.
 *
 * `useSelectedLayoutSegment` reads the publication from the URL; the edition
 * arrives from the route's layout, which has already rejected unknown ones.
 * ========================================================================= */

export function AppShell({ edition, children }: { edition: string; children: React.ReactNode }) {
  const publication = useSelectedLayoutSegment();
  const current = findEdition(edition)!;

  const items = EDITIONS.map((e) => ({
    label: e.label,
    href: publication && e.publications.includes(publication) ? `/${e.slug}/${publication}` : editionHome(e),
  }));
  const activeHref = items[EDITIONS.findIndex((e) => e.slug === edition)].href;

  return (
    <div className={classes.shell}>
      <AppHeader
        items={items}
        activeHref={activeHref}
        mainId="main"
        brand={<ProductLockup height={28} />}
        actions={<AccountMenu publication={publication} />}
        width="grid"
      />

      <div className={classes.page}>
        <PublicationNav
          edition={edition}
          publications={publicationsFor(current)}
          active={publication}
        />

        <main id="main" tabIndex={-1} className={classes.main}>
          {children}
        </main>
      </div>

      <footer className={classes.footer}>
        <div className={classes.footerInner}>
          <Text size="xs" c="var(--ask-text-tertiary)">
            Ask Analyst is a product of Akseer Research. Figures are published for information
            only; they are not an offer, a recommendation, or investment advice.
          </Text>
        </div>
      </footer>
    </div>
  );
}
