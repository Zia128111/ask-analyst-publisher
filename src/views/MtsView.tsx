'use client';

import { useId } from 'react';
import { formatDate } from '@akseer/ask-analyst-design-system';

import type { MtsReport, Publication } from '../data/types';
import { reportVars } from '../branding/reportVars';
import { DownloadMenu } from '../components/report/DownloadMenu';
import { ExportStage } from '../components/report/ExportStage';
import { useExportStage } from '../components/report/useExportStage';
import { MastheadToggle } from '../components/report/MastheadToggle';
import { MtsTable } from '../components/report/MtsTable';
import { ReportSheet } from '../components/report/ReportSheet';
import { sheetDownloads } from '../components/report/sheetDownloads';
import { useMasthead } from '../components/report/useMasthead';

import classes from './PublicationView.module.css';

/* ============================================================================
 * MTS — Position Under Margin Trading System
 * ============================================================================
 * As the benchmark lays it out: the masthead toggle and the Download menu
 * above the sheet, then the letterheaded sheet with the table.
 *
 * THE MASTHEAD starts on the edition the reader came in through, or on an
 * uploaded company logo, and a toggle choice holds until the logo changes
 * (useMasthead).
 *
 * THE REPORT STYLE is applied as custom properties on the element around the
 * toolbar, the sheet and the export stage, so the three agree: the toolbar
 * keeps the sheet's measure as it widens for larger text, and the downloads
 * are made in the same typeface and colours as the screen. While the drawer
 * holds unapplied changes the view shows those, so every control previews
 * live; the saved style returns if they are discarded.
 *
 * DOWNLOADS (sheetDownloads). PNG and PDF are pictures of the sheet, made
 * from an off-screen light-scheme copy at full width (ExportStage) and
 * carrying whichever logo is showing. Excel is built from the report data,
 * so its figures are numbers a spreadsheet can use.
 *
 * The data arrives as a prop, fetched on the server by the route, so the
 * figures are in the HTML that reaches the browser.
 * ========================================================================= */

const sessionDate = (iso: string) => new Date(`${iso}T00:00:00+05:00`);

export function MtsView({
  edition,
  publication,
  report,
}: {
  edition: string;
  publication: Publication;
  report: MtsReport;
}) {
  const titleId = useId();
  const stageTitleId = useId();
  const stage = useExportStage();
  const { branding, ready, masthead, choose, customLogo, customLabel, publisher, attribution, brandSlug } =
    useMasthead(edition);
  const source = branding.source.trim() || report.source;

  const date = formatDate(sessionDate(report.asOf));
  const filename = `mts-${brandSlug}-${report.asOf}`;
  const caption = `Margin Trading System positions for the session of ${date}, largest open value first. Volumes and values in millions.`;

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
      <MtsTable rows={report.rows} labelledBy={id} caption={caption} />
    </ReportSheet>
  );

  const formats = sheetDownloads({
    stage,
    filename,
    pdf: {
      title: `${publication.title}, ${date}`,
      subject: attribution ? `Published under ${attribution}` : publication.title,
      author: publisher.name,
    },
    workbook: async () => {
      const { buildMtsWorkbook } = await import('../exports/mtsWorkbook');
      return buildMtsWorkbook({
        report,
        title: publication.title,
        publisher,
        attribution,
        source,
        style: branding,
      });
    },
  });

  return (
    <div
      className={classes.stack}
      style={reportVars(branding)}
      data-branding-ready={ready || undefined}
    >
      <div className={classes.toolbar}>
        <MastheadToggle value={masthead} onChange={choose} customLabel={customLabel} />
        <DownloadMenu formats={formats} />
      </div>

      {sheet(titleId)}

      {stage.mounted && <ExportStage stageRef={stage.ref}>{sheet(stageTitleId)}</ExportStage>}
    </div>
  );
}
