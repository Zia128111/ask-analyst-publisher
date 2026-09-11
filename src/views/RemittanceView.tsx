'use client';

import { useId, useMemo, type CSSProperties } from 'react';
import { useComputedColorScheme } from '@mantine/core';
import { formatDate, type Scheme } from '@akseer/ask-analyst-design-system';

import type { Publication, RemittanceReport } from '../data/types';
import { placementFor, styleOnReport } from '../branding/placement';
import { reportVars } from '../branding/reportVars';
import { CHART_DEFAULTS, familyName } from '../branding/types';
import { DownloadMenu } from '../components/report/DownloadMenu';
import { ExportStage } from '../components/report/ExportStage';
import { MastheadToggle } from '../components/report/MastheadToggle';
import { MonthlyTable } from '../components/report/MonthlyTable';
import { monthlyCaption } from '../components/report/monthlyCaption';
import type { MonthlyLook } from '../components/report/monthlyLook';
import { CHANGE_LABEL, RemittanceChart, TOTAL_LABEL } from '../components/report/RemittanceChart';
import { ReportSheet } from '../components/report/ReportSheet';
import { sheetDownloads } from '../components/report/sheetDownloads';
import { useExportStage } from '../components/report/useExportStage';
import { useMasthead } from '../components/report/useMasthead';

import classes from './PublicationView.module.css';
import layout from './SheetWithChart.module.css';

/* ============================================================================
 * REMITTANCE — Workers' Remittances (USD Mn)
 * ============================================================================
 * As the benchmark (the live /remittance page) lays it out: the masthead
 * toggle and the Download menu, then the letterheaded sheet — the MTS bands
 * — holding the month's remittances by country (MonthlyTable: this month
 * tinted, the unit in the title band so the heading over the countries is
 * blank, the total in bold), and under it the "Workers' Remittances" chart,
 * "Powered by Ask Analyst", and the source line last, as there.
 *
 * THE CHART is the benchmark's: the total as bars on a USD axis and its
 * change on the year as a line on a percent axis, in one plot — the one
 * exception to the design system's single-axis rule, the user's call
 * (RemittanceChart) — over the live chart's span: the latest 43 months,
 * Feb-23 to Aug-26 today.
 *
 * THE SHEET spans nine grid columns (970px) at every text size, the live
 * page's width.
 *
 * THE REPORT STYLE here is what the screen shows (src/branding/placement.
 * ts): MTS's list — company name, logo, typeface, text size, rules, the
 * fill of the bands and header, the source line — the highlight on this
 * month, and the chart's bar and line colours. No negative figures colour
 * (the amounts are never negative).
 *
 * DOWNLOADS are the whole sheet, chart included — it is part of the report
 * here, above its source line: PNG and PDF picture the light copy, which
 * waits for its chart to draw (sheetDownloads); Excel has the table and the
 * chart's months with the two panels as native charts
 * (src/exports/remittanceWorkbook.ts).
 * ========================================================================= */

/** Grid columns the sheet spans, at every text size: the benchmark's width. */
const SHEET_COLUMNS = 9;
/** The months the chart draws: the live chart's span, three years and seven months. */
const CHART_MONTHS = 43;
const CHART_TITLE = 'Workers’ Remittances';

/** The live page's look: this month tinted, the unit in the title, no negative amounts to colour. */
const LOOK: MonthlyLook = { tintCurrent: true, colourNegatives: false, oneLineLabels: true, unitsInTitle: true };

const sessionDate = (iso: string) => new Date(`${iso}T00:00:00+05:00`);

export function RemittanceView({
  edition,
  publication,
  report,
}: {
  edition: string;
  publication: Publication;
  report: RemittanceReport;
}) {
  const titleId = useId();
  const stageTitleId = useId();
  const stage = useExportStage();
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const { branding, ready, masthead, choose, customLogo, customLabel, publisher, attribution, brandSlug } =
    useMasthead(edition);
  const style = styleOnReport(placementFor(publication.slug), branding);
  const source = style.source.trim() || report.source;
  const months = useMemo(() => report.history.slice(-CHART_MONTHS), [report.history]);

  const date = formatDate(sessionDate(report.asOf));
  const caption = monthlyCaption({
    title: publication.title,
    unit: 'USD millions',
    columns: report.columns,
    notes: 'By the country they are sent from, then the total, in bold. NM means not meaningful; a dash, no figure.',
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
          changeDecimals={report.changeDecimals}
          look={LOOK}
        />
        <RemittanceChart
          title={CHART_TITLE}
          months={months}
          scheme={chartScheme}
          bar={style.bar ?? CHART_DEFAULTS.bar}
          line={style.line ?? CHART_DEFAULTS.line}
          fontName={familyName(style.font)}
        />
      </div>
    </ReportSheet>
  );

  const formats = sheetDownloads({
    stage,
    filename: `remittance-${brandSlug}-${report.asOf}`,
    pdf: {
      title: `${publication.title}, ${date}`,
      subject: attribution ? `Published under ${attribution}` : publication.title,
      author: publisher.name,
    },
    workbook: async () => {
      const { buildRemittanceWorkbook } = await import('../exports/remittanceWorkbook');
      return buildRemittanceWorkbook({
        report,
        months,
        title: publication.title,
        chartTitle: CHART_TITLE,
        labels: { total: TOTAL_LABEL, change: CHANGE_LABEL },
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
