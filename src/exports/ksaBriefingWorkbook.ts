import { tokens } from '@akseer/ask-analyst-design-system/tokens';

import { PAPER, readableOn } from '../branding/contrast';
import type { Branding } from '../branding/types';
import type { KsaMorningBriefing, Publisher, TopicTone } from '../data/types';
import {
  buildXlsx,
  styleRegistry,
  type XlsxEdge,
  type XlsxFont,
  type XlsxLink,
  type XlsxRow,
  type XlsxSheet,
  type XlsxStyle,
} from '../lib/xlsx';

/* ============================================================================
 * KSA MORNING BRIEFING — Excel download
 * ============================================================================
 * One sheet, headed as the briefing is: the edition's tag and the date, who
 * it goes out under (in words: a workbook cannot carry the logo), and
 * "Morning Briefing" in the heading colour. Then the topics as the sheet
 * lists them — each topic a real link to its story, its category in bold,
 * and its reading for the market in the positive or negative colour, in a
 * column of its own so a spreadsheet can sort and filter by it. The rules
 * the sheet's, the headings frozen, gridlines off, landscape.
 *
 * Imports only server-safe modules, so it also runs in Node.
 * ========================================================================= */

const color = tokens.semanticLight;
const SECONDARY = color['text-secondary'];
const MUTED = color['text-tertiary'];
const TEXT_BLUE = color['text-link'];
const RULE = color['border-brand'];

const TONE: Record<TopicTone, string> = {
  positive: color['positive-text'],
  negative: color['negative-text'],
  neutral: SECONDARY,
};

/** The parts of the Report style a workbook carries. */
export type KsaBriefingWorkbookStyle = Pick<Branding, 'heading' | 'tag'>;

/** Excel's character units at 11pt: the topic's column holds the longest topic on one line. */
const WIDTH = { topic: 100, category: 28, reading: 14 };
/** Points: a line of 11pt text, and a topic row's room around it. */
const LINE_POINTS = 15;
const ROW_ROOM_POINTS = 9;
const DATE_FORMAT = 'd mmmm", "yyyy';

export function buildKsaBriefingWorkbook({
  briefing,
  tag,
  title,
  publisher,
  attribution,
  style,
}: {
  briefing: KsaMorningBriefing;
  /** The edition's tag: "KSA". */
  tag: string;
  /** "Morning Briefing". */
  title: string;
  publisher: Publisher;
  /** Who the briefing goes out under, in words. '' leaves the line empty. */
  attribution: string;
  style: KsaBriefingWorkbookStyle;
}): Uint8Array {
  const face: XlsxFont = { name: 'Lato', family: 2 };
  const styles = styleRegistry();
  const cell = (font: XlsxFont, extra: XlsxStyle = {}) => styles.add({ font: { ...face, ...font }, ...extra });
  const rule: XlsxEdge = { style: 'thin', color: RULE };

  /* The title in the heading colour, as the sheet sets it. A cell cannot be
     a pill, so the tag is its word in the tag's colour where that reads on
     white, and ink where it does not. */
  const headingColour = style.heading ?? TEXT_BLUE;
  const tagColour = readableOn(style.tag ?? style.heading ?? TEXT_BLUE, PAPER);

  const heading = cell({ bold: true, size: 12, color: SECONDARY }, { bottom: rule, h: 'left', v: 'center' });
  const topicCell = cell({ size: 11, color: SECONDARY }, { bottom: rule, h: 'left', v: 'center', wrap: true });
  const linkCell = cell(
    { size: 11, color: SECONDARY, underline: true },
    { bottom: rule, h: 'left', v: 'center', wrap: true },
  );
  const categoryCell = cell({ bold: true, size: 11, color: SECONDARY }, { bottom: rule, h: 'left', v: 'center' });
  const readingCell = (tone: TopicTone) =>
    cell({ bold: true, size: 11, color: TONE[tone] }, { bottom: rule, h: 'left', v: 'center' });

  const header: XlsxRow[] = [
    { cells: [{ value: tag, style: cell({ bold: true, size: 11, color: tagColour }) }] },
    {
      cells: [
        {
          value: new Date(`${briefing.asOf}T00:00:00Z`),
          style: cell({ size: 11, color: MUTED }, { numFmt: DATE_FORMAT, h: 'left' }),
        },
      ],
    },
    { cells: attribution ? [{ value: attribution, style: cell({ size: 9, color: MUTED }) }] : [] },
    { cells: [] },
    { height: 30, cells: [{ value: title, style: cell({ bold: true, size: 20, color: headingColour }, { v: 'center' }) }] },
    { cells: [] },
    {
      height: 24,
      cells: [
        { value: 'Topic', style: heading },
        { value: 'Category', style: heading },
        { value: 'Sentiment', style: heading },
      ],
    },
  ];

  const links: XlsxLink[] = [];
  const topics: XlsxRow[] = briefing.topics.map((topic, i) => {
    const row = header.length + i + 1;
    if (topic.link) links.push({ cell: `A${row}`, url: topic.link });
    const lines = Math.max(1, Math.ceil(topic.title.length / (WIDTH.topic * 0.95)));
    return {
      height: lines * LINE_POINTS + ROW_ROOM_POINTS,
      cells: [
        { value: topic.title, style: topic.link ? linkCell : topicCell },
        { value: topic.category, style: categoryCell },
        { value: topic.sentiment, style: readingCell(topic.tone) },
      ],
    };
  });

  const sheet: XlsxSheet = {
    name: 'Morning Briefing',
    columns: [WIDTH.topic, WIDTH.category, WIDTH.reading],
    rows: [...header, ...topics],
    freezeRows: header.length,
    showGrid: false,
    orientation: 'landscape',
    links,
  };

  return buildXlsx({
    title: `${title}, ${tag}, ${briefing.asOf}`,
    author: publisher.name,
    styles: styles.list,
    sheets: [sheet],
  });
}
