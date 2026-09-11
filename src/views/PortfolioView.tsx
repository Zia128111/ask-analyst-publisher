'use client';

import { useId, type CSSProperties, type ReactNode } from 'react';
import { useComputedColorScheme } from '@mantine/core';
import { formatDate } from '@akseer/ask-analyst-design-system';

import type { PortfolioReport, Publication } from '../data/types';
import { placementFor, styleOnReport } from '../branding/placement';
import { reportVars } from '../branding/reportVars';
import { CHART_DEFAULTS, familyName } from '../branding/types';
import { DownloadMenu } from '../components/report/DownloadMenu';
import { ExportStage } from '../components/report/ExportStage';
import { FlowTable } from '../components/report/FlowTable';
import { MastheadToggle } from '../components/report/MastheadToggle';
import { PortfolioChart } from '../components/report/PortfolioChart';
import { ReportSheet } from '../components/report/ReportSheet';
import { sheetDownloads } from '../components/report/sheetDownloads';
import { useExportStage } from '../components/report/useExportStage';
import { useMasthead } from '../components/report/useMasthead';

import classes from './PublicationView.module.css';
import layout from './PortfolioView.module.css';

/* ============================================================================
 * PORTFOLIO INVESTMENT — FIPI / LIPI Daily Movement
 * ============================================================================
 * As the benchmark (the live /portfolio-investment page) lays it out: the
 * masthead toggle and the Download menu, the letterheaded sheet across the
 * full grid with the day's flows — each type of local investor and their
 * net (LIPI), each foreign type and theirs (FIPI), the foreign net to date —
 * by sector, then under it the second table, the same flows without the
 * sectors, beside a column chart of each type's net.
 *
 * THE REPORT STYLE here is what the screen shows (src/branding/placement.
 * ts): the company name on the publisher band, the logo, the typeface and
 * text size, the rules, the fill of the bands and both tables' headers, the
 * highlight on the main table's Net column, the source line and the chart's
 * bar colour. Unset, they are every sheet's defaults — the brand tint, the
 * highlight following the fill, blue rules — not the live page's dark blue
 * and grey (the user's call).
 *
 * DOWNLOADS, as the user specified:
 *   PNG    two pictures from one choice: the main table's sheet and the
 *          second table's, each with the letterhead and source — two files.
 *   PDF    the main table's sheet on page 1, the joint venture's disclaimer
 *          on page 2, after the published PDF (src/exports/portfolioPdf.ts).
 *   Excel  both tables and the chart in one sheet (portfolioWorkbook.ts).
 * The pictures come from off-screen light copies (ExportStage): the main
 * sheet across the full grid, the second table on MTS's seven columns.
 * ========================================================================= */

/** The page's full grid, 1300px: fifteen columns of figures need it at every text size. */
const FULL_GRID = 12;
/** The second table's picture: four columns of figures read best on the seven-column sheet. */
const SUMMARY_COLUMNS = 7;

const TABLE_TITLE = 'Portfolio Investment';
const UNITS = '(Figures in USD mn)';
const SECTORS_TITLE = 'Sector Wise Investment';

const sessionDate = (iso: string) => new Date(`${iso}T00:00:00+05:00`);

