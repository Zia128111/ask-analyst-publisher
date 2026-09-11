import type { BriefingStory } from '../../data/types';

import classes from './NewsList.module.css';

/* ============================================================================
 * NEWS LIST — the Morning Briefing's stories
 * ============================================================================
 * As the benchmark prints them: each story's headline in bold, then its
 * summary, ending on "Click here for more", which opens the full story on
 * its publisher's site in a new tab. In the feed's order (its `position`),
 * as many as it sends.
 *
 * An ordered list of headed items, so a screen reader announces the count
 * and each headline is a heading to jump between. "Click here for more"
 * says only "more" on its own; its hidden ending names the story and that it
 * opens a new tab, so the link reads whole out of context too. A story with
 * no link prints no link.
 * ========================================================================= */

export function NewsList({ stories }: { stories: readonly BriefingStory[] }) {
  return (
    <ol className={classes.list}>
      {stories.map((story) => (
        <li key={story.id} className={classes.story}>
          <h2 className={classes.headline}>{story.title}</h2>
          <p className={classes.summary}>
            {story.summary}
            {story.link && (
              <>
                {' '}
                <a href={story.link} target="_blank" rel="noopener noreferrer" className={classes.more}>
                  Click here for more
                  <span className="sr-only">: {story.title} (opens in a new tab)</span>
                </a>
              </>
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}
