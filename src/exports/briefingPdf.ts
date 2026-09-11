import type { jsPDF } from 'jspdf';
import { tokens } from '@akseer/ask-analyst-design-system/tokens';

import { BRIEFING_FURNITURE, type BriefingFurniture, type ContactLogo } from '../data/disclaimer';
import { PAGE_MARGIN_MM, PX_TO_MM, type PdfMeta } from '../lib/pdf';
import type { CapturedImage } from '../lib/snapshot';

/* ============================================================================
 * MORNING BRIEFING — PDF download
 * ============================================================================
 * Two A4 PORTRAIT pages, after the day's published PDF the user supplied
 * ("MB 09112026.pdf"):
 *
 *   1  THE BRIEFING: the sheet as a picture — the copy laid out for this
 *      page (ten grid columns at the standard size), so its text prints at
 *      about 7.5pt; the research contact under its tables, as there — with
 *      every link still a link: the picture's link boxes become the page's
 *      link areas. Then the footer, "1/2" and the publisher's name (the
 *      sheet's own last line is left out of this copy, as the reference
 *      leaves it off page 1).
 *   2  THE DISCLAIMER, set as TEXT: the disclaimer, valuation methodology,
 *      ratings criteria with their table, dissemination policy and analyst
 *      certification, headings in blue as in the reference, then the
 *      contact details in three columns under the firms' logos and the Jama
 *      Punji mark; the footer "2/2". If the text would run past the page,
 *      it is set a quarter point smaller until it fits.
 *
 * THE MARGINS are the reference's, not the other PDFs' 12.7mm: the content
 * runs to about 6mm from the page's sides (space-6), so the briefing spans
 * the page as the published one does (the user: "extend the width of
 * content a bit more like my reference"); the footer keeps 12.7mm below.
 *
 * Helvetica, the PDF standard face (the reference's is a humanist sans), so
 * nothing is embedded. Colours are the system's light tokens. The furniture
 * is the joint venture's (src/data/disclaimer.ts), not white-labelled.
 *
 * Imports only server-safe modules; jsPDF loads on first use and the logos
 * come through `loadImage`, so this runs in Node as well as the browser.
 * ========================================================================= */

const color = tokens.semanticLight;
const INK = color['text-primary'];
const BODY = color['text-secondary'];
const LINK = color['text-link'];
/** The reference's blue headings, on the system's blue for text (4.9:1). */
const HEADING = color['text-link'];
const FOOTER = tokens.blue[8];

const PT_TO_MM = 25.4 / 72;
const LEADING = 1.4;

/** Type sizes in points: the disclaimer page's start, and its floor when it has to fit. */
const TYPE = { heading: 11, body: 9, bodyFloor: 7.5, footer: 9 } as const;
/** Millimetres. */
const GAP = { heading: 1.2, paragraph: 2, section: 3.5, columns: 8, logo: 3, block: 6, ratingColumn: 28 } as const;

/** The white border round the sheet's picture, in CSS pixels: the export stage's padding (ExportStage.module.css). */
const PICTURE_BORDER_PX = parseFloat(tokens.space[4]);

/** Millimetres: the reference's narrow sides and top, and the usual room under the footer. */
const MARGIN = {
  side: parseFloat(tokens.space[6]) * PX_TO_MM,
  top: parseFloat(tokens.space[8]) * PX_TO_MM,
  foot: PAGE_MARGIN_MM,
} as const;
const UNDERLINE = { offset: 0.6, weight: 0.2 };

type Doc = jsPDF;

const lineHeight = (points: number) => points * PT_TO_MM * LEADING;
const capHeight = (points: number) => points * PT_TO_MM * 0.72;

function font(doc: Doc, style: 'normal' | 'bold', size: number, colour: string = INK) {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  doc.setTextColor(colour);
}

