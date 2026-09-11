import type { jsPDF } from 'jspdf';
import { tokens } from '@akseer/ask-analyst-design-system/tokens';

import { PDF_FURNITURE, type ContactCard, type PdfFurniture } from '../data/disclaimer';
import { PAGE_MARGIN_MM, type PdfMeta } from '../lib/pdf';
import type { CapturedImage } from '../lib/snapshot';

/* ============================================================================
 * PORTFOLIO INVESTMENT — PDF download
 * ============================================================================
 * Two A4 landscape pages, after the published PDF the user supplied ("FIPI
 * LIPI 09102026.pdf"):
 *
 *   1  THE REPORT: the main table's sheet as a picture (letterhead, table,
 *      source — the same picture as the PNG), the research contact under it
 *      at the inline-end, and the footer: page number, the publisher's name
 *      centred, and the investor-education site beside the Jama Punji mark.
 *   2  THE DISCLAIMER, set as TEXT (selectable, searchable, and sharp at any
 *      zoom): the disclaimer, the rights reserved, the dissemination policy
 *      and the two firms' contact details in two columns at the foot, with
 *      the same footer less the mark, as in the reference.
 *
 * The reference sets its text in Arial; this sets it in Helvetica, the PDF
 * standard face Arial was drawn to match, so nothing is embedded. Colours
 * are the design system's light tokens: ink for text, the link colour for
 * addresses, and the brand ramp's blue 8 for the footer, where the
 * reference has a dark blue of its own.
 *
 * The furniture and the legal text are the joint venture's
 * (src/data/disclaimer.ts) and are not white-labelled.
 *
 * Imports only server-safe modules; jsPDF loads on first use. The mark comes
 * in as bytes, so this runs in Node as well as the browser.
 * ========================================================================= */

const color = tokens.semanticLight;
const INK = color['text-primary'];
const LINK = color['text-link'];
const FOOTER = tokens.blue[8];

/** Points to millimetres. */
const PT_TO_MM = 25.4 / 72;

/** Type sizes in points, scaled from the reference's A2-sized page to A4. */
const TYPE = { heading: 11, body: 9.5, contact: 9, footer: 10, site: 7 } as const;
const LEADING = 1.45;

/** Millimetres. */
const GAP = { paragraph: 2.5, heading: 2, section: 4, columns: 10, block: 6 } as const;

/** The Jama Punji mark's proportions (public/brand/jamapunji.png, 732 × 132px) and printed height. */
const MARK = { ratio: 732 / 132, height: 5 };

/** An underline's offset below the baseline and its weight, in millimetres. */
const UNDERLINE = { offset: 0.6, weight: 0.2 };

/** The white border round the sheet's picture, in CSS pixels: the export stage's padding (ExportStage.module.css). */
const PICTURE_BORDER_PX = parseFloat(tokens.space[4]);

type Doc = jsPDF;

const lineHeight = (points: number) => points * PT_TO_MM * LEADING;
/** A capital's height, near enough for placing a first baseline under a top edge. */
const capHeight = (points: number) => points * PT_TO_MM * 0.72;

function font(doc: Doc, style: 'normal' | 'bold', size: number, colour: string = INK) {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  doc.setTextColor(colour);
}

/** A mailto or web link, underlined as the reference underlines it. Returns its width. */
function link(doc: Doc, text: string, x: number, y: number, url: string, align: 'left' | 'right' = 'left') {
  const width = doc.getTextWidth(text);
  const start = align === 'right' ? x - width : x;
  doc.setTextColor(LINK);
  doc.textWithLink(text, start, y, { url });
  doc.setDrawColor(LINK);
  doc.setLineWidth(UNDERLINE.weight);
  doc.line(start, y + UNDERLINE.offset, start + width, y + UNDERLINE.offset);
  return width;
}

/**
 * The page number, the publisher's name centred, and on the first page the
 * investor-education site beside the Jama Punji mark at the inline-end, all
 * on the bottom margin. Returns the footer's top edge.
 */
