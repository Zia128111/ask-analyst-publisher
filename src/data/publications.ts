import type { Edition, Masthead, Publication, Publisher } from './types';

/* ============================================================================
 * PUBLICATIONS
 * ============================================================================
 * The catalogue behind the header's edition links and the publication
 * navigation. Static today; when it comes from the server the accessors below
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

/** In the order the live site lists them. Labels are the product's own. */
export const PUBLICATIONS: Publication[] = [
  { slug: 'mts', label: 'MTS', title: 'Position Under Margin Trading System (MTS)' },
  { slug: 'latest-result', label: 'Latest Result', title: 'Latest Results' },
  /* The sheet's own title, as the live page prints it on the title band. */
  { slug: 'bop', label: 'BOP', title: 'External Account Highlights' },
  { slug: 'oil-marketing', label: 'Oil Marketing', title: 'OMCs Cumulative Sales' },
  /* The published PDF's title; "Portfolio Investment" heads the tables. */
  { slug: 'portfolio-investment', label: 'Portfolio Investment', title: 'FIPI / LIPI Daily Movement' },
  { slug: 'morning-briefing', label: 'Morning Briefing', title: 'Morning Briefing' },
  /* The sheets' own titles, as the live pages print them. */
  { slug: 'trade-pbs', label: 'Trade-PBS', title: 'Balance of Trade' },
  { slug: 'trade-sbp', label: 'Trade-SBP', title: 'Export of Services break-up (USD mn)' },
  { slug: 'settlement', label: 'Settlement', title: 'Settlement of top 10 traded stocks' },
  { slug: 'remittance', label: 'Remittance', title: 'Workers’ Remittances (USD Mn)' },
  {
    slug: 'central-government-debt',
    label: 'Central Government Debt',
    title: 'Central Government Debt',
  },
  { slug: 'cement', label: 'Cement', title: 'Cement Price History (PKR/bag)' },
  { slug: 'fertilizer', label: 'Fertilizer', title: 'Fertilizer Offtake and Inventory' },
  { slug: 'currency', label: 'Currency', title: 'Weighted Average Exchange Rates' },
  { slug: 'auto', label: 'Auto', title: 'Auto Sales Volumes' },
];

const ALL = PUBLICATIONS.map((p) => p.slug);

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

/** The publications an edition carries, as navigation entries. */
export const publicationsFor = (edition: Edition) =>
  edition.publications
    .map(findPublication)
    .filter((p): p is Publication => p !== null);

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