function link(doc: Doc, text: string, x: number, y: number, url: string, align: 'left' | 'right' = 'left') {
  const width = doc.getTextWidth(text);
  const start = align === 'right' ? x - width : x;
  doc.setTextColor(LINK);
  doc.textWithLink(text, start, y, { url });
  doc.setDrawColor(LINK);
  doc.setLineWidth(UNDERLINE.weight);
  doc.line(start, y + UNDERLINE.offset, start + width, y + UNDERLINE.offset);
}

/** "1/2" at the inline-start and the publisher's name centred, on the bottom margin. Returns the footer's top. */
function footer(doc: Doc, furniture: BriefingFurniture, page: number, pages: number) {
  const width = doc.internal.pageSize.getWidth();
  const baseline = doc.internal.pageSize.getHeight() - MARGIN.foot;
  font(doc, 'normal', TYPE.footer, FOOTER);
  doc.text(`${page}/${pages}`, MARGIN.side, baseline);
  doc.text(furniture.footerName, width / 2, baseline, { align: 'center' });
  return baseline - capHeight(TYPE.footer);
}

/**
 * Page 1: the sheet's picture with its links — the research contact under
 * the tables is part of it, as on the screen — and the footer.
 */
function briefingPage(doc: Doc, furniture: BriefingFurniture, picture: CapturedImage) {
  const width = doc.internal.pageSize.getWidth();
  const footerTop = footer(doc, furniture, 1, 2);

  /* The SHEET, not the picture's white border, meets the margins, as on
     Portfolio Investment's PDF; the border falls in the margin. */
  const room = {
    width: width - 2 * MARGIN.side,
    height: footerTop - GAP.block - MARGIN.top,
  };
  const border = PICTURE_BORDER_PX;
  const sheet = { width: picture.width - 2 * border, height: picture.height - 2 * border };
  const scale = Math.min(room.width / sheet.width, room.height / sheet.height);
  const x = (width - sheet.width * scale) / 2 - border * scale;
  const y = MARGIN.top - border * scale;
  doc.addImage(picture.dataUrl, 'PNG', x, y, picture.width * scale, picture.height * scale, 'briefing', 'FAST');

  /* Each link box of the picture, a link area of the page. */
  for (const box of picture.links) {
    doc.link(x + box.x * scale, y + box.y * scale, box.width * scale, box.height * scale, { url: box.href });
  }
}

interface Logos {
  firms: (Uint8Array | null)[];
  investorEducation: Uint8Array | null;
}

/**
 * The disclaimer page's text, set at `body` points: drawn when `draw`, else
 * only measured. Returns where the text ends.
 */
