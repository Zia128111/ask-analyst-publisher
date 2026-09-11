'use client';

import { useId, type CSSProperties } from 'react';
import { formatDate, tokens } from '@akseer/ask-analyst-design-system';

import { BRIEFING_FURNITURE } from '../data/disclaimer';
import type {
  BriefingCommodity,
  BriefingCurrency,
  BriefingIndex,
  BriefingNet,
  BriefingSector,
  MorningBriefing,
  Publication,
} from '../data/types';
import { PAPER, readableOn } from '../branding/contrast';
import { placementFor, styleOnReport } from '../branding/placement';
import { reportVars } from '../branding/reportVars';
import type { ReportSize } from '../branding/types';
import { BriefingLetterhead } from '../components/report/BriefingLetterhead';
import { change, flow, level, price, rate } from '../components/report/briefingFigures';
import { DownloadMenu } from '../components/report/DownloadMenu';
import { ExportStage } from '../components/report/ExportStage';
import { MarketTable, type MarketColumn } from '../components/report/MarketTable';
import { MastheadToggle } from '../components/report/MastheadToggle';
import { NewsList } from '../components/report/NewsList';
import { ReportSheet } from '../components/report/ReportSheet';
import { sheetDownloads } from '../components/report/sheetDownloads';
import { useExportStage } from '../components/report/useExportStage';
import { useMasthead } from '../components/report/useMasthead';

import classes from './PublicationView.module.css';
import layout from './MorningBriefingView.module.css';

/* ============================================================================
 * MORNING BRIEFING
 * ============================================================================
 * As the benchmark (the live /morning-briefing page and the day's PDF) lays
 * it out: the masthead toggle and the Download menu, then the sheet — its
 * own header (the date, the logo, the title between blue rules), the day's
 * stories down the left, each with its link to the full story, and down the
 * right the markets of the session before in five tables: Net LIPI/FIPI
 * Position, FIPI Sector-wise, Major Indices, Commodities, Inter-Bank Currency
 * Rates. The data is the live feed (src/data/morningBriefing.ts).
 *
 * ON SCREEN the sheet spans the full grid, in line with the tabs' start and
 * end (the user's call): the stories eight columns, the tables four.
 *
 * THE PDF is A4 portrait, as the benchmark's is, so it pictures a narrower
 * copy of the sheet (`printStage`): ten grid columns at the standard size
 * (the stories six, the tables four), eleven and twelve at the larger
 * sizes — the page's proportions inside the reference's narrow margins, so
 * the briefing spans the page, its text at about 7.5pt rather than the
 * 5.5pt a full-grid picture would print. The PNG is the screen's sheet.
 *
 * THE REPORT STYLE here is what the sheet shows (src/branding/placement.
 * ts): the logo, typeface, text size, the rules — which also colour the
 * title and the tables' names where the colour reads as text — and the fill
 * of the tables' striped rows.
 *
 * DOWNLOADS: PNG, the sheet; PDF, two pages after the benchmark — the sheet,
 * its "Click here for more" still links, with the research contact and the
 * footer, then the joint venture's disclaimer (src/exports/briefingPdf.ts);
 * Excel, the stories with their links and the tables
 * (src/exports/briefingWorkbook.ts).
 * ========================================================================= */

/** The page's full grid, in line with the tabs. */
const FULL_GRID = 12;

/**
 * Grid columns the PDF's copy spans, by text size: as wide for its height as
 * the A4 page inside the reference's narrow margins, so it spans the page
 * as the published briefing does (the tables' column sets the height).
 */
const PRINT_COLUMNS: Record<ReportSize, number> = { standard: 10, large: 11, larger: 12 };

/** The headlines and the tables' names, one type-scale step over the text, as the benchmark's 16px over 14px. */
const LEAD: Record<ReportSize, string> = {
  standard: 'var(--ask-font-sm)',
  large: 'var(--ask-font-md)',
  larger: 'var(--ask-font-lg)',
};

