'use client';

import { useId, type CSSProperties } from 'react';
import { useComputedColorScheme } from '@mantine/core';
import { formatDate, type Scheme } from '@akseer/ask-analyst-design-system';

import type { CementReport, Publication } from '../data/types';
import { placementFor, styleOnReport } from '../branding/placement';
import { reportVars } from '../branding/reportVars';
import { familyName } from '../branding/types';
import { CementChart } from '../components/report/CementChart';
import { DownloadMenu } from '../components/report/DownloadMenu';
import { ExportStage } from '../components/report/ExportStage';
import { MastheadToggle } from '../components/report/MastheadToggle';
import { MonthlyTable } from '../components/report/MonthlyTable';
import { monthlyCaption } from '../components/report/monthlyCaption';
import type { MonthlyLook } from '../components/report/monthlyLook';
import { ReportSheet } from '../components/report/ReportSheet';
import { sheetDownloads } from '../components/report/sheetDownloads';
import { useExportStage } from '../components/report/useExportStage';
import { useMasthead } from '../components/report/useMasthead';

import classes from './PublicationView.module.css';
import layout from './SheetWithChart.module.css';

/* ============================================================================
 * CEMENT — Cement Price History (PKR/bag)
 * ============================================================================
 * As the benchmark (the live /cement page) lays it out: the masthead toggle
 * and the Download menu, then the letterheaded sheet — the MTS bands —
 * holding the price of a bag in the North and South regions over the latest
 * five weeks (MonthlyTable: nothing tinted, the unit in the title band so
 * the heading over the regions is blank), and under it the year's weeks as
 * a line chart (CementChart), the source line last, as there.
 *
 * THE SHEET spans seven grid columns (750px) at every text size: the live
 * sheet is 690px wide, and seven is the narrowest the letterhead's bands and
 * logo box fit side by side.
 *
 * THE REPORT STYLE here is what the screen shows (src/branding/placement.
 * ts): MTS's list — company name, logo, typeface, text size, rules, the fill
 * of the bands and header, the source line. No highlight (no column is
 * tinted), no negative colour, and no chart colour: the chart's two lines
 * take the system's palette in its fixed order, where the drawer's bar and
 * line colours are one each.
 *
 * DOWNLOADS are the whole sheet, chart included, as Remittance's: PNG and
 * PDF picture the light copy, which waits for its chart to draw; Excel has
 * the table and the weeks with Excel's own line chart
 * (src/exports/cementWorkbook.ts).
 * ========================================================================= */

/** Grid columns the sheet spans, at every text size. */
const SHEET_COLUMNS = 7;
const CHART_TITLE = 'Cement Price History';

/** The live page's look: nothing tinted, the unit in the title. */
const LOOK: MonthlyLook = { tintCurrent: false, colourNegatives: false, oneLineLabels: true, unitsInTitle: true };

const sessionDate = (iso: string) => new Date(`${iso}T00:00:00+05:00`);

export function CementView({
  edition,
  publication,
  report,
}: {
  edition: string;
  publication: Publication;
  report: CementReport;
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
    unit: 'rupees a bag',
    columns: report.columns,
    notes: 'The price of a bag of cement in each region, the latest five weeks.',
  });

  /** The sheet; its chart follows the page on screen and is always light in the download's copy. */
  const sheet = (id: string, chartScheme: Scheme) => (
    <ReportSheet
      masthead={masthead}
      customLogo={customLogo}
      publisher={publisher}
      title={publication.title}
      titleId={id}
      asOf={report.asOf}
      source={source}
    >
      <div className={layout.body}>
        <MonthlyTable
          units={report.units}
          columns={report.columns}
          rows={report.rows}
          labelledBy={id}
          caption={caption}
          look={LOOK}
        />
        <CementChart
          title={CHART_TITLE}
          series={report.series}
          scheme={chartScheme}
          fontName={familyName(style.font)}
        />
      </div>
    </ReportSheet>
  );

  const formats = sheetDownloads({
    stage,
    filename: `cement-${brandSlug}-${report.asOf}`,
    pdf: {
      title: `${publication.title}, ${date}`,
      subject: attribution ? `Published under ${attribution}` : publication.title,
      author: publisher.name,
    },
    workbook: async () => {
      const { buildCementWorkbook } = await import('../exports/cementWorkbook');
      return buildCementWorkbook({
        report,
        title: publication.title,
        chartTitle: CHART_TITLE,
        publisher,
        attribution,
        source,
        style,
        look: LOOK,
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

      {sheet(titleId, scheme)}

      {stage.mounted && (
        <ExportStage stageRef={stage.ref} fit>
          {sheet(stageTitleId, 'light')}
        </ExportStage>
      )}
    </div>
  );
}
