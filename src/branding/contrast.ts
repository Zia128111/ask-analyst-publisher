import { tokens } from '@akseer/ask-analyst-design-system/tokens';

/* ============================================================================
 * CONTRAST
 * ============================================================================
 * A chosen fill carries text — the publisher's name, the title, the column
 * headings — so the text colour is picked for it: whichever of the design
 * system's ink and white contrasts more. Both are the LIGHT values, because a
 * chosen fill is the same in either scheme, and so is the text on it.
 *
 * Between them, ink and white clear 4.5:1 on almost any colour. A narrow band
 * of mid-tones reaches about 4.45:1 at best, which the drawer reports as
 * below AA rather than hiding.
 * ========================================================================= */

/** WCAG AA for text under 18.66px bold or 24px. */
export const AA_TEXT = 4.5;

const INK = tokens.semanticLight['text-primary'];
const WHITE = tokens.semanticLight['text-inverse'];

/**
 * 'ABC' or 'AABBCC', with or without its '#', any case, trimmed, to
 * '#aabbcc'. Anything else is null. The '#' is optional because codes are
 * often copied without it (design tools print "1485FF").
 */
export function normaliseHex(input: string): string | null {
  const v = input.trim().toLowerCase().replace(/^#/, '');
  const short = /^([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  return /^[0-9a-f]{6}$/.test(v) ? `#${v}` : null;
}

/** WCAG relative luminance of a #rrggbb colour. */
export function luminance(hex: string): number {
  const channel = (at: number) => {
    const c = parseInt(hex.slice(at, at + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG contrast ratio of two #rrggbb colours, 1 to 21. */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

export interface TextOnFill {
  /** Ink or white, as #rrggbb. */
  color: string;
  ratio: number;
  passes: boolean;
}

/** The text colour for a fill, and how well it reads there. */
export function textOn(fill: string): TextOnFill {
  const onInk = contrast(fill, INK);
  const onWhite = contrast(fill, WHITE);
  const [color, ratio] = onInk >= onWhite ? [INK, onInk] : [WHITE, onWhite];
  return { color, ratio, passes: ratio >= AA_TEXT };
}

/** WCAG AA for graphics — a chart's bars and lines. */
export const AA_GRAPHIC = 3;

/** WCAG AA for large text, 24px or 18.66px bold — a report's title. */
export const AA_LARGE = 3;

/** The white a report prints on, which every download is. */
export const PAPER = tokens.semanticLight['bg-surface'];

/**
 * A chosen text colour where it lands on a fill: kept while it reads there
 * (AA), otherwise the ink or white that fill takes — so a red negative on a
 * dark highlight does not disappear. The parentheses still carry the sign.
 */
export const readableOn = (text: string, fill: string): string =>
  contrast(text, fill) >= AA_TEXT ? text : textOn(fill).color;