function footer(doc: Doc, furniture: PdfFurniture, page: number, mark: Uint8Array | null) {
  const width = doc.internal.pageSize.getWidth();
  const baseline = doc.internal.pageSize.getHeight() - PAGE_MARGIN_MM;
  font(doc, 'normal', TYPE.footer, FOOTER);
  doc.text(String(page), PAGE_MARGIN_MM, baseline);
  doc.text(furniture.footerName, width / 2, baseline, { align: 'center' });
  const textTop = baseline - capHeight(TYPE.footer);
  if (page !== 1) return textTop;

  const markWidth = MARK.height * MARK.ratio;
  const markLeft = width - PAGE_MARGIN_MM - markWidth;
  /* The mark centred on the footer's capitals. */
  const markTop = baseline - capHeight(TYPE.footer) / 2 - MARK.height / 2;
  if (mark) doc.addImage(mark, 'PNG', markLeft, markTop, markWidth, MARK.height, 'jamapunji', 'FAST');
  font(doc, 'normal', TYPE.site);
  link(doc, furniture.investorEducation.label, markLeft - GAP.paragraph, baseline, furniture.investorEducation.url, 'right');
  return Math.min(textTop, markTop);
}

/** Page 1: the sheet's picture, the research contact under it, the footer. */
function reportPage(doc: Doc, furniture: PdfFurniture, picture: CapturedImage, mark: Uint8Array | null) {
  const width = doc.internal.pageSize.getWidth();
  const footerTop = footer(doc, furniture, 1, mark);

  /* The research contact: the name centred over its address, the pair at
     the inline-end, as in the reference. */
  const { name, email } = furniture.researchContact;
  const emailLine = footerTop - GAP.block * 2;
  const nameLine = emailLine - lineHeight(TYPE.footer);
  font(doc, 'normal', TYPE.footer);
  const emailWidth = doc.getTextWidth(email);
  link(doc, email, width - PAGE_MARGIN_MM, emailLine, `mailto:${email}`, 'right');
  font(doc, 'bold', TYPE.footer);
  doc.text(name, width - PAGE_MARGIN_MM - emailWidth / 2, nameLine, { align: 'center' });

  /* The picture across the page, as large as the room above the contact
     allows. The SHEET, not the picture's white border, meets the margins,
     so the letterhead and the table line up with the footer below and
     the disclaimer's text overleaf; the border falls in the margin. */
  const room = { width: width - 2 * PAGE_MARGIN_MM, height: nameLine - capHeight(TYPE.footer) - GAP.block - PAGE_MARGIN_MM };
  const border = PICTURE_BORDER_PX;
  const sheet = { width: picture.width - 2 * border, height: picture.height - 2 * border };
  const scale = Math.min(room.width / sheet.width, room.height / sheet.height);
  const x = (width - sheet.width * scale) / 2 - border * scale;
  const y = PAGE_MARGIN_MM - border * scale;
  doc.addImage(picture.dataUrl, 'PNG', x, y, picture.width * scale, picture.height * scale, 'sheet', 'FAST');
}

/** One firm's contact card in its column. Returns the baseline after it. */
function contactCard(doc: Doc, card: ContactCard, x: number, top: number, columnWidth: number) {
  const step = lineHeight(TYPE.contact);
  let y = top + capHeight(TYPE.contact);

  font(doc, 'bold', TYPE.contact);
  doc.text(card.name, x, y);
  if (card.formerly) {
    /* A space after the name, which the reference runs straight on. */
    const nameWidth = doc.getTextWidth(`${card.name} `);
    font(doc, 'normal', TYPE.contact);
    if (nameWidth + doc.getTextWidth(card.formerly) <= columnWidth) {
      doc.text(card.formerly, x + nameWidth, y);
    } else {
      y += step;
      doc.text(card.formerly, x, y);
    }
  }

  font(doc, 'normal', TYPE.contact);
  const address = doc.splitTextToSize(card.address, columnWidth) as string[];
  y += step + GAP.heading;
  doc.text(address, x, y, { lineHeightFactor: LEADING });
  y += (address.length - 1) * step + step + GAP.heading;
  doc.text(`T: ${card.phone}`, x, y);
  y += step + GAP.heading;
  const label = 'E: ';
  doc.text(label, x, y);
  link(doc, card.email, x + doc.getTextWidth(label), y, `mailto:${card.email}`);
  return y;
}

