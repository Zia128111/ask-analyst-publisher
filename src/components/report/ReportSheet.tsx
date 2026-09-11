import type { ReactNode } from 'react';
import { formatDate } from '@akseer/ask-analyst-design-system';

import type { MastheadChoice, Publisher } from '../../data/types';
import { Masthead, type CustomLogo } from './Masthead';

import classes from './ReportSheet.module.css';

/* ============================================================================
 * REPORT SHEET
 * ============================================================================
 * The letterhead every publication is printed on, laid out as the benchmark
 * lays it out: the publisher's name on a tinted band, the session date under
 * it, the title on a second band, and the masthead logo at the inline-end,
 * exactly as tall as those three together. Then the body, then the source.
 *
 * No card around it: in the benchmark the sheet sits on the page like a
 * printed report. One component for all fifteen publications, so the
 * letterhead cannot drift between them.
 *
 * The band text sits in its own span so its line box can be trimmed to the
 * capitals and centred in the band optically — see the CSS.
 *
 * The title is the page's single <h1>. `titleId` comes in as a prop so the
 * body (a scrolling table) can name its region after it.
 *
 * The Report style (typeface, fill, rules, source) reaches the sheet as
 * custom properties inherited from the view around it — see reportVars —
 * so this component stays the same whether or not a publisher has styled it.
 *
 * A publication whose report is about one company, not a market, brings its
 * own letterhead instead of the bands (`letterhead`, e.g. CompanyLetterhead):
 * the same sheet, measure, typeface and source line, with the company's name
 * and price where the publisher's bands would be. It renders the <h1> with
 * `titleId` and the Masthead itself.
 * ========================================================================= */

interface SheetBase {
  titleId: string;
  /** Attribution for the figures, printed at the foot of the sheet. */
  source?: string;
  children: ReactNode;
}

/** The publisher's letterhead: name and title on bands, the date between. */
interface BandLetterheadProps extends SheetBase {
  masthead: MastheadChoice;
  /** The uploaded logo, when the masthead is 'custom'. */
  customLogo?: CustomLogo;
  publisher: Publisher;
  title: string;
  /** ISO date of the session the report covers. */
  asOf: string;
  letterhead?: never;
}

/** A publication's own letterhead, drawn in place of the bands. */
interface OwnLetterheadProps extends SheetBase {
  letterhead: ReactNode;
}

export type ReportSheetProps = BandLetterheadProps | OwnLetterheadProps;

/** Midnight in Karachi, so the formatter's PKT zone lands on the same day. */
const sessionDate = (iso: string) => new Date(`${iso}T00:00:00+05:00`);

const hasOwnLetterhead = (props: ReportSheetProps): props is OwnLetterheadProps =>
  props.letterhead !== undefined;

function BandLetterhead({ masthead, customLogo, publisher, title, titleId, asOf }: BandLetterheadProps) {
  return (
    <header className={classes.letterhead}>
      <div className={classes.publisher}>
        <p className={`${classes.band} ${classes.publisherName}`}>
          <span className={classes.bandText}>{publisher.name}</span>
        </p>
        <p className={classes.date}>
          <time dateTime={asOf}>{formatDate(sessionDate(asOf))}</time>
        </p>
        <h1 id={titleId} className={`${classes.band} ${classes.title}`}>
          <span className={classes.bandText}>{title}</span>
        </h1>
      </div>
      <Masthead brand={masthead} custom={customLogo} />
    </header>
  );
}

export function ReportSheet(props: ReportSheetProps) {
  const { titleId, source, children } = props;
  return (
    <article className={classes.sheet} aria-labelledby={titleId}>
      {hasOwnLetterhead(props) ? props.letterhead : <BandLetterhead {...props} />}

      {children}

      {source && <p className={classes.source}>Source: {source}</p>}
    </article>
  );
}
