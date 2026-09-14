import type { Edition, Masthead, NavGroup, NavSection, Publication, Publisher } from './types';

/* ============================================================================
 * PUBLICATIONS
 * ============================================================================
 * The catalogue behind the header's edition links and the publication
 * sidebar. Static today; when it comes from the server the accessors below
 * become async and nothing that calls them changes shape.
 * ========================================================================= */

export const PUBLISHER: Publisher = {
  name: 'Akseer Research (Pvt) Ltd.',
};

/**
 * The brands a sheet can be printed under. `attribution` is what the logo
 * says in words: the alt text on screen, and the attribution line in the
 * Excel download, which cannot carry the logo. The Alpha Capital artwork
 * draws both SECP registrations: Alpha Capital REP-004, Akseer REP-400 R.
 */
export const MASTHEADS: Record<Masthead, { label: string; attribution: string }> = {
  alphacapital: {
    label: 'Alpha Capital',
    attribution: 'Alpha Capital, REN # REP - 004, and Akseer Research, REN # REP - 400 R',
  },
  askanalyst: { label: 'Ask Analyst', attribution: 'Ask Analyst' },
};

/**
 * Every publication, in the sidebar's order. Labels are the product's own,
 * the names the tabs first carried: the user tried shorter ones for the
 * sidebar ("FIPI LIPI", "Remittances", "Central Govt Debt", "OMC") and kept
 * these (2026-09-14). Titles are each sheet's own.
 */
export const PUBLICATIONS: Publication[] = [
  { slug: 'mts', label: 'MTS', title: 'Position Under Margin Trading System (MTS)' },
  /* The published PDF's title; "Portfolio Investment" heads the tables. */
  { slug: 'portfolio-investment', label: 'Portfolio Investment', title: 'FIPI / LIPI Daily Movement' },
  { slug: 'settlement', label: 'Settlement', title: 'Settlement of top 10 traded stocks' },
  { slug: 'morning-briefing', label: 'Morning Briefing', title: 'Morning Briefing' },
  { slug: 'latest-result', label: 'Latest Result', title: 'Latest Results' },
  /* The sheets' own titles, as the live pages print them on the title band. */
  { slug: 'bop', label: 'BOP', title: 'External Account Highlights' },
  { slug: 'trade-pbs', label: 'Trade-PBS', title: 'Balance of Trade' },
  { slug: 'trade-sbp', label: 'Trade-SBP', title: 'Export of Services break-up (USD mn)' },
  { slug: 'remittance', label: 'Remittance', title: 'Workers’ Remittances (USD Mn)' },
  {
    slug: 'central-government-debt',
    label: 'Central Government Debt',
    title: 'Central Government Debt',
  },
  { slug: 'currency', label: 'Currency', title: 'Weighted Average Exchange Rates' },
  { slug: 'oil-marketing', label: 'Oil Marketing', title: 'OMCs Cumulative Sales' },
  { slug: 'cement', label: 'Cement', title: 'Cement Price History (PKR/bag)' },
  { slug: 'fertilizer', label: 'Fertilizer', title: 'Fertilizer Offtake and Inventory' },
  { slug: 'auto', label: 'Auto', title: 'Auto Sales Volumes' },
];

/**
 * The sidebar's groups, each with its publications, both in the user's order
 * (2026-09-14). Every publication sits in exactly one group, and an edition
 * lists its publications in this order, so its first is MTS.
 */
export const NAV_GROUPS: NavGroup[] = [
  { id: 'market', label: 'Market', publications: ['mts', 'portfolio-investment', 'settlement'] },
  { id: 'research', label: 'Research', publications: ['morning-briefing'] },
  { id: 'companies', label: 'Companies', publications: ['latest-result'] },
  {
    id: 'economy',
    label: 'Economy',
    publications: ['bop', 'trade-pbs', 'trade-sbp', 'remittance', 'central-government-debt', 'currency'],
  },
  { id: 'sector', label: 'Sector', publications: ['oil-marketing', 'cement', 'fertilizer', 'auto'] },
];

const ALL = NAV_GROUPS.flatMap((group) => group.publications);

/*
 * KSA carries only the Morning Briefing today, matching the live site, where
 * the KSA link opens /ksa/morning-briefing. Its list grows as its
 * publications are built.
 */
export const EDITIONS: Edition[] = [
  { slug: 'askanalyst', label: 'Ask Analyst', publications: ALL },
  { slug: 'alphacapital', label: 'Alpha Capital', publications: ALL },
  { slug: 'ksa', label: 'KSA', publications: ['morning-briefing'] },
];

export const findEdition = (slug: string) => EDITIONS.find((e) => e.slug === slug) ?? null;

export const findPublication = (slug: string) =>
  PUBLICATIONS.find((p) => p.slug === slug) ?? null;

/**
 * The sidebar for an edition: each group with the publications that edition
 * carries, in order. A group with none is left out, so KSA shows Research
 * alone.
 */
export const navGroupsFor = (edition: Edition): NavSection[] =>
  NAV_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    publications: group.publications
      .filter((slug) => edition.publications.includes(slug))
      .map(findPublication)
      .filter((p): p is Publication => p !== null),
  })).filter((group) => group.publications.length > 0);

/** Where an edition's link lands: its first publication. */
export const editionHome = (edition: Edition) => `/${edition.slug}/${edition.publications[0]}`;

/** Publications with a built page. Everything else renders a "not built" state. */
export const BUILT_PUBLICATIONS = new Set([
  'mts',
  'latest-result',
  'bop',
  'oil-marketing',
  'portfolio-investment',
  'morning-briefing',
  'trade-pbs',
  'trade-sbp',
  'settlement',
  'remittance',
  'central-government-debt',
  'cement',
  'fertilizer',
  'currency',
  'auto',
]);

/*
 * Built publications an edition does not print yet. KSA's Morning Briefing
 * is a report of its own — the live page reads api/ksa/msg/mb, a list of
 * topics with a category — not the Pakistan briefing the other editions
 * share, so it keeps the "not built" page until it is designed.
 */
const PENDING_IN_EDITION: Record<string, ReadonlySet<string>> = {
  ksa: new Set(['morning-briefing']),
};

/** Whether an edition's publication has its page. */
export const isBuilt = (edition: string, publication: string) =>
  BUILT_PUBLICATIONS.has(publication) && !PENDING_IN_EDITION[edition]?.has(publication);
