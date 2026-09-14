'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { Burger, Drawer, Text, useDirection } from '@mantine/core';

import { EDITIONS, editionHome, findEdition, navGroupsFor } from '../../data/publications';
import { ProductLockup } from '../ProductLockup';
import { AccountMenu } from './AccountMenu';
import { PublicationSidebar } from './PublicationSidebar';
import { useSidebarCollapsed } from './useSidebarCollapsed';

import classes from './AppShell.module.css';

/* ============================================================================
 * APP SHELL — the signed-in Publisher
 * ============================================================================
 * After the user's reference (2026-09-14): the publication sidebar the full
 * height of the screen at the inline start, the logo at its head; beside it
 * the top bar, the page and the footer. The top bar and the sidebar's head
 * are one height and close on one rule, so they read as one frame.
 *
 * THE TOP BAR is the app's own, not the design system's AppHeader, which
 * has no sidebar layout: it always draws the logo and its own small-screen
 * burger and drawer (finding 10). It keeps what AppHeader gave — the skip
 * link, a <header> landmark, the editions as the header's nav items with
 * aria-current — on the system's tokens.
 *
 * The header's links are EDITIONS — the masthead a report goes out under.
 * Switching edition keeps the reader on the same publication when the other
 * edition carries it, so Alpha Capital's MTS sits one click from Ask
 * Analyst's MTS rather than dumping the reader back on a home page.
 *
 * BELOW 1280px, ONE MENU: the sidebar is not docked and the top bar's edition
 * links are hidden; a burger beside the logo opens a drawer from the inline
 * start with the editions and the publications, and following a link closes
 * it.
 *
 * `useSelectedLayoutSegment` reads the publication from the URL; the edition
 * arrives from the route's layout, which has already rejected unknown ones.
 * ========================================================================= */

export function AppShell({ edition, children }: { edition: string; children: React.ReactNode }) {
  const publication = useSelectedLayoutSegment();
  const current = findEdition(edition)!;
  const groups = navGroupsFor(current);
  const homeHref = editionHome(current);
  const { dir } = useDirection();
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const editions = EDITIONS.map((e) => ({
    slug: e.slug,
    label: e.label,
    href: publication && e.publications.includes(publication) ? `/${e.slug}/${publication}` : editionHome(e),
    current: e.slug === edition,
  }));

  const editionLinks = (onFollow?: () => void) => (
    <ul className={classes.editionList}>
      {editions.map((e) => (
        <li key={e.slug}>
          <Link
            href={e.href}
            className={classes.edition}
            aria-current={e.current ? 'page' : undefined}
            onClick={onFollow}
          >
            {e.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={classes.shell}>
      <a href="#main" className={classes.skipLink}>
        Skip to content
      </a>

      <PublicationSidebar
        variant="docked"
        edition={edition}
        homeHref={homeHref}
        groups={groups}
        active={publication}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />

      <div className={classes.column}>
        <header className={classes.topbar}>
          <div className={classes.menuBrand}>
            <Burger
              opened={menuOpen}
              onClick={() => setMenuOpen((isOpen) => !isOpen)}
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
            />
            <Link href={homeHref} className={classes.brand}>
              <ProductLockup height={28} />
            </Link>
          </div>

          <nav aria-label="Editions" className={classes.topbarEditions}>
            {editionLinks()}
          </nav>

          <div className={classes.topbarEnd}>
            <AccountMenu publication={publication} edition={edition} />
          </div>
        </header>

        <main id="main" tabIndex={-1} className={classes.main}>
          {children}
        </main>

        <footer className={classes.footer}>
          <Text size="xs" c="var(--ask-text-tertiary)">
            Ask Analyst is a product of Akseer Research. Figures are published for information only;
            they are not an offer, a recommendation, or investment advice.
          </Text>
        </footer>
      </div>

      <Drawer
        opened={menuOpen}
        onClose={closeMenu}
        title="Navigation"
        position={dir === 'rtl' ? 'right' : 'left'}
        size="xs"
        /* Mantine's close button is an icon with no name of its own. */
        closeButtonProps={{ 'aria-label': 'Close navigation' }}
      >
        <nav aria-label="Editions" className={classes.drawerEditions}>
          {editionLinks(closeMenu)}
        </nav>

        <PublicationSidebar
          variant="drawer"
          edition={edition}
          homeHref={homeHref}
          groups={groups}
          active={publication}
          onNavigate={closeMenu}
        />
      </Drawer>
    </div>
  );
}