/** The height a contact card takes, for placing the cards at the foot of the page. */
function contactHeight(doc: Doc, card: ContactCard, columnWidth: number) {
  font(doc, 'normal', TYPE.contact);
  const address = doc.splitTextToSize(card.address, columnWidth) as string[];
  font(doc, 'bold', TYPE.contact);
  const nameWidth = doc.getTextWidth(`${card.name} `);
  font(doc, 'normal', TYPE.contact);
  const formerlyWraps = card.formerly ? nameWidth + doc.getTextWidth(card.formerly) > columnWidth : false;
  const lines = 1 + (formerlyWraps ? 1 : 0) + address.length + 2;
  return capHeight(TYPE.contact) + (lines - 1) * lineHeight(TYPE.contact) + 3 * GAP.heading;
}

/** Page 2: the disclaimer as text, the contact details at the foot, the footer. */
function disclaimerPage(doc: Doc, furniture: PdfFurniture) {
  const width = doc.internal.pageSize.getWidth();
  const measure = width - 2 * PAGE_MARGIN_MM;
  const footerTop = footer(doc, furniture, 2, null);

  let y = PAGE_MARGIN_MM;
  for (const section of furniture.disclaimer) {
    font(doc, 'bold', TYPE.heading);
    y += capHeight(TYPE.heading);
    doc.text(section.heading, PAGE_MARGIN_MM, y);
    y += GAP.heading;
    font(doc, 'normal', TYPE.body);
    for (const paragraph of section.paragraphs) {
      const lines = doc.splitTextToSize(paragraph, measure) as string[];
      y += lineHeight(TYPE.body);
      doc.text(lines, PAGE_MARGIN_MM, y, { lineHeightFactor: LEADING });
      y += (lines.length - 1) * lineHeight(TYPE.body) + GAP.paragraph;
    }
    y += GAP.section - GAP.paragraph;
  }

  /* The two firms side by side at the foot of the page, as in the
     reference; never over the text above, however long it runs. */
  const columnWidth = (measure - GAP.columns) / 2;
  const cards = furniture.contacts;
  const cardsHeight = Math.max(...cards.map((card) => contactHeight(doc, card, columnWidth)));
  const headingHeight = capHeight(TYPE.heading) + GAP.heading * 2;
  const top = Math.max(y + GAP.block, footerTop - GAP.block * 2 - cardsHeight - headingHeight);

  font(doc, 'bold', TYPE.heading);
  doc.text(furniture.contactsHeading, PAGE_MARGIN_MM, top + capHeight(TYPE.heading));
  cards.forEach((card, i) =>
    contactCard(doc, card, PAGE_MARGIN_MM + i * (columnWidth + GAP.columns), top + headingHeight, columnWidth),
  );
}

export async function buildPortfolioPdf({
  picture,
  meta,
  mark,
  furniture = PDF_FURNITURE,
}: {
  /** The main table's sheet, from the export stage. */
  picture: CapturedImage;
  meta: PdfMeta;
  /** The Jama Punji mark, PNG bytes; null leaves it out and keeps the site's link. */
  mark: Uint8Array | null;
  furniture?: PdfFurniture;
}): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ ...meta, creator: 'Ask Analyst Publisher' });

  reportPage(doc, furniture, picture, mark);
  doc.addPage('a4', 'landscape');
  disclaimerPage(doc, furniture);

  return doc.output('blob');
}
