'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

import type { Publication } from '../../data/types';

import classes from './PublicationNav.module.css';

/* ============================================================================
 * PUBLICATION NAVIGATION
 * ============================================================================
 * One row of underline tabs, one per publication, in the design system's
 * Tabs look.
 *
 * They are LINKS, not the Tabs component. Tabs are for switching panels
 * inside one page: each tab points (aria-controls) at a panel that must
 * exist, and arrow keys move between them. Every publication here is its own
 * page with its own URL, so it belongs in a <nav> of links that work with a
 * middle click, a new tab and the back button.
 *
 * "You are here" hangs off aria-current, like the design system's header:
 * the attribute a screen reader announces is the one the styling reads, so
 * the two cannot drift apart. When the row is wider than the screen it
 * scrolls sideways and the current tab is scrolled into view — a reader who
 * lands on Remittance sees Remittance, not the first four entries.
 * ========================================================================= */

export function PublicationNav({
  edition,
  publications,
  active,
}: {
  edition: string;
  publications: Publication[];
  active: string | null;
}) {
  const activeLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    /* `nearest` on the block axis, so this never scrolls the page vertically;
       it only moves the strip sideways when the link is out of view. */
    activeLink.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  return (
    <nav aria-label="Publications" className={classes.nav}>
      <ul className={classes.list}>
        {publications.map((p) => {
          const current = p.slug === active;
          return (
            <li key={p.slug} className={classes.item}>
              <Link
                ref={current ? activeLink : undefined}
                href={`/${edition}/${p.slug}`}
                className={classes.link}
                aria-current={current ? 'page' : undefined}
              >
                {p.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
