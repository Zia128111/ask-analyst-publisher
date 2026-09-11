'use client';

import { useId } from 'react';
import { formatDate } from '@akseer/ask-analyst-design-system';

import type { MonthlyReport, Publication } from '../data/types';
import { placementFor, styleOnReport } from '../branding/placement';
import { reportVars } from '../branding/reportVars';
import { DownloadMenu } from '../components/report/DownloadMenu';
import { ExportStage } from '../components/report/ExportStage';
import { MastheadToggle } from '../components/report/MastheadToggle';
import { MonthlyTable } from '../components/report/MonthlyTable';
import { monthlyCaption } from '../components/report/monthlyCaption';
import { ReportSheet } from '../components/report/ReportSheet';
import { sheetDownloads } from '../components/report/sheetDownloads';
import { useExportStage } from '../components/report/useExportStage';
import { useMasthead } from '../components/report/useMasthead';

import classes from './PublicationView.module.css';

/* ============================================================================
 * OIL MARKETING — OMCs Cumulative Sales
 * ============================================================================
 * As the benchmark lays it out: the masthead toggle and the Download menu,
 * then the letterheaded sheet — the MTS bands — over the month's sales in
 * thousand tonnes: the industry and each marketing company in bold, each
 * followed by its products, with this month and the year to date tinted
 * (MonthlyTable, shared with BOP).
 *
 * THE REPORT STYLE here is what the screen shows: the company name on the
 * publisher band and the logo, the typeface and text size, the rules, the
 * fills of the bands and header, the highlight on this month and the year to
 * date, and the source line, which names the publisher (src/branding/
 * placement.ts). No negative figures colour — sales are never negative and
 * the live page colours no change — and no chart.
 *
 * The sheet widens a grid column per text size step, as MTS does, so the
 * nine columns never scroll on the desktop; its 25 rows run past a 960px
 * screen, which the user accepts for long tables. Downloads are the sheet:
 * PNG, PDF (portrait, as MTS) and Excel from the data.
 * ========================================================================= */

const sessionDate = (iso: string) => new Date(`${iso}T00:00:00+05:00`);

export function OmcView({
  edition,
  publication,
  report,
}: {
  edition: string;
  publication: Publication;
  report: MonthlyReport;
}) {
  const titleId = useId();
  const stageTitleId = useId();
  const stage = useExportStage();
  const { branding, ready, masthead, choose, customLogo, customLabel, publisher, attribution, brandSlug } =
    useMasthead(edition);
  const style = styleOnReport(placementFor(publication.slug), branding);
  const source = style.source.trim() || report.source;

  const date = formatDate(sessionDate(report.asOf));
  const caption = monthlyCaption({
    title: publication.title,
    unit: 'thousand tonnes',
    columns: report.columns,
    notes:
      'The industry and each oil marketing company in bold, each followed by its products: MS, HSD and FO, ' +
      'and others for the industry. NM means not meaningful; a dash, no figure.',
  });

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
      <MonthlyTable units={report.units} columns={report.columns} rows={report.rows} labelledBy={id} caption={caption} />
    </ReportSheet>
  );

  const formats = sheetDownloads({
    stage,
    filename: `omc-${brandSlug}-${report.asOf}`,
    pdf: {
      title: `${publication.title}, ${date}`,
      subject: attribution ? `Published under ${attribution}` : publication.title,
      author: publisher.name,
    },
    workbook: async () => {
      const { buildMonthlyWorkbook } = await import('../exports/monthlyWorkbook');
      return buildMonthlyWorkbook({
        report,
        title: publication.title,
        sheetName: 'OMC',
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
      style={reportVars(style)}
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
