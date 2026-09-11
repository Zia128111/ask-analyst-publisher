import { tokens } from '@akseer/ask-analyst-design-system/tokens';

/* ============================================================================
 * COMPANY LOGO — from a chosen file to a stored image
 * ============================================================================
 * Every logo lives in one closed box beside the letterhead's bands (see
 * Masthead.module.css): the letterhead's full height, at most three grid
 * columns wide. Height is the fixed dimension — a logo is drawn at the box's
 * full height and its width follows its proportions — unless it is wider
 * than the box at that height, when it is scaled down to the box's width,
 * proportions intact. Two steps make the full height true of the ARTWORK,
 * not just of the file:
 *
 *   TRIM. Logos are often exported with empty space around them: a
 *   transparent margin, or white paper. Scaled to the box, that margin would
 *   take the full height and leave the artwork inside it smaller, so the
 *   margin is cut away — transparent pixels, or near-white ones when the
 *   file's border is white. A coloured background is part of the design and
 *   is kept. An SVG keeps its vectors: the drawing is measured and its
 *   viewBox tightened to it.
 *
 *   SIZE. Raster images are stored at no more than four times the box —
 *   sharp in the PDF (made at three times) and on any screen — since
 *   storage holds a few megabytes at most. A smaller image is enlarged to
 *   fit like any other, and `soft` tells the drawer to say it may print
 *   soft; `wide` tells it the logo is narrowed to the box and prints below
 *   full height. An SVG is sharp at any size.
 *
 * An uploaded SVG is only ever shown through <img>, where the browser runs
 * none of its scripts and loads none of its external references.
 * ========================================================================= */

export const LOGO_ACCEPT = 'image/png,image/jpeg,image/svg+xml,image/webp';

const px = (value: string) => parseFloat(value);

/**
 * The letterhead's logo box, in CSS pixels, from the same tokens the
 * stylesheets use: the bands' block (control-xs + control-sm + a 12px line
 * at 1.4 + two 4px gaps = 84.8px) by three grid columns (310px).
 */
export const LOGO_BOX = {
  width: px(tokens.grid.columnWidth) * 3 + px(tokens.grid.gutter) * 2,
  height:
    px(tokens.controlHeight.xs) +
    px(tokens.controlHeight.sm) +
    px(tokens.fontSize['2xs']) * parseFloat(tokens.lineHeight.normal) +
    2 * px(tokens.space[1]),
};

const RASTER_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_RASTER_BYTES = 5 * 1024 * 1024;
const MAX_SVG_BYTES = 512 * 1024;
/** Stored raster size: four times the logo box. */
const MAX_HEIGHT_PX = Math.ceil(LOGO_BOX.height * 4);
const MAX_WIDTH_PX = LOGO_BOX.width * 4;
/** About 1.5 MB of text: well inside every browser's storage quota. */
const MAX_STORED_CHARS = 1_500_000;
/** Margins are found on a copy at most this long, which keeps a 5 MB photo quick to scan. */
const SCAN_LONG_SIDE = 1600;
/** An SVG's intrinsic height once trimmed; only its proportions matter to the page. */
const SVG_HEIGHT = 340;
/** Alpha at or below which a pixel is empty. */
const ALPHA_FLOOR = 8;
/** Channel value at or above which an opaque pixel counts as white paper. */
const PAPER_FLOOR = 240;

/** A problem with the chosen file, worded for the person who chose it. */
export class LogoError extends Error {}

export interface PreparedLogo {
  /** A base64 data: URL, ready to store and show. */
  src: string;
  /** Wider than the box at full height: narrowed to fit, so it prints shorter. */
  wide: boolean;
  /** Fewer pixels than a sharp print at its printed size needs. */
  soft: boolean;
}

/** Wider than the logo box at the box's full height. */
const isWide = (width: number, height: number) =>
  width / height > LOGO_BOX.width / LOGO_BOX.height;

/**
 * Under two pixels per CSS pixel of the height it prints at — full height,
 * or less for a logo narrowed to the box — an image looks soft on a sharp
 * screen, and softer in the three-times PDF.
 */
