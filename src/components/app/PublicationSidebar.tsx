'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Menu, TextInput, Tooltip, UnstyledButton, useDirection } from '@mantine/core';
import { LogoMark } from '@akseer/ask-analyst-design-system';
import { tokens } from '@akseer/ask-analyst-design-system/tokens';

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
 * call) — hovered or focused, the mark gives way to the expand arrows — then
 * the search as a button, which opens the sidebar with the field in focus,
 * and the groups' icons. Hovering or clicking a group's icon opens its
 * FLYOUT (the user's reference, 2026-09-14): a card beside the rail with the
 * group's name and its publications hanging from a line, so any page is one
 * click away without opening the sidebar. Below 1280px it sits in the
 * navigation drawer, without the head: following a link closes it.
 *
 * THE SEARCH narrows the list as it is typed, by a publication's name or its
 * group's, opening every section that still holds one; a hidden status line
 * says how many are left, and Escape clears it before it closes a drawer.
 *
 * LINKS, NOT TABS: every publication is its own page, so each is a link in
 * a <nav>, and "you are here" hangs off aria-current, which the styling reads
 * too. A section's heading is a button saying whether it is open; in the rail
 * it is a menu button, its flyout the menu.
 *
 * Collapsed or not is DRAWN from <html data-sidebar-collapsed>, set before
 * first paint (src/data/sidebar.ts); `collapsed` here words the buttons and
 * switches the groups' buttons between folding a section and opening a flyout.
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

/*
 * The flyout's timing and place, from the system's tokens. It opens a beat
 * after the pointer arrives, so running the pointer down the rail does not
 * flash every card, and closes a longer beat after it leaves, so the pointer
 * can cross the gap to the card; opening another group's card closes this one
 * at once. It stands a space-3 off its icon's button.
 */
const FLYOUT_OFFSET = parseFloat(tokens.space[3]);
const FLYOUT_OPEN_DELAY = parseFloat(tokens.duration.fast);
const FLYOUT_CLOSE_DELAY = parseFloat(tokens.duration.base);

/** The rail's open flyout, and whether the keyboard opened it. */
type Flyout = { group: NavGroupId; keyboard: boolean };

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
  const searchRef = useRef<HTMLInputElement>(null);

  /* At most one flyout is open. Leaving the rail forgets it, so collapsing
     again never reopens a card on its own. */
  const [flyout, setFlyout] = useState<Flyout | null>(null);
  const [flyoutRailed, setFlyoutRailed] = useState(railed);
  if (flyoutRailed !== railed) {
    setFlyoutRailed(railed);
    setFlyout(null);
  }

  /* Escape dismisses a card the pointer opened, wherever focus is (WCAG
     1.4.13); one opened from the keyboard also closes on Escape inside it,
     where Mantine returns focus to its icon. */
  useEffect(() => {
    if (!flyout) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFlyout(null);
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, [flyout]);

  const changeFlyout = (group: NavGroupId, opened: boolean, keyboard: boolean) =>
    setFlyout((current) => {
      if (!opened) return current?.group === group ? null : current;
      /* The pointer passing over a card the keyboard opened keeps it the
         keyboard's, with focus held inside. */
      if (current?.group === group && !keyboard) return current;
      return { group, keyboard };
    });

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
    if (next.has(group)) next.delete(group);
    else next.add(group);
    setClosed(next);
  };

  /* The rail's search button opens the sidebar with the field in focus. The
     attribute that draws the sidebar open is set within the call, so the
     field can take focus in the same click. */
  const openSearch = () => {
    onCollapsedChange?.(false);
    searchRef.current?.focus();
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
          ref={searchRef}
          className={classes.searchField}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && query) setQuery('');
          }}
          placeholder="Quick search"
          aria-label="Search publications"
          autoComplete="off"
          /* As wide as a heading's icon and its padding, so the magnifier
             stands over the sections' icons and the words start in line
             with their headings. */
          leftSection={<Icons.search size="sm" />}
          leftSectionWidth="var(--ask-control-md)"
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
        {variant === 'docked' && (
          <Tooltip label="Search publications" {...tooltip}>
            <UnstyledButton
              className={classes.railSearch}
              onClick={openSearch}
              aria-label="Search publications"
            >
              <Icons.search size="sm" />
            </UnstyledButton>
          </Tooltip>
        )}
      </div>

      <nav id={navId} aria-label="Publications" className={classes.nav}>
        {sections.map((section) => {
          const open = Boolean(needle) || !closed.has(section.id);
          const listId = `${id}-${section.id}`;
          const SectionIcon = SECTION_ICONS[section.id];
          const holdsPage = section.publications.some((p) => p.slug === active);
          const heading = (
            <>
              <SectionIcon size="sm" className={classes.sectionIcon} />
              <span className={classes.sectionLabel}>{section.label}</span>
              <Icons.chevronDown size="xs" className={classes.chevron} />
            </>
          );
          return (
            <div
              key={section.id}
              className={classes.section}
              data-closed={open ? undefined : true}
              data-current={holdsPage || undefined}
            >
              {railed ? (
                <RailFlyout
                  section={section}
                  edition={edition}
                  active={active}
                  opened={flyout?.group === section.id}
                  keyboard={flyout?.group === section.id && flyout.keyboard}
                  onChange={(opened, keyboard) => changeFlyout(section.id, opened, keyboard)}
                >
                  {heading}
                </RailFlyout>
              ) : (
                <UnstyledButton
                  className={classes.sectionToggle}
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={open}
                  aria-controls={listId}
                >
                  {heading}
                </UnstyledButton>
              )}

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

/**
 * A group in the rail: its icon, a menu button, and its flyout — a card
 * beside the rail with the group's name level with the icon and its
 * publications hanging from a line under the name, as they hang in the open
 * sidebar (the user's reference, 2026-09-14).
 *
 * A Mantine Menu: it opens on hover and on click, keeps the card open while
 * the pointer crosses to it, closes on a click outside, and moves through the
 * publications with the arrow keys. Opened from the keyboard (Enter or
 * Space), focus goes to the page in view, or the group's first page, and
 * stays in the card until Escape takes it back to the icon. Opened by the
 * pointer, focus stays where it was.
 */
function RailFlyout({
  section,
  edition,
  active,
  opened,
  keyboard,
  onChange,
  children,
}: {
  section: NavSection;
  edition: string;
  active: string | null;
  opened: boolean;
  keyboard: boolean;
  onChange: (opened: boolean, keyboard: boolean) => void;
  children: ReactNode;
}) {
  const start = section.publications.find((p) => p.slug === active) ?? section.publications[0];

  return (
    <Menu
      opened={opened}
      onChange={(next) => onChange(next, false)}
      trigger="click-hover"
      position="right-start"
      offset={FLYOUT_OFFSET}
      openDelay={FLYOUT_OPEN_DELAY}
      closeDelay={FLYOUT_CLOSE_DELAY}
      radius="lg"
      shadow="lg"
      trapFocus={keyboard}
      returnFocus={keyboard}
      withInitialFocusPlaceholder={false}
      menuItemTabIndex={0}
      classNames={{ dropdown: classes.flyout, item: classes.flyoutItem }}
    >
      <Menu.Target>
        <UnstyledButton
          className={classes.sectionToggle}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            onChange(true, true);
          }}
        >
          {children}
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        {/* The menu is already named by its button; the name is shown for
            the eye alone. */}
        <div className={classes.flyoutHeading} aria-hidden="true">
          {section.label}
        </div>
        <div className={classes.flyoutItems}>
          {section.publications.map((p) => (
            <Menu.Item
              key={p.slug}
              component={Link}
              href={`/${edition}/${p.slug}`}
              aria-current={p.slug === active ? 'page' : undefined}
              data-autofocus={p.slug === start?.slug || undefined}
            >
              {p.label}
            </Menu.Item>
          ))}
        </div>
      </Menu.Dropdown>
    </Menu>
  );
}