const sessionDate = (iso: string) => new Date(`${iso}T00:00:00+05:00`);

/** A logo for the PDF's contact page, from public/brand; left out if it cannot be read. */
async function loadImage(src: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(src);
    return response.ok ? new Uint8Array(await response.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

const NET: MarketColumn<BriefingNet>[] = [
  { heading: 'USD mn', label: 'Net on the day, USD millions', value: (r) => flow(r.day) },
  { heading: 'CYTD', label: 'Net, calendar year to date, USD millions', value: (r) => flow(r.cytd) },
];

const SECTOR: MarketColumn<BriefingSector>[] = [
  { heading: 'USD mn', label: 'Foreign net, USD millions', value: (r) => flow(r.net) },
];

const INDICES: MarketColumn<BriefingIndex>[] = [
  { heading: 'Value', value: (r) => level(r.value) },
  { heading: 'Change', label: 'Change on the day, %', value: (r) => change(r.change, 1) },
  { heading: 'FYTD', label: 'Fiscal year to date, %', value: (r) => change(r.fytd, 1) },
  { heading: 'CYTD', label: 'Calendar year to date, %', value: (r) => change(r.cytd, 1) },
];

const COMMODITIES: MarketColumn<BriefingCommodity>[] = [
  { heading: 'Unit', text: true, value: (r) => r.unit },
  { heading: 'Price', value: (r) => price(r.price) },
  { heading: 'Change', label: 'Change on the day, %', value: (r) => change(r.change, 2) },
];

const CURRENCIES: MarketColumn<BriefingCurrency>[] = [
  { heading: 'Last Close', label: 'Last close, rupees', value: (r) => rate(r.close) },
  { heading: 'Change', label: 'Change on the day, %', value: (r) => change(r.change, 2) },
  { heading: 'CYTD %', label: 'Calendar year to date, %', value: (r) => change(r.cytd, 2) },
];

/*
 * The benchmark's foot, the user's ask: the research contact under the
 * tables, then the publisher's name under the stories and the Jama Punji
 * mark and site under the tables. The joint venture's furniture
 * (src/data/disclaimer.ts), not white-labelled. The PDF's copy leaves the
 * last line out: the page's own footer prints the name there.
 */
const { footerName, researchContact, investorEducation } = BRIEFING_FURNITURE;

/** The Jama Punji mark's height on the sheet, as the benchmark's. */
const MARK_HEIGHT = tokens.iconSize.lg;

function ResearchContact() {
  return (
    <p className={layout.contact}>
      <span className={layout.contactName}>{researchContact.name}</span>
      <a href={`mailto:${researchContact.email}`} className={layout.contactLink}>
        {researchContact.email}
      </a>
    </p>
  );
}

function SheetFooter() {
  return (
    <footer className={layout.footer}>
      <p className={layout.footerName}>{footerName}</p>
      <p className={layout.site}>
        <a href={investorEducation.url} target="_blank" rel="noopener noreferrer" className={layout.siteLink}>
          {investorEducation.label}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {/* The regulator's investor-education mark, as the benchmark shows it. */}
        <img
          src={investorEducation.logo.src}
          alt="Jama Punji, investor education by the SECP"
          className={layout.mark}
          width={Math.round(MARK_HEIGHT * investorEducation.logo.ratio)}
          height={MARK_HEIGHT}
        />
      </p>
    </footer>
  );
}

/** The stories and the markets, side by side: the sheet's body. */
function BriefingBody({ briefing, withFooter }: { briefing: MorningBriefing; withFooter: boolean }) {
  const on = formatDate(sessionDate(briefing.marketsAsOf));
  return (
    <>
      <div className={layout.body}>
        <NewsList stories={briefing.stories} />
        <div className={layout.markets}>
          <MarketTable
            title="Net LIPI/FIPI Position"
            columns={NET}
            rows={briefing.net}
            rowLabel={(r) => r.label}
            caption={`Net portfolio investment by investor type on ${on} and for the calendar year to date, USD millions.`}
          />
          <MarketTable
            title="FIPI Sector-wise"
            columns={SECTOR}
            rows={briefing.sectors}
            rowLabel={(r) => r.label}
            caption={`Foreign investors' net by sector on ${on}, USD millions.`}
          />
          <MarketTable
            title="Major Indices"
            labelHeading="Index"
            columns={INDICES}
            rows={briefing.indices}
            rowLabel={(r) => r.label}
            caption={`Major indices at the close on ${on}, with the change on the day and for the fiscal and calendar year to date, in percent.`}
          />
          <MarketTable
            title="Commodities"
            columns={COMMODITIES}
            rows={briefing.commodities}
            rowLabel={(r) => r.label}
            caption={`Commodity prices on ${on}, with the change on the day in percent.`}
          />
          <MarketTable
            title="Inter-Bank Currency Rates"
            columns={CURRENCIES}
            rows={briefing.currencies}
            rowLabel={(r) => r.pair}
            caption={`Inter-bank rates on ${on}, rupees per unit, with the change on the day and for the calendar year to date, in percent.`}
          />
          <ResearchContact />
        </div>
      </div>
      {withFooter && <SheetFooter />}
    </>
  );
}

export function MorningBriefingView({
  edition,
  publication,
  briefing,
}: {
  edition: string;
  publication: Publication;
  briefing: MorningBriefing;
}) {
  const titleId = useId();
  const stageTitleId = useId();
  const printTitleId = useId();
  const stage = useExportStage();
  const printStage = useExportStage();
  const { branding, ready, masthead, choose, customLogo, customLabel, publisher, attribution, brandSlug } =
    useMasthead(edition);
  const style = styleOnReport(placementFor(publication.slug), branding);
  const date = formatDate(sessionDate(briefing.asOf));

  /* The chosen border colour also colours the title and the tables' names,
     where it reads as text on the white report; else they keep the ink. */
  const vars = {
    ...reportVars(style),
    '--report-columns': String(FULL_GRID),
    '--briefing-lead': LEAD[style.size],
    ...(style.rule ? { '--briefing-accent': readableOn(style.rule, PAPER) } : {}),
  } as CSSProperties;

  /** The sheet; the PDF's copy leaves out the foot's last line, which the page's footer prints. */
  const sheet = (id: string, withFooter = true) => (
    <ReportSheet
      titleId={id}
      letterhead={
        <BriefingLetterhead
          asOf={briefing.asOf}
          title={publication.title}
          titleId={id}
          masthead={masthead}
          customLogo={customLogo}
        />
      }
    >
      <BriefingBody briefing={briefing} withFooter={withFooter} />
    </ReportSheet>
  );

  const formats = sheetDownloads({
    stage,
    pdfStage: printStage,
    filename: `morning-briefing-${brandSlug}-${briefing.asOf}`,
    pdf: {
      title: `${publication.title}, ${date}`,
      subject: attribution ? `Published under ${attribution}` : publication.title,
      author: publisher.name,
    },
    buildPdf: async (picture, meta) => {
      const { buildBriefingPdf } = await import('../exports/briefingPdf');
      return buildBriefingPdf({ picture, meta, loadImage });
    },
    workbook: async () => {
      const { buildBriefingWorkbook } = await import('../exports/briefingWorkbook');
      return buildBriefingWorkbook({ briefing, title: publication.title, publisher, attribution, style });
    },
  });

  return (
    <div className={`${classes.stack} ${classes.roomy}`} style={vars} data-branding-ready={ready || undefined}>
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
      {printStage.mounted && (
        <ExportStage
          stageRef={printStage.ref}
          fit
          style={{ '--report-columns': String(PRINT_COLUMNS[style.size]) } as CSSProperties}
        >
          {sheet(printTitleId, false)}
        </ExportStage>
      )}
    </div>
  );
}