const isSoft = (width: number, height: number) =>
  height < 2 * Math.min(LOGO_BOX.height, (LOGO_BOX.width * height) / width);

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new LogoError('That file could not be read.'));
    reader.readAsDataURL(file);
  });
}

async function decode(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
  } catch {
    throw new LogoError('That file could not be opened as an image.');
  }
  return image;
}

/**
 * The artwork's box inside an image's pixels, found by what surrounds it.
 * A border that is mostly transparent makes transparent pixels the margin;
 * a border that is nearly all white makes white (and transparent) the margin.
 * Anything else — a coloured tile, a photograph — has no margin to cut, and
 * the whole image is the artwork. 'empty' means nothing is drawn at all.
 */
function artworkBox(image: ImageData): Box | 'empty' | null {
  const { width, height, data } = image;
  const empty = (i: number) => data[i + 3] <= ALPHA_FLOOR;
  const paper = (i: number) =>
    data[i + 3] > 255 - ALPHA_FLOOR &&
    data[i] >= PAPER_FLOOR &&
    data[i + 1] >= PAPER_FLOOR &&
    data[i + 2] >= PAPER_FLOOR;

  let border = 0;
  let emptyBorder = 0;
  let paperBorder = 0;
  const tally = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    border += 1;
    if (empty(i)) emptyBorder += 1;
    else if (paper(i)) paperBorder += 1;
  };
  for (let x = 0; x < width; x++) {
    tally(x, 0);
    tally(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    tally(0, y);
    tally(width - 1, y);
  }

  let margin: (i: number) => boolean;
  if (emptyBorder >= border / 2) margin = empty;
  else if (emptyBorder + paperBorder >= border * 0.9) margin = (i) => empty(i) || paper(i);
  else return null;

  let top = height;
  let bottom = -1;
  let left = width;
  let right = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (margin((y * width + x) * 4)) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      bottom = y;
    }
  }
  if (bottom < 0) return 'empty';
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

/**
 * Where the artwork sits in a drawable of the given size, in its own pixels,
 * padded by one scanned pixel so anti-aliased edges survive. Null when there
 * is no margin to cut, or the browser will not let the pixels be read.
 */
