'use client';

import { useId, type CSSProperties } from 'react';
import { formatDate } from '@akseer/ask-analyst-design-system';

import type { Publication, SettlementReport } from '../data/types';
import { placementFor, styleOnReport } from '../branding/placement';
import { reportVars } from '../branding/reportVars';
import { DownloadMenu } from '../components/report/DownloadMenu';
import { ExportStage } from '../components/report/ExportStage';
import { MastheadToggle } from '../components/report/MastheadToggle';
import { ReportSheet } from '../components/report/ReportSheet';
import { SettlementTable } from '../components/report/SettlementTable';
import { sheetDownloads } from '../components/report/sheetDownloads';
import { useExportStage } from '../components/report/useExportStage';
import { useMasthead } from '../components/report/useMasthead';

import classes from './PublicationView.module.css';

/* ============================================================================
 * SETTLEMENT — Settlement of top 10 traded stocks
 * ============================================================================
 * As the benchmark (the live /settlement page) lays it out: the masthead
 * toggle and the Download menu, then the letterheaded sheet — the MTS bands
 * — over the day's ten most traded stocks by volume: what traded, in
 * millions of shares and of rupees, and the share settled under UIN and CM,
 * in percent (SettlementTable).
 *
 * THE SHEET spans nine grid columns (970px) at every text size: the live
 * page's width (about 960px), which the user asked the trade sheets to
 * match. The table fits it at all three sizes.
 *
 * THE REPORT STYLE here is what the screen shows (src/branding/placement.
 * ts): MTS's list — the company name on the publisher band, the logo, the
 * typeface and text size, the rules, the fill of the bands and header, and
 * the source line, which names the publisher. No highlight (no column is
 * set off), no negative figures colour (none is negative) and no chart.
 *
 * Downloads are the sheet: PNG, PDF (portrait, as MTS) and Excel from the
 * data. The export copy is `fit`: were a column to outgrow the sheet, the
 * picture would widen rather than wrap it.
 * ========================================================================= */

/** Grid columns the sheet spans, at every text size: the benchmark's width. */
const SHEET_COLUMNS = 9;

const sessionDate = (iso: string) => new Date(`${iso}T00:00:00+05:00`);

export function SettlementView({
  edition,
  publication,
  report,
}: {
  edition: string;
  publication: Publication;
  report: SettlementReport;
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
    `${publication.title}, ${date}: the ten stocks traded most by volume, each with its volume in millions ` +
    'of shares and value in millions of rupees, and the percentage settled under UIN and under CM.';

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
      <SettlementTable lines={report.lines} labelledBy={id} caption={caption} />
    </ReportSheet>
  );

  const formats = sheetDownloads({
    stage,
    filename: `settlement-${brandSlug}-${report.asOf}`,
    pdf: {
      title: `${publication.title}, ${date}`,
      subject: attribution ? `Published under ${attribution}` : publication.title,
      author: publisher.name,
    },
    workbook: async () => {
      const { buildSettlementWorkbook } = await import('../exports/settlementWorkbook');
      return buildSettlementWorkbook({ report, title: publication.title, publisher, attribution, source, style });
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
