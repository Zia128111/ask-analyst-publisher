import { figure, isoDate, list, text, webLink } from './feedValues';
import type { BriefingTopic, KsaMorningBriefing, TopicTone } from './types';

/* ============================================================================
 * KSA MORNING BRIEFING
 * ============================================================================
 * The ONLY file that knows where KSA's Morning Briefing comes from: the feed
 * the live /ksa/morning-briefing page reads, api.askanalyst.com.pk/api/ksa/
 * msg/mb — a report of its own, a list of the day's topics, not the Pakistan
 * briefing's stories and market tables. Read on the server, as that briefing
 * is, and kept for REFRESH_SECONDS before the feed is asked again. If the
 * feed cannot be read, answers in a shape this does not know, or sends no
 * topics, the page shows the copy transcribed below on 14 September 2026 and
 * says so in the server log.
 *
 * THE FEED is a list, one entry per topic:
 *
 *   title        the topic, as the page prints it, linking to `link`
 *   sector       its category: "Economy", "Real Estate Mgmt & Dev't"
 *   type         its reading for the market — "Positive", "Negative" or
 *                "Neutral" — printed after the category
 *   date         "2026-09-14", the briefing's day (the letterhead's date)
 *   position     the order
 *   link         the story on its publisher's site
 *   description  a paragraph the page does not print
 *   filename     the day's published PDF, which the live page links; not
 *                used (the page makes its own)
 *   id, classification ("News"), created_at, updated_at, deleted_at
 * ========================================================================= */

const FEED_URL = 'https://api.askanalyst.com.pk/api/ksa/msg/mb';

/** A briefing is published once a day; five minutes old is fresh enough. */
const REFRESH_SECONDS = 300;
/** Past this, the page does not wait for the feed. */
const FEED_TIMEOUT_MS = 8000;

interface FeedTopic {
  id: number;
  date: string;
  title: string;
  sector: string;
  type: string;
  link: string | null;
  position: number;
}

/* The feed as it answered on 14 September 2026, less the fields the page does
   not use (each topic's description, the PDF's file name, classification and
   timestamps). */
const FIXTURE: FeedTopic[] = [
  {
    id: 4456,
    date: '2026-09-14',
    title: 'Saudi merchandise imports down -5% to SAR 224.5 bln in 2Q2026.',
    sector: 'Economy',
    type: 'Negative',
    link: 'https://www.argaam.com/en/article/articledetail/id/1935980',
    position: 1,
  },
  {
    id: 4457,
    date: '2026-09-14',
    title: 'Saudi Arabia posts SAR 61.5 bln trade surplus in 2Q2026.',
    sector: 'Economy',
    type: 'Positive',
    link: 'https://www.argaam.com/en/article/articledetail/id/1935976',
    position: 2,
  },
  {
    id: 4458,
    date: '2026-09-14',
    title: 'Miahona received GAC approval for Shas Water acquisition.',
    sector: 'Utilities',
    type: 'Positive',
    link: 'https://www.argaam.com/en/article/articledetail/id/1935925',
    position: 3,
  },
  {
    id: 4459,
    date: '2026-09-14',
    title: 'According to the CEO of REGA, H.E. Abdullah Al-Hammad, Riyadh household rent burden fell to 15%.',
    sector: "Real Estate Mgmt & Dev't",
    type: 'Positive',
    link: 'https://www.argaam.com/en/article/articledetail/id/1936019',
    position: 4,
  },
  {
    id: 4460,
    date: '2026-09-14',
    title: 'Riyadh court accepted UCA liquidation application.',
    sector: 'Insurance',
    type: 'Negative',
    link: 'https://www.argaam.com/en/article/articledetail/id/1936041',
    position: 5,
  },
  {
    id: 4461,
    date: '2026-09-14',
    title: 'Foreign institutions net sellers of SAR 533 mln on TASI last week.',
    sector: 'Market',
    type: 'Neutral',
    link: 'https://www.argaam.com/en/article/articledetail/id/1936048',
    position: 6,
  },
];

/** The readings the page colours; any other word is printed as sent, in the text colour. */
const TONES: Readonly<Record<string, TopicTone>> = {
  positive: 'positive',
  negative: 'negative',
  neutral: 'neutral',
};

function normalise(feed: unknown): KsaMorningBriefing {
  const entries = list<FeedTopic>(feed)
    .map((t, i) => ({ t, order: figure(t.position) ?? i }))
    .sort((a, b) => a.order - b.order)
    .map(({ t }) => t);

  const topics: BriefingTopic[] = entries
    .map((t, i) => {
      const sentiment = text(t.type);
      return {
        id: figure(t.id) ?? i,
        title: text(t.title),
        category: text(t.sector),
        sentiment,
        tone: TONES[sentiment.toLowerCase()] ?? 'neutral',
        link: webLink(t.link),
      };
    })
    .filter((t) => t.title);
  if (topics.length === 0) throw new Error('the feed sent no topics');

  /* Every topic carries the day; the latest is the briefing's. */
  const days = entries.map((t) => isoDate(text(t.date))).sort();

  return { asOf: days[days.length - 1], topics };
}

export async function fetchKsaMorningBriefing(): Promise<KsaMorningBriefing> {
  try {
    const response = await fetch(FEED_URL, {
      headers: { accept: 'application/json' },
      next: { revalidate: REFRESH_SECONDS },
      signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`the feed answered ${response.status}`);
    return normalise(await response.json());
  } catch (error) {
    console.warn(
      `KSA Morning Briefing: showing the copy of 14 September 2026, because the live feed could not be read ` +
        `(${error instanceof Error ? error.message : String(error)}).`,
    );
    return normalise(FIXTURE);
  }
}
