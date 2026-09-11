import { saveBlob, saveUrl } from '../../lib/download';
import { imageToPdf, type PdfMeta, type PdfOrientation } from '../../lib/pdf';
import { capturePng, type CapturedImage } from '../../lib/snapshot';
import { XLSX_MIME } from '../../lib/xlsx';
import type { DownloadFormat } from './DownloadMenu';

/* ============================================================================
 * SHEET DOWNLOADS — the Download menu's three formats for a report sheet
 * ============================================================================
 * PNG and PDF are pictures of the sheet, made from the off-screen,
 * light-scheme, full-width copy (ExportStage) and carrying whichever logo is
 * showing. Excel is built from the report DATA by the view's own workbook
 * builder, so its figures are numbers a spreadsheet can use. Each library
 * loads only when its format is chosen.
 *
 * A report with a second sheet (Portfolio Investment's second table) saves
 * each as a picture of its own from the one PNG choice (`morePictures`); and
 * a report that prints more than its sheet lays out its own PDF around the
 * sheet's picture (`buildPdf`: Portfolio Investment's disclaimer page).
 * ========================================================================= */

/** An export stage, as useExportStage returns it. */
export interface Stage {
  open: () => Promise<HTMLElement>;
  close: () => void;
}

/** Another sheet the PNG download saves, as its own picture. */
export interface Picture {
  stage: Stage;
  /** File name without its extension. */
  filename: string;
}

export interface SheetDownloadOptions {
  /** The view's export stage (useExportStage). */
  stage: Stage;
  /** File name without its extension. */
  filename: string;
  pdf: PdfMeta;
  /** A sheet as wide as the page's full grid prints across the page. */
  orientation?: PdfOrientation;
  /** Builds the workbook; import its builder inside, so it loads on demand. */
  workbook: () => Promise<Uint8Array>;
  /** Further sheets the PNG choice saves, each a file of its own, after the first. */
  morePictures?: Picture[];
  /** Makes the PDF from the sheet's picture, in place of the one-page PDF. */
  buildPdf?: (picture: CapturedImage, meta: PdfMeta) => Promise<Blob>;
  /**
   * A copy of the sheet laid out for the PDF's page, where it differs from
   * the screen's (the Morning Briefing prints narrower, on A4 portrait).
   */
  pdfStage?: Stage;
}

/*
 * Saves started in the same instant can be dropped by the browser; a short
 * pause between them lets each start. The browser may ask, once, whether the
 * site may save several files: that is its own guard, and the answer holds.
 */
const BETWEEN_SAVES_MS = 400;

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Two frames: one for the style change, one for its layout. */
const nextLayout = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/*
 * A `fit` stage (ExportStage) holds a table whose lines never wrap, so at
 * the widest face and largest size it can be wider than its sheet — Inter
 * at 18px runs 64px past Portfolio Investment's 1300px. The stage and the
 * sheet then grow by that much for the capture, so the picture has every
 * column and the letterhead still spans the table. A table that fits sets
 * nothing, and the picture is the sheet's own width.
 */
async function fitToTables(node: HTMLElement) {
  const sheet = node.querySelector('article');
  if (!node.hasAttribute('data-fit') || !sheet) return;
  const over = Math.max(0, ...[...sheet.querySelectorAll('table')].map((t) => t.offsetWidth - sheet.clientWidth));
  if (over === 0) return;
  node.style.setProperty('--sheet-grow', `${over}px`);
  await nextLayout();
}

/** The longest a picture waits for its charts: a picture without them beats no picture. */
const CHART_WAIT_MS = 8000;

/*
 * A sheet with a chart in it (Remittance) draws the chart again in the copy,
 * and Google Charts draws after the copy has mounted. Each chart frame says
 * when it has drawn (`data-chart` … `data-ready`); the picture waits for
 * every one, then a layout.
 */
async function chartsDrawn(node: HTMLElement) {
  const started = performance.now();
  while (node.querySelector('[data-chart]:not([data-ready])') && performance.now() - started < CHART_WAIT_MS) {
    await pause(100);
  }
  if (node.querySelector('[data-chart]')) await nextLayout();
}

/** A picture of a full-width, light-scheme sheet. */
async function snapshot(stage: Stage, pixelRatio: number) {
  const node = await stage.open();
  try {
    await chartsDrawn(node);
    await fitToTables(node);
    return await capturePng(node, pixelRatio);
  } finally {
    stage.close();
  }
}

export function sheetDownloads({
  stage,
  filename,
  pdf,
  orientation,
  workbook,
  morePictures = [],
  buildPdf,
  pdfStage = stage,
}: SheetDownloadOptions): DownloadFormat[] {
  return [
    {
      id: 'png',
      label: morePictures.length ? 'PNG images' : 'PNG image',
      extension: '.png',
      run: async () => {
        const pictures = [{ stage, filename }, ...morePictures];
        /* Every picture first, then the saves together, so a failure saves
           nothing rather than half the set. */
        const images: string[] = [];
        for (const picture of pictures) images.push((await snapshot(picture.stage, 2)).dataUrl);
        for (const [i, picture] of pictures.entries()) {
          if (i > 0) await pause(BETWEEN_SAVES_MS);
          saveUrl(`${picture.filename}.png`, images[i]);
        }
      },
    },
    {
      id: 'pdf',
      label: 'PDF document',
      extension: '.pdf',
      /* Three times the screen's resolution: about 320 dpi on an A4 page. */
      run: async () => {
        const picture = await snapshot(pdfStage, 3);
        saveBlob(`${filename}.pdf`, await (buildPdf ? buildPdf(picture, pdf) : imageToPdf(picture, pdf, orientation)));
      },
    },
    {
      id: 'xlsx',
      label: 'Excel workbook',
      extension: '.xlsx',
      run: async () =>
        saveBlob(`${filename}.xlsx`, new Blob([new Uint8Array(await workbook())], { type: XLSX_MIME })),
    },
  ];
}
