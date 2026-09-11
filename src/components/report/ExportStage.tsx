'use client';

import type { CSSProperties, ReactNode, Ref } from 'react';
import { tokens } from '@akseer/ask-analyst-design-system';

import classes from './ExportStage.module.css';

/* ============================================================================
 * EXPORT STAGE
 * ============================================================================
 * An off-screen copy of the report sheet that exists only while a PNG or PDF
 * is being made. The downloads are rendered from it rather than from the
 * sheet the reader is looking at, which buys three things:
 *
 *   - ALWAYS THE LIGHT LETTERHEAD. Every semantic colour token is set to its
 *     light value on the stage, so a download made in dark mode still comes
 *     out as a white report — what a PDF printed on paper needs — and the
 *     page itself never flashes.
 *   - ALWAYS THE FULL WIDTH. The stage is the desktop measure, so on a phone,
 *     where the table scrolls inside its own region, the download still has
 *     every column.
 *   - NOTHING ON SCREEN MOVES while the image is made.
 *
 * A stage marked `fit` holds a table whose lines never wrap (Portfolio
 * Investment): if that table is wider than the sheet — the widest face at
 * the largest size — the download widens the copy to it rather than cutting
 * the last columns off (sheetDownloads, `--sheet-grow`).
 *
 * It is transparent, behind the page, aria-hidden and inert: invisible to
 * every reader, focusable by nothing, and gone the moment the file is made.
 * ========================================================================= */

/** Every semantic colour token at its light value, as custom properties. */
const LIGHT_SCHEME = Object.fromEntries(
  Object.entries(tokens.semanticLight).map(([name, value]) => [`--ask-${name}`, value]),
) as CSSProperties;

export function ExportStage({
  stageRef,
  style,
  fit = false,
  children,
}: {
  stageRef: Ref<HTMLDivElement>;
  /** Custom properties for this copy alone: a second sheet's own `--report-columns`. */
  style?: CSSProperties;
  /** Widen the copy to a table wider than the sheet, rather than cut it. */
  fit?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      ref={stageRef}
      className={classes.stage}
      style={{ ...LIGHT_SCHEME, ...style }}
      data-fit={fit || undefined}
      data-scheme="light"
      aria-hidden="true"
      inert
    >
      {children}
    </div>
  );
}
