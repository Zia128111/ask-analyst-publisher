'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { TextInput, Tooltip, UnstyledButton, useDirection } from '@mantine/core';
import { LogoMark } from '@akseer/ask-analyst-design-system';

import type { NavGroupId, NavSection } from '../../data/types';
import { Icons } from '../../lib/icons';
import { ProductLockup } from '../ProductLockup';

import classes from './PublicationSidebar.module.css';

/* ============================================================================
 * PUBLICATION SIDEBAR
 * ============================================================================
 * After the user's reference (2026-09-14), in the design system's tokens: a
 * panel the full height of the screen with the logo at its head, in a row as
 * tall as the top bar so their rules meet in one line; a quick search; then
 * the publications in their groups (NAV_GROUPS) — Market, Research,
 * Companies, Economy, Sector — each under a small capital heading with its
 * icon that folds the section, each publication a row with its own icon. The
 * page in view wears the header's "you are here": the brand tint and link
 * blue.
 *
 * ONE COMPONENT, TWO PLACES. Docked beside the page from 1280px up, where
 * the button in its head collapses it to a narrow rail, remembered on this
 * device: the rail shows only the Ask Analyst mark at its head (the user's
 * call) — hovered or focused, the mark gives way to the expand arrows — and
 * the groups' icons, each named by a tooltip, a click opening the sidebar at
 * that group. Below 1280px it sits in the navigation drawer, without the
 * head: following a link closes it.
 *
 * THE SEARCH narrows the list as it is typed, by a publication's name or its
 * group's, opening every section that still holds one; a hidden status line
 * says how many are left, and Escape clears it before it closes a drawer.
 *
 * LINKS, NOT TABS: every publication is its own page, so each is a link in
 * a <nav>, and "you are here" hangs off aria-current, which the styling reads
 * too. A section's heading is a button saying whether it is open.
 *
 * Collapsed or not is DRAWN from <html data-sidebar-collapsed>, set before
 * first paint (src/data/sidebar.ts); `collapsed` here only words the buttons.
 * ========================================================================= */

type IconComponent = (typeof Icons)[keyof typeof Icons];

/** Each group's icon, on its heading and in the rail. */
const SECTION_ICONS: Record<NavGroupId, IconComponent> = {
  market: Icons.adjustments,
  research: Icons.briefing,
  companies: Icons.report,
  economy: Icons.world,
  sector: Icons.activity,
};

/** Each publication's icon, for what the report is about. */
const PUBLICATION_ICONS: Record<string, IconComponent> = {
  mts: Icons.candles,
  'portfolio-investment': Icons.flows,
  settlement: Icons.receipt,
  'morning-briefing': Icons.sunrise,
  'latest-result': Icons.reportAnalytics,
  bop: Icons.scale,
  'trade-pbs': Icons.ship,
  'trade-sbp': Icons.packageExport,
  remittance: Icons.cashBanknote,
  'central-government-debt': Icons.buildingBank,
  currency: Icons.currency,
  'oil-marketing': Icons.gasStation,
  cement: Icons.buildingFactory,
  fertilizer: Icons.plant,
  auto: Icons.car,
};

