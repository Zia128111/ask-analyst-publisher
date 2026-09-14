import type { BriefingTopic } from '../../data/types';

import classes from './TopicTable.module.css';

/* ============================================================================
 * TOPIC TABLE — KSA's Morning Briefing
 * ============================================================================
 * As the benchmark lists the day's topics: two columns, Topic and Category.
 * Each topic links to its story on the publisher's site, in a new tab; its
 * category is set in bold and followed by its reading for the market,
 * "Economy | Negative", the reading in the positive or negative colour. The
 * word carries the reading; the colour only repeats it. In the feed's order.
 *
 * A table, because every row pairs a topic with its category and a reader
 * runs down either column. The bar between category and reading is drawn for
 * the eye and read as a comma; each link says that it opens a new tab.
 * ========================================================================= */

export function TopicTable({ topics, caption }: { topics: readonly BriefingTopic[]; caption: string }) {
  return (
    <table className={classes.table}>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col" className={classes.topic}>
            Topic
          </th>
          <th scope="col" className={classes.category}>
            Category
          </th>
        </tr>
      </thead>
      <tbody>
        {topics.map((topic) => (
          <tr key={topic.id}>
            <td className={classes.topic}>
              {topic.link ? (
                <a href={topic.link} target="_blank" rel="noopener noreferrer" className={classes.link}>
                  {topic.title}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                topic.title
              )}
            </td>
            <td className={classes.category}>
              <span className={classes.categoryName}>{topic.category}</span>
              <span className={classes.bar} aria-hidden="true">
                {' | '}
              </span>
              <span className="sr-only">, </span>
              <span className={classes.reading} data-tone={topic.tone}>
                {topic.sentiment}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
