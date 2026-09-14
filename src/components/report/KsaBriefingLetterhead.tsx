import type { MastheadChoice } from '../../data/types';
import { Masthead, type CustomLogo } from './Masthead';

import classes from './KsaBriefingLetterhead.module.css';

/* ============================================================================
 * KSA BRIEFING LETTERHEAD — the header of KSA's Morning Briefing
 * ============================================================================
 * As the benchmark (the live /ksa/morning-briefing page, 2026-09-14) heads
 * the briefing: the edition's tag, "KSA", in a filled pill, a faint dot and
 * the date on one line; under them the title, "Morning Briefing", large; the
 * logo at the inline-end, as tall as the two lines together. No bands and no
 * rules.
 *
 * The tag and the title take the Report style's tag and heading colours, the
 * only colours this report offers (the user's call); unset, both are the
 * system's blue for text, as the benchmark gives both one blue. The date is
 * written as the benchmark writes it, "14 September, 2026".
 *
 * It goes in ReportSheet's `letterhead` slot; the title is the page's <h1>.
 * ========================================================================= */

const DAY_MONTH_YEAR = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2026-09-14" -> "14 September, 2026": the feed's day, in whatever zone it is read. */
function longDate(iso: string): string {
  const parts = DAY_MONTH_YEAR.formatToParts(new Date(`${iso}T00:00:00Z`));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('day')} ${part('month')}, ${part('year')}`;
}

export function KsaBriefingLetterhead({
  tag,
  asOf,
  title,
  titleId,
  masthead,
  customLogo,
}: {
  /** The edition's name on the tag: "KSA". */
  tag: string;
  /** ISO date of the briefing. */
  asOf: string;
  title: string;
  titleId: string;
  masthead: MastheadChoice;
  customLogo?: CustomLogo;
}) {
  return (
    <header className={classes.letterhead}>
      <div className={classes.text}>
        <p className={classes.meta}>
          <span className={classes.tag}>{tag}</span>
          <span className={classes.dot} aria-hidden="true" />
          <time dateTime={asOf} className={classes.date}>
            {longDate(asOf)}
          </time>
        </p>
        <h1 id={titleId} className={classes.title}>
          {title}
        </h1>
      </div>
      <Masthead brand={masthead} custom={customLogo} />
    </header>
  );
}
