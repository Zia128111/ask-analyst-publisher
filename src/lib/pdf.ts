import { tokens } from '@akseer/ask-analyst-design-system/tokens';

import type { CapturedImage } from './snapshot';

/* ============================================================================
 * PDF
 * ============================================================================
 * One A4 page carrying the report sheet as an image, scaled to fit inside the
 * page margins and centred across the page. Portrait by default; a sheet as
 * wide as the page's full grid (Latest Result, 1300px) goes landscape, where
 * its 14px figures print at about 8pt rather than 5. jsPDF is loaded on
 * first use.
 *
 * An image PDF, deliberately: it is pixel-identical to the sheet on screen and
 * to the PNG download. Its figures cannot be selected or searched — the Excel
 * download is the one to take for working with the numbers.
 * ========================================================================= */

/** CSS pixels to millimetres, at the 96 dpi CSS defines a pixel by. */
export const PX_TO_MM = 25.4 / 96;

/** The page margin is the design system's largest page gutter, space-12,
 *  converted to millimetres — 12.7mm, a conventional report margin. */
export const PAGE_MARGIN_MM = parseFloat(tokens.space[12]) * PX_TO_MM;

export interface PdfMeta {
  title: string;
  subject: string;
  author: string;
}

export type PdfOrientation = 'portrait' | 'landscape';

export async function imageToPdf(
  image: CapturedImage,
  meta: PdfMeta,
  orientation: PdfOrientation = 'portrait',
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ ...meta, creator: 'Ask Analyst Publisher' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const scale = Math.min(
    (pageWidth - 2 * PAGE_MARGIN_MM) / image.width,
    (pageHeight - 2 * PAGE_MARGIN_MM) / image.height,
  );
  const width = image.width * scale;
  const height = image.height * scale;

  doc.addImage(image.dataUrl, 'PNG', (pageWidth - width) / 2, PAGE_MARGIN_MM, width, height, undefined, 'FAST');
  return doc.output('blob');
}
