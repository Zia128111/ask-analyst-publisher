'use client';

import { useId, type CSSProperties } from 'react';
import { formatDate } from '@akseer/ask-analyst-design-system';

import type { CurrencyReport, Publication } from '../data/types';
import { placementFor, styleOnReport } from '../branding/placement';
import { reportVars } from '../branding/reportVars';
import { DownloadMenu } from '../components/report/DownloadMenu';
import { ExportStage } from '../components/report/ExportStage';
import { MastheadToggle } from '../components/report/MastheadToggle';
import { RatesTable } from '../components/report/RatesTable';
import { ReportSheet } from '../components/report/ReportSheet';
import { sheetDownloads } from '../components/report/sheetDownloads';
import { useExportStage } from '../components/report/useExportStage';
import { useMasthead } from '../components/report/useMasthead';

import classes from './PublicationView.module.css';

/* ============================================================================
 * CURRENCY — Weighted Average Exchange Rates
 * ============================================================================
 * As the benchmark (the live /currency page) lays it out: the masthead
 * toggle and the Download menu, then the letterheaded sheet — the MTS bands
 * — over the State Bank's weighted average rates for six currencies: buying
 * and selling on the current and the previous date, and the change between
 * them (RatesTable), the USD column tinted as the live page tints it.
 *
 * THE DATE is the rates' own, from the feed: 22 August 2025 today, as the
 * live page prints it — the feed has not moved on since.
 *
 * THE SHEET spans nine grid columns (970px) at every text size: the live
 * sheet's width (about 960px).
 *
 * THE REPORT STYLE here is what the screen shows (src/branding/placement.
 * ts): MTS's list — company name, logo, typeface, text size, rules, the fill
 * of the bands and header, the source line — and the highlight on the USD
 * column. No negative figures colour (the changes print in the text colour,
 * as live) and no chart.
 *
 * Downloads are the sheet: PNG, PDF (portrait, as MTS) and Excel from the
 * data (src/exports/currencyWorkbook.ts).
 * ========================================================================= */

/** Grid columns the sheet spans, at every text size: the benchmark's width. */
const SHEET_COLUMNS = 9;
/** The currency the live page tints. */
const HIGHLIGHT = 'USD';

const sessionDate = (iso: string) => new Date(`${iso}T00:00:00+05:00`);

export function CurrencyView({
  edition,
  publication,
  report,
}: {
  edition: string;
  publication: Publication;
  report: CurrencyReport;
}) {
  const titleId = useId();
  const stageTitleId = useId();
  const stage = useExportStage();
  const { branding, ready, masthead, choose, customLogo, customLabel, publisher, attribution, brandSlug } =
    useMasthead(edition);
  const style = styleOnReport(placementFor(publication.slug), branding);
  const source = style.source.trim() || report.source;

  const date = formatDate(sessionDate(report.asOf));
  const caption =
    `${publication.title}, ${date}, in rupees a unit of ${report.currencies.join(', ')}: buying and selling ` +
    'on the current and the previous date, then the change between them in rupees.';

  const sheet = (id: string) => (
    <ReportSheet
      masthead={masthead}
      customLogo={customLogo}
      publisher={publisher}
      title={publication.title}
      titleId={id}
      asOf={report.asOf}
      source={source}
    >
      <RatesTable
        currencies={report.currencies}
        sections={report.sections}
        highlight={HIGHLIGHT}
        labelledBy={id}
        caption={caption}
      />
    </ReportSheet>
  );

  const formats = sheetDownloads({
    stage,
    filename: `currency-${brandSlug}-${report.asOf}`,
    pdf: {
      title: `${publication.title}, ${date}`,
      subject: attribution ? `Published under ${attribution}` : publication.title,
      author: publisher.name,
    },
    workbook: async () => {
      const { buildCurrencyWorkbook } = await import('../exports/currencyWorkbook');
      return buildCurrencyWorkbook({
        report,
        title: publication.title,
        highlight: HIGHLIGHT,
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
      style={{ ...reportVars(style), '--report-columns': String(SHEET_COLUMNS) } as CSSProperties}
      data-branding-ready={ready || undefined}
    >
      <div className={classes.toolbar}>
        <MastheadToggle value={masthead} onChange={choose} customLabel={customLabel} />
        <DownloadMenu formats={formats} />
      </div>

      {sheet(titleId)}

      {stage.mounted && (
        <ExportStage stageRef={stage.ref} fit>
          {sheet(stageTitleId)}
        </ExportStage>
      )}
    </div>
  );
}
