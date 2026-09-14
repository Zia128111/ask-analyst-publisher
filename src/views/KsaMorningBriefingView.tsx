'use client';

import { useId, type CSSProperties } from 'react';
import { formatDate } from '@akseer/ask-analyst-design-system';

import { placementFor, styleOnReport } from '../branding/placement';
import { reportVars } from '../branding/reportVars';
import type { Edition, KsaMorningBriefing, Masthead, Publication } from '../data/types';
import { DownloadMenu } from '../components/report/DownloadMenu';
import { ExportStage } from '../components/report/ExportStage';
import { KsaBriefingLetterhead } from '../components/report/KsaBriefingLetterhead';
import { MastheadToggle } from '../components/report/MastheadToggle';
import { ReportSheet } from '../components/report/ReportSheet';
import { sheetDownloads } from '../components/report/sheetDownloads';
import { TopicTable } from '../components/report/TopicTable';
import { useExportStage } from '../components/report/useExportStage';
import { useMasthead } from '../components/report/useMasthead';

import classes from './PublicationView.module.css';

/* ============================================================================
 * KSA MORNING BRIEFING
 * ============================================================================
 * KSA's own briefing, as the benchmark (the live /ksa/morning-briefing page,
 * 2026-09-14) lays it out — a report of its own, not the Pakistan briefing's
 * stories and markets: its header (the KSA tag and the date, "Morning
 * Briefing", Akseer's logo) over a table of the day's topics, each with its
 * category and its reading for the market. The data is its live feed
 * (src/data/ksaMorningBriefing.ts). The sheet spans the full grid, as the
 * benchmark's does.
 *
 * THE REPORT STYLE offers only the logo, the heading colour and the tag
 * colour, the user's list for this screen (src/branding/placement.ts); the
 * rest of the sheet keeps the system's look.
 *
 * THE LOGO is Akseer's, as live, with no switch above the sheet, since the
 * benchmark has none. An uploaded logo takes its place and joins it on a
 * switch, as an uploaded logo joins the built-in ones on every report.
 *
 * DOWNLOADS: PNG, the sheet; PDF, the sheet on one A4 landscape page, across
 * which a full-grid sheet prints (as Latest Result's does); Excel, the topics
 * with their links (src/exports/ksaBriefingWorkbook.ts).
 * ========================================================================= */

/** The page's full grid, as wide as the benchmark's sheet. */
const FULL_GRID = 12;

/** The built-in logo KSA's reports go out under. */
const KSA_MASTHEADS: readonly Masthead[] = ['akseer'];

const sessionDate = (iso: string) => new Date(`${iso}T00:00:00+05:00`);

export function KsaMorningBriefingView({
  edition,
  publication,
  briefing,
}: {
  edition: Edition;
  publication: Publication;
  briefing: KsaMorningBriefing;
}) {
  const titleId = useId();
  const stageTitleId = useId();
  const stage = useExportStage();
  const { branding, ready, masthead, choose, customLogo, customLabel, publisher, attribution, brandSlug } =
    useMasthead(edition.slug);
  const style = styleOnReport(placementFor(publication.slug, edition.slug), branding);
  const date = formatDate(sessionDate(briefing.asOf));

  const vars = { ...reportVars(style), '--report-columns': String(FULL_GRID) } as CSSProperties;

  const sheet = (id: string) => (
    <ReportSheet
      titleId={id}
      letterhead={
        <KsaBriefingLetterhead
          tag={edition.label}
          asOf={briefing.asOf}
          title={publication.title}
          titleId={id}
          masthead={masthead}
          customLogo={customLogo}
        />
      }
    >
      <TopicTable
        topics={briefing.topics}
        caption={`The topics of ${edition.label}'s Morning Briefing on ${date}, each with its category and its reading for the market.`}
      />
    </ReportSheet>
  );

  const formats = sheetDownloads({
    stage,
    filename: `morning-briefing-${edition.slug}-${brandSlug}-${briefing.asOf}`,
    pdf: {
      title: `${publication.title}, ${edition.label}, ${date}`,
      subject: attribution ? `Published under ${attribution}` : publication.title,
      author: publisher.name,
    },
    orientation: 'landscape',
    workbook: async () => {
      const { buildKsaBriefingWorkbook } = await import('../exports/ksaBriefingWorkbook');
      return buildKsaBriefingWorkbook({
        briefing,
        tag: edition.label,
        title: publication.title,
        publisher,
        attribution,
        style,
      });
    },
  });

  return (
    <div className={`${classes.stack} ${classes.roomy}`} style={vars} data-branding-ready={ready || undefined}>
      <div className={classes.toolbar}>
        {customLabel && (
          <MastheadToggle value={masthead} onChange={choose} customLabel={customLabel} choices={KSA_MASTHEADS} />
        )}
        <div className={classes.end}>
          <DownloadMenu formats={formats} />
        </div>
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
