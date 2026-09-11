import type { MastheadChoice } from '../../data/types';
import { Masthead, type CustomLogo } from './Masthead';

import classes from './BriefingLetterhead.module.css';

/* ============================================================================
 * BRIEFING LETTERHEAD — the Morning Briefing's own header
 * ============================================================================
 * Exactly as the benchmark (the live page and its PDF) heads the briefing,
 * at the user's request: the date at the inline-start and the masthead logo
 * at the inline-end, on one line; well below them the title, "Morning
 * Briefing", in blue between two blue rules across the sheet. The blues are
 * the system's (the user: "use our blue"): the rules the brand blue every
 * table rule is, the title the system's blue for text, which reads at AA —
 * or the Report style's border colour for both, where one is chosen (the
 * view works out whether it reads as text).
 *
 * The date is written as the benchmark writes it, "11 September, 2026" —
 * the one place a sheet does not use the system's short date, because the
 * user asked for this header exactly. It goes in ReportSheet's `letterhead`
 * slot; the title is the page's <h1>.
 * ========================================================================= */

const DAY_MONTH_YEAR = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Karachi',
});

/** "2026-09-11" -> "11 September, 2026", the day in Karachi. */
function longDate(iso: string): string {
  const parts = DAY_MONTH_YEAR.formatToParts(new Date(`${iso}T00:00:00+05:00`));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('day')} ${part('month')}, ${part('year')}`;
}

export function BriefingLetterhead({
  asOf,
  title,
  titleId,
  masthead,
  customLogo,
}: {
  /** ISO date of the briefing. */
  asOf: string;
  title: string;
  titleId: string;
  masthead: MastheadChoice;
  customLogo?: CustomLogo;
}) {
  return (
    <header className={classes.letterhead}>
      <div className={classes.top}>
        <p className={classes.date}>
          <time dateTime={asOf}>{longDate(asOf)}</time>
        </p>
        <Masthead brand={masthead} custom={customLogo} />
      </div>
      <h1 id={titleId} className={classes.title}>
        <span className={classes.titleText}>{title}</span>
      </h1>
    </header>
  );
}
