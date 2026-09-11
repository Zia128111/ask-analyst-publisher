'use client';

import { useId, useState, useTransition, type CSSProperties } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import type { Company, LatestResult, Publication } from '../data/types';
import { placementFor, styleOnReport } from '../branding/placement';
import { reportVars } from '../branding/reportVars';
import { CompanyLetterhead } from '../components/report/CompanyLetterhead';
import { CompanySearch } from '../components/report/CompanySearch';
import { DownloadMenu } from '../components/report/DownloadMenu';
import { ExportStage } from '../components/report/ExportStage';
import { useExportStage } from '../components/report/useExportStage';
import { MastheadToggle } from '../components/report/MastheadToggle';
import { ReportSheet } from '../components/report/ReportSheet';
import { ResultTable } from '../components/report/ResultTable';
import { sheetDownloads } from '../components/report/sheetDownloads';
import { useMasthead } from '../components/report/useMasthead';

import classes from './PublicationView.module.css';

/* ============================================================================
 * LATEST RESULT — a listed company's last published result
 * ============================================================================
 * As the benchmark lays it out: the company search, the masthead toggle and
 * the Download menu, then the sheet — the company's letterhead (ticker,
 * name, units, share price, logo) over its P&L summary.
 *
 * THE COMPANY LIVES IN THE URL (?company=LUCK). Choosing one in the search
 * replaces the URL; the route fetches that company's result on the server
 * and hands it down, so the figures are in the HTML, a refresh keeps the
 * company, and a link opens it. While the result loads, the search already
 * shows the new company, its icon turns to a spinner and the sheet is marked
 * busy; the masthead choice and the drawer's draft are untouched.
 *
 * THE SHEET SPANS THE FULL TWELVE-COLUMN GRID, not the seven of the MTS
 * sheet: ten columns of figures beside the labels need the page's width, as
 * in the benchmark. The Report style's larger text sizes therefore wrap long
 * labels rather than widening the sheet, and the PDF prints landscape.
 *
 * THE REPORT STYLE here is only what this report offers in the drawer: the
 * logo, the border colour, the row fills (header and highlight), the
 * typeface and the text size (src/branding/placement.ts). No source line
 * prints, whatever MTS has set, so nothing on this sheet comes from a
 * setting its drawer does not show.
 *
 * The masthead and the downloads work as on every sheet (useMasthead,
 * sheetDownloads). The Excel workbook is built from the result data.
 * ========================================================================= */

/** The page's full grid: 12 × 90 + 11 × 20 = 1300px. */
const FULL_GRID = 12;

export function LatestResultView({
  edition,
  publication,
  companies,
  result,
}: {
  edition: string;
  publication: Publication;
  companies: Company[];
  result: LatestResult;
}) {
  const titleId = useId();
  const stageTitleId = useId();
  const stage = useExportStage();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const { branding, ready, masthead, choose, customLogo, customLabel, publisher, attribution, brandSlug } =
    useMasthead(edition);
  const style = styleOnReport(placementFor(publication.slug), branding);

  const { company, price } = result;

  /* The search shows the company just chosen while its result loads, and
     follows the result once it arrives. */
  const [chosen, setChosen] = useState(company.ticker);
  const [shown, setShown] = useState(company.ticker);
  if (shown !== company.ticker) {
    setShown(company.ticker);
    setChosen(company.ticker);
  }

  const select = (ticker: string) => {
    setChosen(ticker);
    startTransition(() => {
      router.replace(`${pathname}?company=${encodeURIComponent(ticker)}`, { scroll: false });
    });
  };

  const chosenName = companies.find((c) => c.ticker === chosen)?.name ?? chosen;
  const source = style.source.trim() || result.source || '';

  const quarters = result.columns.filter((c) => c.kind === 'quarter');
  const toDate = result.columns.filter((c) => c.kind === 'todate');
  const caption =
    `${result.statement} of ${company.name}: the quarters ${quarters[0]?.label} to ` +
    `${quarters[quarters.length - 1]?.label} and ${toDate.map((c) => c.label).join(' and ')}, ` +
    `with the changes in percent. ${result.units}.`;

  const sheet = (id: string) => (
    <ReportSheet
      titleId={id}
      source={source || undefined}
      letterhead={
        <CompanyLetterhead
          company={company}
          units={result.units}
          price={price}
          titleId={id}
          label={publication.label}
          masthead={masthead}
          customLogo={customLogo}
        />
      }
    >
      <ResultTable
        statement={result.statement}
        columns={result.columns}
        rows={result.rows}
        labelledBy={id}
        caption={caption}
      />
    </ReportSheet>
  );

  const formats = sheetDownloads({
    stage,
    filename: ['latest-result', company.ticker.toLowerCase(), brandSlug, price?.asOf].filter(Boolean).join('-'),
    orientation: 'landscape',
    pdf: {
      title: `${publication.title}, ${company.name}`,
      subject: attribution ? `Published under ${attribution}` : publication.title,
      author: publisher.name,
    },
    workbook: async () => {
      const { buildResultWorkbook } = await import('../exports/resultWorkbook');
      return buildResultWorkbook({
        result,
        title: publication.title,
        publisher,
        attribution,
        source,
        style,
      });
    },
  });

  return (
    <div
      className={`${classes.stack} ${classes.roomy}`}
      style={{ ...reportVars(style), '--report-columns': String(FULL_GRID) } as CSSProperties}
      data-branding-ready={ready || undefined}
    >
      <div className={classes.search}>
        <CompanySearch companies={companies} value={chosen} onChange={select} pending={pending} />
      </div>

      <div className={classes.toolbar}>
        <MastheadToggle value={masthead} onChange={choose} customLabel={customLabel} />
        <DownloadMenu formats={formats} />
      </div>

      <div aria-busy={pending || undefined}>{sheet(titleId)}</div>

      <p className="sr-only" role="status">
        {pending ? `Loading ${chosenName}` : `Showing ${company.name}`}
      </p>

      {stage.mounted && <ExportStage stageRef={stage.ref}>{sheet(stageTitleId)}</ExportStage>}
    </div>
  );
}