function measure(source: CanvasImageSource, width: number, height: number): Box | 'empty' | null {
  const scale = Math.min(1, SCAN_LONG_SIDE / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(source, 0, 0, w, h);
  let pixels: ImageData;
  try {
    pixels = context.getImageData(0, 0, w, h);
  } catch {
    // A canvas the browser considers tainted, such as one holding an SVG
    // with foreignObject in Chrome: keep the logo as it is.
    return null;
  }
  const box = artworkBox(pixels);
  if (box === null || box === 'empty') return box;
  const x0 = Math.max(0, (box.x - 1) / scale);
  const y0 = Math.max(0, (box.y - 1) / scale);
  const x1 = Math.min(width, (box.x + box.width + 1) / scale);
  const y1 = Math.min(height, (box.y + box.height + 1) / scale);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

const svgUrl = (markup: string) => `data:image/svg+xml;base64,${toBase64(markup)}`;

/** The root's viewBox, or one made from unitless width and height. */
function viewBoxOf(root: Element): [number, number, number, number] | null {
  const parts = (root.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number);
  if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0) {
    return [parts[0], parts[1], parts[2], parts[3]];
  }
  const pixels = (value: string | null) =>
    value && /^\s*[\d.]+(px)?\s*$/.test(value) ? parseFloat(value) : Number.NaN;
  const width = pixels(root.getAttribute('width'));
  const height = pixels(root.getAttribute('height'));
  return width > 0 && height > 0 ? [0, 0, width, height] : null;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * The SVG with its viewBox tightened to what it draws, or null to keep the
 * file as it is: no measurable viewBox, no margin, or unreadable pixels.
 */
async function trimSvg(markup: string): Promise<string | null> {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.localName !== 'svg' || doc.getElementsByTagName('parsererror').length) return null;
  const box = viewBoxOf(root);
  if (!box) return null;
  const [vx, vy, vw, vh] = box;
  const original = {
    width: root.getAttribute('width'),
    height: root.getAttribute('height'),
    ratio: root.getAttribute('preserveAspectRatio'),
  };

  // Draw it at a known size in the viewBox's own proportions, so a pixel
  // maps straight to viewBox units.
  const scale = SCAN_LONG_SIDE / Math.max(vw, vh);
  const w = Math.max(1, Math.round(vw * scale));
  const h = Math.max(1, Math.round(vh * scale));
  root.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh}`);
  root.setAttribute('width', String(w));
  root.setAttribute('height', String(h));
  root.setAttribute('preserveAspectRatio', 'none');
  const serializer = new XMLSerializer();
  const drawn = measure(await decode(svgUrl(serializer.serializeToString(doc))), w, h);
  if (drawn === 'empty') {
    throw new LogoError('That SVG draws nothing as an image. Export it with its artwork embedded.');
  }
  if (!drawn) return null;

  const nx = vx + (drawn.x / w) * vw;
  const ny = vy + (drawn.y / h) * vh;
  const nw = (drawn.width / w) * vw;
  const nh = (drawn.height / h) * vh;
  root.setAttribute('viewBox', [nx, ny, nw, nh].map(round).join(' '));
  // Intrinsic size in the trimmed proportions; the page sets the real height.
  root.setAttribute('height', String(SVG_HEIGHT));
  root.setAttribute('width', String(round((nw / nh) * SVG_HEIGHT)));
  if (original.ratio === null) root.removeAttribute('preserveAspectRatio');
  else root.setAttribute('preserveAspectRatio', original.ratio);
  return serializer.serializeToString(doc);
}

async function prepareSvg(file: File): Promise<PreparedLogo> {
  const trimmed = await trimSvg(await file.text());
  // Untrimmed, the file's own bytes are stored, whatever their encoding.
  const src = trimmed === null ? await readAsDataUrl(file) : svgUrl(trimmed);
  const image = await decode(src);
  const wide = image.naturalWidth > 0 && image.naturalHeight > 0 && isWide(image.naturalWidth, image.naturalHeight);
  return { src, wide, soft: false };
}

async function prepareRaster(file: File): Promise<PreparedLogo> {
  const original = await readAsDataUrl(file);
  const image = await decode(original);
  const { naturalWidth: width, naturalHeight: height } = image;
  if (!width || !height) throw new LogoError('That image has no size. Choose another file.');

  const found = measure(image, width, height);
  if (found === 'empty') throw new LogoError('That image is blank. Choose the file with the logo on it.');
  const crop = found ?? { x: 0, y: 0, width, height };
  const trims = crop.x > 0 || crop.y > 0 || crop.width < width || crop.height < height;
  const wide = isWide(crop.width, crop.height);
  const soft = isSoft(crop.width, crop.height);
  const scale = Math.min(1, MAX_HEIGHT_PX / crop.height, MAX_WIDTH_PX / crop.width);
  if (!trims && scale === 1 && original.length <= MAX_STORED_CHARS) return { src: original, wide, soft };

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(crop.width * scale));
  canvas.height = Math.max(1, Math.round(crop.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new LogoError('This browser could not resize the image.');
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);

  // PNG keeps transparency; a JPEG has none to keep and stays smaller as JPEG.
  const src = canvas.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.92);
  if (src.length > MAX_STORED_CHARS) {
    throw new LogoError('That image is too detailed to store. Try a PNG or SVG of the logo alone.');
  }
  return { src, wide, soft };
}

/** The logo, trimmed to its artwork and sized for the letterhead. */
export async function prepareLogo(file: File): Promise<PreparedLogo> {
  const isSvg = file.type === 'image/svg+xml';
  if (!isSvg && !RASTER_TYPES.includes(file.type)) {
    throw new LogoError('Choose a PNG, JPG, SVG or WebP image.');
  }
  if (isSvg && file.size > MAX_SVG_BYTES) {
    throw new LogoError('That SVG is too large. Choose one under 512 KB.');
  }
  if (!isSvg && file.size > MAX_RASTER_BYTES) {
    throw new LogoError('That image is too large. Choose one under 5 MB.');
  }
  return isSvg ? prepareSvg(file) : prepareRaster(file);
}
