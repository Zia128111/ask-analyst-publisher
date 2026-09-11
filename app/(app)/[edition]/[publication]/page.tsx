import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { fetchAutoReport } from '../../../../src/data/auto';
import { fetchBopReport } from '../../../../src/data/bop';
import { fetchCementReport } from '../../../../src/data/cement';
import { fetchCentralGovernmentDebtReport } from '../../../../src/data/centralGovernmentDebt';
import { fetchCurrencyReport } from '../../../../src/data/currency';
import { fetchFertilizerReport } from '../../../../src/data/fertilizer';
import {
  DEFAULT_TICKER,
  fetchCompanies,
  fetchLatestResult,
} from '../../../../src/data/latestResult';
import { fetchMorningBriefing } from '../../../../src/data/morningBriefing';
import { fetchMtsReport } from '../../../../src/data/mts';
import { fetchOmcReport } from '../../../../src/data/omc';
import { fetchPortfolioReport } from '../../../../src/data/portfolio';
import { EDITIONS, findEdition, findPublication, isBuilt } from '../../../../src/data/publications';
import { fetchRemittanceReport } from '../../../../src/data/remittance';
import { fetchSettlementReport } from '../../../../src/data/settlement';
import { fetchTradePbsReport } from '../../../../src/data/tradePbs';
import { fetchTradeSbpReport } from '../../../../src/data/tradeSbp';
import type { MonthlyReport } from '../../../../src/data/types';
import { BopView } from '../../../../src/views/BopView';
import { CementView } from '../../../../src/views/CementView';
import { CurrencyView } from '../../../../src/views/CurrencyView';
import { LatestResultView } from '../../../../src/views/LatestResultView';
import { MonthlyView, type MonthlySheetKind } from '../../../../src/views/MonthlyView';
import { MorningBriefingView } from '../../../../src/views/MorningBriefingView';
import { MtsView } from '../../../../src/views/MtsView';
import { OmcView } from '../../../../src/views/OmcView';
import { PendingPublicationView } from '../../../../src/views/PendingPublicationView';
import { PortfolioView } from '../../../../src/views/PortfolioView';
import { RemittanceView } from '../../../../src/views/RemittanceView';
import { SettlementView } from '../../../../src/views/SettlementView';

/** The monthly sheets MonthlyView lays out, each with its accessor. */
const MONTHLY_SHEETS: Record<MonthlySheetKind, () => Promise<MonthlyReport>> = {
  'trade-pbs': fetchTradePbsReport,
  'trade-sbp': fetchTradeSbpReport,
  'central-government-debt': fetchCentralGovernmentDebtReport,
  fertilizer: fetchFertilizerReport,
  auto: fetchAutoReport,
};

const isMonthlySheet = (slug: string): slug is MonthlySheetKind => slug in MONTHLY_SHEETS;

/* ============================================================================
 * PUBLICATION — server component
 * ============================================================================
 * One route for every publication in every edition. The data is fetched HERE,
 * on the server, and handed to the view as a prop, so the figures are in the
 * HTML that reaches the browser rather than arriving after a client fetch.
 *
 * Only edition/publication pairs the catalogue lists are generated, and
 * `dynamicParams = false` makes anything else a 404 — /ksa/mts does not exist
 * because KSA does not carry MTS.
 *
 * LATEST RESULT is about one company, named in the URL: ?company=EFERT. Only
 * that branch reads the search parameters, so it renders per request while
 * every other publication stays prerendered. No parameter opens the
 * benchmark's company; an unlisted ticker redirects to the page without one.
 *
 * MORNING BRIEFING reads its live feed here, kept a few minutes
 * (src/data/morningBriefing.ts), so its pages are prerendered and refreshed
 * in the background as the feed changes. KSA's briefing is another report,
 * not built yet (`isBuilt`).
 * ========================================================================= */

type Params = Promise<{ edition: string; publication: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** The ?company= ticker, or the default. */
async function requestedTicker(searchParams: SearchParams) {
  const { company } = await searchParams;
  return typeof company === 'string' && company.trim() ? company : DEFAULT_TICKER;
}

// eslint-disable-next-line react/only-export-components
export const dynamicParams = false;

// eslint-disable-next-line react/only-export-components
export function generateStaticParams() {
  return EDITIONS.flatMap((e) => e.publications.map((p) => ({ edition: e.slug, publication: p })));
}

// eslint-disable-next-line react/only-export-components
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { edition, publication } = await params;
  const e = findEdition(edition);
  const p = findPublication(publication);
  if (!e || !p) return {};
  if (p.slug === 'latest-result') {
    const result = await fetchLatestResult(await requestedTicker(searchParams));
    if (result) return { title: `${p.title} · ${result.company.ticker} · ${e.label}` };
  }
  return { title: `${p.title} · ${e.label}` };
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { edition: editionSlug, publication: publicationSlug } = await params;
  const edition = findEdition(editionSlug);
  const publication = findPublication(publicationSlug);
  if (!edition || !publication || !edition.publications.includes(publication.slug)) notFound();

  if (publication.slug === 'mts') {
    return <MtsView edition={edition.slug} publication={publication} report={await fetchMtsReport()} />;
  }

  if (publication.slug === 'bop') {
    return <BopView edition={edition.slug} publication={publication} report={await fetchBopReport()} />;
  }

  if (publication.slug === 'oil-marketing') {
    return <OmcView edition={edition.slug} publication={publication} report={await fetchOmcReport()} />;
  }

  if (publication.slug === 'portfolio-investment') {
    return <PortfolioView edition={edition.slug} publication={publication} report={await fetchPortfolioReport()} />;
  }

  if (isMonthlySheet(publication.slug)) {
    const kind = publication.slug;
    return (
      <MonthlyView edition={edition.slug} publication={publication} report={await MONTHLY_SHEETS[kind]()} kind={kind} />
    );
  }

  if (publication.slug === 'cement') {
    return <CementView edition={edition.slug} publication={publication} report={await fetchCementReport()} />;
  }

  if (publication.slug === 'remittance') {
    return <RemittanceView edition={edition.slug} publication={publication} report={await fetchRemittanceReport()} />;
  }

  if (publication.slug === 'settlement') {
    return <SettlementView edition={edition.slug} publication={publication} report={await fetchSettlementReport()} />;
  }

  if (publication.slug === 'currency') {
    return <CurrencyView edition={edition.slug} publication={publication} report={await fetchCurrencyReport()} />;
  }

  if (publication.slug === 'morning-briefing' && isBuilt(edition.slug, publication.slug)) {
    return (
      <MorningBriefingView edition={edition.slug} publication={publication} briefing={await fetchMorningBriefing()} />
    );
  }

  if (publication.slug === 'latest-result') {
    const ticker = await requestedTicker(searchParams);
    const [companies, result] = await Promise.all([fetchCompanies(), fetchLatestResult(ticker)]);
    if (!result) {
      if (ticker === DEFAULT_TICKER) notFound();
      redirect(`/${edition.slug}/${publication.slug}`);
    }
    return (
      <LatestResultView
        edition={edition.slug}
        publication={publication}
        companies={companies}
        result={result}
      />
    );
  }

  const built = edition.publications.find((slug) => isBuilt(edition.slug, slug));
  const fallback = built ? { href: `/${edition.slug}/${built}`, label: findPublication(built)!.label } : null;

  return <PendingPublicationView edition={edition} publication={publication} fallback={fallback} />;
}
