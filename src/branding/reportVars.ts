import type { CSSProperties } from 'react';
import { tokens } from '@akseer/ask-analyst-design-system/tokens';

import { readableOn, textOn } from './contrast';
import { REPORT_SIZES, fontById, type Branding } from './types';

/* ============================================================================
 * REPORT VARIABLES
 * ============================================================================
 * The report style as custom properties, set on the element that holds a
 * report's toolbar, sheet and export stage, so all three inherit them:
 *
 *   --report-columns  grid columns the sheet spans (7, 8 or 9)
 *   --report-text     the table's text size, a type-scale token
 *   --report-font     the sheet's font-family; unset keeps Lato
 *   --report-rule     the table's rules; unset keeps the brand blue
 *   --report-fill     the bands and header; unset keeps the brand tint
 *   --report-on-fill  ink or white, whichever reads on that fill
 *   --report-highlight     a report's current-period columns; unset follows
 *                          the fill
 *   --report-on-highlight  ink or white, whichever reads on that highlight
 *   --report-negative      negative figures; unset keeps the system's red
 *   --report-negative-on-highlight
 *                          a negative figure on a chosen highlight (or fill):
 *                          the negative colour while it reads there, else
 *                          the highlight's own ink or white
 *   --report-heading  a report's title (KSA's Morning Briefing); unset keeps
 *                     the system's blue for text
 *   --report-tag      the edition's tag beside the date; unset follows the
 *                     heading
 *   --report-on-tag   ink or white, whichever reads on that tag
 *   --report-plate    the light surface an uploaded logo sits on in dark mode
 *
 * The stylesheets read each one with the design-system token as its
 * fallback, so an unset property is exactly the unstyled sheet — and still
 * follows the colour scheme.
 * ========================================================================= */

const PLATE = tokens.semanticLight['bg-surface'];
const NEGATIVE = tokens.semanticLight['negative-text'];

export function reportVars(b: Branding): CSSProperties {
  const size = REPORT_SIZES[b.size];
  const font = fontById(b.font);
  const vars: Record<string, string> = {
    '--report-columns': String(size.columns),
    '--report-text': size.text,
    '--report-plate': PLATE,
  };
  if (font.stack) vars['--report-font'] = font.stack;
  if (b.rule) vars['--report-rule'] = b.rule;
  if (b.fill) {
    vars['--report-fill'] = b.fill;
    vars['--report-on-fill'] = textOn(b.fill).color;
  }
  if (b.highlight) {
    vars['--report-highlight'] = b.highlight;
    vars['--report-on-highlight'] = textOn(b.highlight).color;
  }
  if (b.negative) vars['--report-negative'] = b.negative;
  /* A chosen highlight is the same in both schemes, so the negative on it is
     judged against the LIGHT red when none is chosen — as the text on a
     chosen fill comes from the light tokens. */
  const highlight = b.highlight ?? b.fill;
  if (highlight) vars['--report-negative-on-highlight'] = readableOn(b.negative ?? NEGATIVE, highlight);
  if (b.heading) vars['--report-heading'] = b.heading;
  /* The tag follows the heading until it is given a colour of its own, as
     the benchmark gives both one blue. */
  const tag = b.tag ?? b.heading;
  if (tag) {
    vars['--report-tag'] = tag;
    vars['--report-on-tag'] = textOn(tag).color;
  }
  return vars as CSSProperties;
}