/** The Jama Punji mark for the PDF's footer; the PDF keeps the site's link without it. */
async function loadMark(): Promise<Uint8Array | null> {
  try {
    const response = await fetch('/brand/jamapunji.png');
    return response.ok ? new Uint8Array(await response.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

export function PortfolioView({
  edition,
  publication,
  report,
}: {
  edition: string;
  publication: Publication;
  report: PortfolioReport;
}) {
  const titleId = useId();
  const stageTitleId = useId();
  const summaryTitleId = useId();
  const stage = useExportStage();
  const summaryStage = useExportStage();
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const { branding, ready, masthead, choose, customLogo, customLabel, publisher, attribution, brandSlug } =
    useMasthead(edition);
  const style = styleOnReport(placementFor(publication.slug), branding);
  const source = style.source.trim() || report.source;

  const date = formatDate(sessionDate(report.asOf));
  const mainCaption =
    `${publication.title}, ${date}: what each type of local (LIPI) and foreign (FIPI) investor bought and ` +
    'sold and the net, overall and by sector, in USD millions, then the foreign net for the week, month, ' +
    'calendar year and fiscal year to date (WTD, MTD, CYTD, FYTD). Negative figures are in parentheses.';
  const summaryCaption =
    `${TABLE_TITLE} by investor type, ${date}: what each type of foreign and local investor bought and sold ` +
    'and the net, in USD millions. Negative figures are in parentheses.';

  const mainTable = (labelledBy: string) => (
    <FlowTable
      title={TABLE_TITLE}
      units={UNITS}
      sectorsTitle={SECTORS_TITLE}
      sectors={report.sectors}
      lines={report.lines}
      highlightNet
      labelledBy={labelledBy}
      caption={mainCaption}
    />
  );

  const summaryTable = () => (
    <FlowTable title={TABLE_TITLE} units={UNITS} sectors={[]} lines={report.summary} caption={summaryCaption} />
  );

  const sheet = (id: string, body: ReactNode) => (
    <ReportSheet
      masthead={masthead}
      customLogo={customLogo}
      publisher={publisher}
      title={publication.title}
      titleId={id}
      asOf={report.asOf}
      source={source}
    >
      {body}
    </ReportSheet>
  );

  const formats = sheetDownloads({
    stage,
    filename: `portfolio-investment-${brandSlug}-${report.asOf}`,
    orientation: 'landscape',
    pdf: {
      title: `${publication.title}, ${date}`,
      subject: attribution ? `Published under ${attribution}` : publication.title,
      author: publisher.name,
    },
    morePictures: [{ stage: summaryStage, filename: `portfolio-investment-by-investor-${brandSlug}-${report.asOf}` }],
    buildPdf: async (picture, meta) => {
      const [{ buildPortfolioPdf }, mark] = await Promise.all([import('../exports/portfolioPdf'), loadMark()]);
      return buildPortfolioPdf({ picture, meta, mark });
    },
    workbook: async () => {
      const { buildPortfolioWorkbook } = await import('../exports/portfolioWorkbook');
      return buildPortfolioWorkbook({ report, title: publication.title, publisher, attribution, source, style });
    },
  });

  return (
    <div
      className={`${classes.stack} ${classes.roomy}`}
      style={{ ...reportVars(style), '--report-columns': String(FULL_GRID) } as CSSProperties}
      data-branding-ready={ready || undefined}
    >
      <div className={classes.toolbar}>
        <MastheadToggle value={masthead} onChange={choose} customLabel={customLabel} />
        <DownloadMenu formats={formats} />
      </div>

      {sheet(titleId, mainTable(titleId))}

      <div className={layout.frame}>
        <div className={layout.summary}>
          <div className={layout.tableCell}>{summaryTable()}</div>
          <PortfolioChart
            title={`Net investment by investor type, ${date}`}
            bars={report.chart}
            scheme={scheme}
            bar={style.bar ?? CHART_DEFAULTS.bar}
            fontName={familyName(style.font)}
          />
        </div>
      </div>

      {/* `fit`: the tables' lines never wrap, so a table wider than its
          sheet widens the picture rather than losing its last columns. */}
      {stage.mounted && (
        <ExportStage stageRef={stage.ref} fit>
          {sheet(stageTitleId, mainTable(stageTitleId))}
        </ExportStage>
      )}
      {summaryStage.mounted && (
        <ExportStage
          stageRef={summaryStage.ref}
          fit
          style={{ '--report-columns': String(SUMMARY_COLUMNS) } as CSSProperties}
        >
          {sheet(summaryTitleId, summaryTable())}
        </ExportStage>
      )}
    </div>
  );
}