export function PublicationSidebar({
  edition,
  homeHref,
  groups,
  active,
  variant,
  collapsed = false,
  onCollapsedChange,
  onNavigate,
}: {
  edition: string;
  /** Where the logo leads: the edition's first publication. */
  homeHref: string;
  groups: NavSection[];
  /** The publication in view, from the URL. */
  active: string | null;
  /** Docked beside the page, or inside the navigation drawer. */
  variant: 'docked' | 'drawer';
  /** Docked only: drawn as the rail. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Called when a publication is followed. */
  onNavigate?: () => void;
}) {
  const id = useId();
  const { dir } = useDirection();
  const railed = variant === 'docked' && collapsed;
  const [query, setQuery] = useState('');
  const [closed, setClosed] = useState<ReadonlySet<NavGroupId>>(() => new Set());

  /* The rail shows no publications, so it ignores the search. */
  const needle = railed ? '' : query.trim().toLowerCase();
  const sections = needle
    ? groups
        .map((group) => ({
          ...group,
          publications: group.label.toLowerCase().includes(needle)
            ? group.publications
            : group.publications.filter((p) => p.label.toLowerCase().includes(needle)),
        }))
        .filter((group) => group.publications.length > 0)
    : groups;
  const found = sections.reduce((count, group) => count + group.publications.length, 0);

  const toggleSection = (group: NavGroupId) => {
    const next = new Set(closed);
    if (railed) {
      /* In the rail a group's icon opens the sidebar at that group. */
      next.delete(group);
      setClosed(next);
      onCollapsedChange?.(false);
      return;
    }
    if (next.has(group)) next.delete(group);
    else next.add(group);
    setClosed(next);
  };

  const navId = `${id}-nav`;
  const tooltip = {
    position: dir === 'rtl' ? ('left' as const) : ('right' as const),
    withArrow: true,
    classNames: { tooltip: classes.tooltip, arrow: classes.tooltipArrow },
  };

  return (
    <div className={classes.sidebar} data-variant={variant}>
      {variant === 'docked' && (
        <div className={classes.head}>
          <Link href={homeHref} className={classes.brand}>
            <ProductLockup height={28} />
          </Link>
          <Tooltip label={collapsed ? 'Expand the sidebar' : 'Collapse the sidebar'} {...tooltip}>
            <UnstyledButton
              className={classes.collapse}
              onClick={() => onCollapsedChange?.(!collapsed)}
              aria-label={collapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
              aria-expanded={!collapsed}
              aria-controls={navId}
            >
              {/* The rail's head: the Ask Analyst mark, giving way to the
                  arrows on hover or focus. The button's name says what it does. */}
              <LogoMark height={28} title={null} className={classes.mark} />
              <Icons.chevronsLeft size="sm" className={classes.collapseIcon} />
            </UnstyledButton>
          </Tooltip>
        </div>
      )}

      <div className={classes.search}>
        <TextInput
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && query) setQuery('');
          }}
          placeholder="Quick search"
          aria-label="Search publications"
          autoComplete="off"
          leftSection={<Icons.search size="sm" />}
          rightSection={
            query ? (
              <UnstyledButton
                className={classes.clear}
                onClick={() => setQuery('')}
                aria-label="Clear the search"
              >
                <Icons.close size="xs" />
              </UnstyledButton>
            ) : null
          }
          rightSectionPointerEvents="all"
          classNames={{ input: classes.searchInput }}
          /* A drawer closes on Escape unless the focused field says otherwise:
             while there is text, the first Escape clears it. */
          {...(query ? { 'data-mantine-stop-propagation': true } : {})}
        />
      </div>

      <nav id={navId} aria-label="Publications" className={classes.nav}>
        {sections.map((section) => {
          const open = Boolean(needle) || !closed.has(section.id);
          const listId = `${id}-${section.id}`;
          const SectionIcon = SECTION_ICONS[section.id];
          const holdsPage = section.publications.some((p) => p.slug === active);
          return (
            <div
              key={section.id}
              className={classes.section}
              data-closed={open ? undefined : true}
              data-current={holdsPage || undefined}
            >
              <Tooltip label={section.label} disabled={!railed} {...tooltip}>
                <UnstyledButton
                  className={classes.sectionToggle}
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={open && !railed}
                  aria-controls={listId}
                >
                  <SectionIcon size="sm" className={classes.sectionIcon} />
                  <span className={classes.sectionLabel}>{section.label}</span>
                  <Icons.chevronDown size="xs" className={classes.chevron} />
                </UnstyledButton>
              </Tooltip>

              <ul id={listId} className={classes.items}>
                {section.publications.map((p) => {
                  const ItemIcon = PUBLICATION_ICONS[p.slug] ?? Icons.report;
                  return (
                    <li key={p.slug}>
                      <Link
                        href={`/${edition}/${p.slug}`}
                        className={classes.item}
                        aria-current={p.slug === active ? 'page' : undefined}
                        onClick={onNavigate}
                      >
                        <ItemIcon size="sm" className={classes.itemIcon} />
                        <span className={classes.itemLabel}>{p.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {needle && found === 0 && (
          <p className={classes.empty}>No publications match “{query.trim()}”.</p>
        )}
        <p role="status" className="sr-only">
          {needle ? `${found} ${found === 1 ? 'publication' : 'publications'} found` : ''}
        </p>
      </nav>
    </div>
  );
}
