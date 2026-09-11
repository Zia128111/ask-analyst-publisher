'use client';

import { useId, type CSSProperties } from 'react';
import { useComputedColorScheme } from '@mantine/core';
import { formatDate } from '@akseer/ask-analyst-design-system';

import type { BopReport, Publication } from '../data/types';
import { placementFor, styleOnReport } from '../branding/placement';
import { reportVars } from '../branding/reportVars';
import { CHART_DEFAULTS, familyName } from '../branding/types';
import { BopChart } from '../components/report/BopChart';
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
import layout from './BopView.module.css';

/* ============================================================================
 * BOP — External Account Highlights
 * ============================================================================
 * As the benchmark lays it out: the masthead toggle and the Download menu,
 * then the report in two parts side by side — the letterheaded sheet with
 * the month's balance of payments, and the "Historical Current A/c Balance"
 * chart with "Powered by Ask Analyst" under it (BopView.module.css).
 *
 * THE REPORT STYLE here is what this report offers in the drawer: Latest
 * Result's list — the logo, the border colour, the fills, the typeface, the
 * text size — and the company name on the publisher band, as on MTS, and
 * the colours of the negative figures and of the chart's bars and line
 * (src/branding/placement.ts).
 *
 * DOWNLOADS ARE THE TABLE PART ONLY — the letterheaded sheet, not the chart
 * beside it (the user's call). PNG and PDF are pictures of the off-screen
 * light copy of the sheet, seven columns wide as on MTS, so the PDF prints
 * portrait as MTS does. Excel is built from the table's data.
 * ========================================================================= */

/**
 * The sheet's seven grid columns, at every text size: larger text wraps the
 * labels rather than widening the sheet into the chart. The export stage,
 * which holds the sheet alone, takes the same width.
 */
const SHEET_COLUMNS = 7;
const CHART_TITLE = 'Historical Current A/c Balance';

const sessionDate = (iso: string) => new Date(`${iso}T00:00:00+05:00`);

export function BopView({
  edition,
  publication,
  report,
}: {
  edition: string;
  publication: Publication;
  report: BopReport;
}) {
  const titleId = useId();
  const stageTitleId = useId();
  const stage = useExportStage();
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const { branding, ready, masthead, choose, customLogo, customLabel, publisher, attribution, brandSlug } =
    useMasthead(edition);
  const style = styleOnReport(placementFor(publication.slug), branding);
  const source = style.source.trim() || report.source;

  const date = formatDate(sessionDate(report.asOf));
  const caption = monthlyCaption({
    title: publication.title,
    unit: 'USD millions',
    columns: report.columns,
    notes: 'Balances in bold, each followed by its items. NM means not meaningful.',
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
    filename: `bop-${brandSlug}-${report.asOf}`,
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
        sheetName: 'BOP',
        publisher,
        attribution,
        source,
        style,
      });
    },
  });

  return (
    <div
      className={classes.stack}
      style={{ ...reportVars(style), '--report-columns': String(SHEET_COLUMNS) } as CSSProperties}
      data-branding-ready={ready || undefined}
    >
      <div className={layout.frame}>
        <div className={`${classes.toolbar} ${layout.toolbar}`}>
          <MastheadToggle value={masthead} onChange={choose} customLabel={customLabel} />
          <DownloadMenu formats={formats} />
        </div>

        <div className={layout.report}>
          <div className={layout.sheetCell}>{sheet(titleId)}</div>
          <BopChart
            title={CHART_TITLE}
            months={report.history}
            scheme={scheme}
            bar={style.bar ?? CHART_DEFAULTS.bar}
            line={style.line ?? CHART_DEFAULTS.line}
            fontName={familyName(style.font)}
          />
        </div>
      </div>

      {stage.mounted && <ExportStage stageRef={stage.ref}>{sheet(stageTitleId)}</ExportStage>}
    </div>
  );
}