function disclaimerFlow(doc: Doc, furniture: BriefingFurniture, logos: Logos, body: number, draw: boolean) {
  const width = doc.internal.pageSize.getWidth();
  const measure = width - 2 * MARGIN.side;
  const heading = body + (TYPE.heading - TYPE.body);
  const step = lineHeight(body);
  const put = (text: string | string[], x: number, y: number) => {
    if (draw) doc.text(text, x, y, { lineHeightFactor: LEADING });
  };

  let y = MARGIN.top;
  const paragraphs = (list: string[]) => {
    font(doc, 'normal', body, BODY);
    for (const paragraph of list) {
      const lines = doc.splitTextToSize(paragraph, measure) as string[];
      y += step;
      put(lines, MARGIN.side, y);
      y += (lines.length - 1) * step + GAP.paragraph;
    }
  };

  for (const section of furniture.sections) {
    font(doc, 'bold', heading, HEADING);
    y += capHeight(heading);
    put(section.heading, MARGIN.side, y);
    y += GAP.heading;
    paragraphs(section.paragraphs);

    if (section.table) {
      const [left, right] = section.table.heading;
      font(doc, 'bold', body, INK);
      y += step;
      put(left, MARGIN.side, y);
      put(right, MARGIN.side + GAP.ratingColumn, y);
      font(doc, 'normal', body, BODY);
      for (const [rating, expected] of section.table.rows) {
        y += step * 1.3;
        put(rating, MARGIN.side, y);
        put(expected, MARGIN.side + GAP.ratingColumn, y);
      }
      y += GAP.paragraph;
    }
    if (section.after) paragraphs(section.after);
    y += GAP.section - GAP.paragraph;
  }

  /* The contact details: the two firms and the Jama Punji mark, each under
     its logo, in three columns. */
  font(doc, 'bold', heading, HEADING);
  y += capHeight(heading);
  put(furniture.contactsHeading, MARGIN.side, y);
  y += GAP.heading + GAP.logo;

  const columnWidth = (measure - 2 * GAP.columns) / 3;
  const tallest = Math.max(...[...furniture.firms.map((f) => f.logo), furniture.investorEducation.logo].map((l) => l.height));
  const logoTop = y;
  const drawLogo = (logo: ContactLogo, bytes: Uint8Array | null, x: number) => {
    if (!draw || !bytes) return;
    const w = Math.min(columnWidth, logo.height * logo.ratio);
    const h = w / logo.ratio;
    /* Every logo stands on one line, the foot of the tallest. */
    doc.addImage(bytes, 'PNG', x, logoTop + tallest - h, w, h, logo.src, 'FAST');
  };

  const contactSize = body - 0.5;
  const contactStep = lineHeight(contactSize) * 1.1;
  let bottom = logoTop + tallest;
  furniture.firms.forEach((firm, i) => {
    const x = MARGIN.side + i * (columnWidth + GAP.columns);
    drawLogo(firm.logo, logos.firms[i] ?? null, x);
    let line = logoTop + tallest + GAP.logo;
    font(doc, 'normal', contactSize, BODY);
    line += contactStep;
    put(firm.name, x, line);
    for (const address of doc.splitTextToSize(firm.address, columnWidth) as string[]) {
      line += contactStep;
      put(address, x, line);
    }
    line += contactStep;
    put(`T: ${firm.phone}`, x, line);
    line += contactStep;
    const label = 'E: ';
    put(label, x, line);
    if (draw) link(doc, firm.email, x + doc.getTextWidth(label), line, `mailto:${firm.email}`);
    bottom = Math.max(bottom, line);
  });

  const { investorEducation } = furniture;
  const x = MARGIN.side + 2 * (columnWidth + GAP.columns);
  drawLogo(investorEducation.logo, logos.investorEducation, x);
  font(doc, 'normal', contactSize, BODY);
  const siteLine = logoTop + tallest + GAP.logo + contactStep;
  if (draw) link(doc, investorEducation.label, x, siteLine, investorEducation.url);

  return Math.max(bottom, siteLine);
}

/** Page 2: the disclaimer, at the largest size that fits above the footer. */
function disclaimerPage(doc: Doc, furniture: BriefingFurniture, logos: Logos) {
  const footerTop = footer(doc, furniture, 2, 2);
  const limit = footerTop - GAP.block;
  let body: number = TYPE.body;
  while (body > TYPE.bodyFloor && disclaimerFlow(doc, furniture, logos, body, false) > limit) body -= 0.25;
  disclaimerFlow(doc, furniture, logos, body, true);
}

export async function buildBriefingPdf({
  picture,
  meta,
  loadImage,
  furniture = BRIEFING_FURNITURE,
}: {
  /** The sheet, from the copy laid out for the page. */
  picture: CapturedImage;
  meta: PdfMeta;
  /** PNG bytes for a logo's path, or null to leave it out. */
  loadImage: (src: string) => Promise<Uint8Array | null>;
  furniture?: BriefingFurniture;
}): Promise<Blob> {
  const [{ jsPDF }, firms, investorEducation] = await Promise.all([
    import('jspdf'),
    Promise.all(furniture.firms.map((f) => loadImage(f.logo.src))),
    loadImage(furniture.investorEducation.logo.src),
  ]);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ ...meta, creator: 'Ask Analyst Publisher' });

  briefingPage(doc, furniture, picture);
  doc.addPage('a4', 'portrait');
  disclaimerPage(doc, furniture, { firms, investorEducation });

  return doc.output('blob');
}
