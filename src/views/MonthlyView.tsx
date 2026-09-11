'use client';

import { useId, type CSSProperties } from 'react';
import { formatDate } from '@akseer/ask-analyst-design-system';

import type { MonthlyReport, Publication } from '../data/types';
import { placementFor, styleOnReport } from '../branding/placement';
import { reportVars } from '../branding/reportVars';
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

/* ============================================================================
 * MONTHLY SHEETS — Trade-PBS, Trade-SBP, Central Government Debt, Fertilizer,
 * Auto
 * ============================================================================
 * The monthly reports that are a letterheaded table and nothing else, laid
 * out as their benchmarks (the live pages): the masthead toggle and the
 * Download menu, then the sheet — the MTS bands — over the month's table
 * (MonthlyTable, shared with BOP, Oil Marketing and Remittance): detail
 * lines stepped in, changes to one decimal as the feeds publish them, every
 * label on one line. What differs is each sheet's entry in SHEETS:
 *
 *   TRADE-PBS  goods, as the Bureau of Statistics counts them: exports,
 *              imports and the deficit, then each by group, textiles by
 *              product under Textile. Its live page tints no column and
 *              prints the deficit in parentheses in the text colour.
 *   TRADE-SBP  goods and services, as the State Bank counts them: exports of
 *              each, the services by type, the total; a blank line; imports
 *              of each and the total. Its live page tints this month (and,
 *              from August, the year to date), as BOP does, and leaves the
 *              heading over the labels blank: the title carries "(USD mn)".
 *   CENTRAL GOVERNMENT DEBT  the debt's stock by kind, an outline three
 *              deep, this month tinted; its title names the table's month
 *              ("Central Government Debt Jul-26 (PKR bn)") where the live
 *              page's still reads "Apr-25".
 *   FERTILIZER  Urea, DAP and CAN, each by company and in total, a blank
 *              line between them: the month, the calendar year to date and
 *              inventory; this month and the year to date tinted; its title
 *              names the table's month where the live page's reads "Jun-25".
 *   AUTO       units sold: each maker in bold with its models under it,
 *              then passenger cars by engine size and in total, the other
 *              vehicles and the industry; this month tinted, the heading
 *              over the labels blank as live; its title names the table's
 *              month ("Auto Sales Volumes (July-26)") where the live page's
 *              is fixed at "August-25".
 *
 * THE SHEET spans each benchmark's width in grid columns at every text size
 * (the user: "Match the size of grid"): nine for the trade sheets (~960px
 * live) and Auto (953px), ten for Central Government Debt (~1,090px live)
 * and Fertilizer (~1,056px).
 *
 * THE REPORT STYLE is what each screen shows (src/branding/placement.ts):
 * MTS's list — the company name on the publisher band, the logo, the
 * typeface and text size, the rules, the fill of the bands and header, the
 * source line — and the highlight where a column is tinted. No negative
 * figures colour (none is coloured) and no chart.
 *
 * Downloads are the sheet: PNG, PDF (portrait, as MTS) and Excel from the
 * data. The export copy is `fit`: were a label to outgrow the sheet, the
 * picture would widen rather than wrap it.
 * ========================================================================= */

export type MonthlySheetKind = 'trade-pbs' | 'trade-sbp' | 'central-government-debt' | 'fertilizer' | 'auto';

/** What differs between the sheets. */
interface MonthlySheet {
  look: MonthlyLook;
  /** Grid columns the sheet spans, at every text size: the benchmark's width. */
  columns: number;
  /** The workbook's tab. */
  sheetName: string;
  /** The unit in words, for the caption: "USD millions". */
  unit: string;
  /** The caption's notes, for screen readers. */
  notes: string;
  /** The title band, where it names the table's month; the catalogue's title otherwise. */
  title?: (report: MonthlyReport) => string;
}

/** The month the table is for: "Jul-26". */
const currentMonth = (report: MonthlyReport) => report.columns.find((c) => c.current)?.label ?? '';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
/** "Jul-26" -> "July-26": the month written out, as the live Auto title writes it. */
const longMonth = (label: string) => {
  const name = MONTH_NAMES.find((month) => month.startsWith(label.slice(0, 3)));
  return name ? `${name}${label.slice(3)}` : label;
};

const SHEETS: Record<MonthlySheetKind, MonthlySheet> = {
  'trade-pbs': {
    look: { tintCurrent: false, colourNegatives: false, oneLineLabels: true, unitsInTitle: false },
    columns: 9,
    sheetName: 'Trade-PBS',
    unit: 'USD millions',
    notes:
      'Exports, imports and the trade deficit, then exports and imports by group, with textile exports by ' +
      'product under Textile. A deficit is in parentheses. NM means not meaningful; a dash, no figure.',
  },
  'trade-sbp': {
    look: { tintCurrent: true, colourNegatives: false, oneLineLabels: true, unitsInTitle: true },
    columns: 9,
    sheetName: 'Trade-SBP',
    unit: 'USD millions',
    notes:
      'Exports of goods and of services, with services exports by type, and their total; then imports of ' +
      'goods and of services and their total. NM means not meaningful; a dash, no figure.',
  },
  'central-government-debt': {
    look: { tintCurrent: true, colourNegatives: false, oneLineLabels: true, unitsInTitle: false },
    columns: 10,
    sheetName: 'Central Govt Debt',
    unit: 'PKR billions',
    notes:
      'Domestic debt in bold, then its long term — permanent, unfunded and foreign currency loans — short ' +
      'term and Naya Pakistan Certificates; then external debt, and the two together. The last column is the ' +
      'change since the fiscal year closed. NM means not meaningful; a dash, no figure.',
    title: (report) => `Central Government Debt ${currentMonth(report)} (PKR bn)`,
  },
  fertilizer: {
    look: { tintCurrent: true, colourNegatives: false, oneLineLabels: true, unitsInTitle: false },
    columns: 10,
    sheetName: 'Fertilizer',
    unit: 'thousand tonnes',
    notes:
      'Urea, DAP and CAN in turn, each by company and in total: the month, the calendar year to date, and ' +
      'inventory at the month’s end. NM means not meaningful; a dash, no figure.',
    title: (report) => `Fertilizer ${currentMonth(report)} Offtake and Inventory (‘000) tons`,
  },
  auto: {
    look: { tintCurrent: true, colourNegatives: false, oneLineLabels: true, unitsInTitle: true },
    columns: 9,
    sheetName: 'Auto',
    unit: 'units sold',
    notes:
      'Each maker in bold with its models under it; then passenger cars by engine size and in total, the ' +
      'other vehicles, and the industry in total. NM means not meaningful; a dash, no figure.',
    title: (report) => `Auto Sales Volumes (${longMonth(currentMonth(report))})`,
  },
};

const sessionDate = (iso: string) => new Date(`${iso}T00:00:00+05:00`);

export function MonthlyView({
  edition,
  publication,
  report,
  kind,
}: {
  edition: string;
  publication: Publication;
  report: MonthlyReport;
  kind: MonthlySheetKind;
}) {
  const titleId = useId();
  const stageTitleId = useId();
  const stage = useExportStage();
  const { branding, ready, masthead, choose, customLogo, customLabel, publisher, attribution, brandSlug } =
    useMasthead(edition);
  const style = styleOnReport(placementFor(publication.slug), branding);
  const source = style.source.trim() || report.source;
  const spec = SHEETS[kind];
  const title = spec.title ? spec.title(report) : publication.title;

  const date = formatDate(sessionDate(report.asOf));
  const caption = monthlyCaption({ title, unit: spec.unit, columns: report.columns, notes: spec.notes });

  const sheet = (id: string) => (
    <ReportSheet
      masthead={masthead}
      customLogo={customLogo}
      publisher={publisher}
      title={title}
      titleId={id}
      asOf={report.asOf}
      source={source}
    >
      <MonthlyTable
        units={report.units}
        columns={report.columns}
        rows={report.rows}
        labelledBy={id}
        caption={caption}
        changeDecimals={report.changeDecimals}
        look={spec.look}
      />
    </ReportSheet>
  );

  const formats = sheetDownloads({
    stage,
    filename: `${kind}-${brandSlug}-${report.asOf}`,
    pdf: {
      title: `${title}, ${date}`,
      subject: attribution ? `Published under ${attribution}` : title,
      author: publisher.name,
    },
    workbook: async () => {
      const { buildMonthlyWorkbook } = await import('../exports/monthlyWorkbook');
      return buildMonthlyWorkbook({
        report,
        title,
        sheetName: spec.sheetName,
        publisher,
        attribution,
        source,
        style,
        look: spec.look,
      });
    },
  });

  return (
    <div
      className={`${classes.stack} ${classes.roomy}`}
      style={{ ...reportVars(style), '--report-columns': String(spec.columns) } as CSSProperties}
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
