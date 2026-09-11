import {
  DIRECTION_ICON,
  DIRECTION_LABEL,
  direction,
  formatChange,
  formatDate,
  formatPercent,
  formatPrice,
} from '@akseer/ask-analyst-design-system';

import type { Company, MastheadChoice, SharePrice } from '../../data/types';
import { Masthead, type CustomLogo } from './Masthead';

import classes from './CompanyLetterhead.module.css';

/* ============================================================================
 * COMPANY LETTERHEAD
 * ============================================================================
 * The letterhead of a report about one listed company, laid out as the Latest
 * Result benchmark lays it out: the ticker, the company's name and the units
 * at the inline-start; the share price, its change and its date beside them;
 * the masthead logo at the inline-end. No tinted bands — the company, not the
 * publisher, heads this sheet. It goes in ReportSheet's `letterhead` slot.
 *
 * The ticker and the name are the page's <h1>, prefixed for assistive
 * technology with the publication ("Latest result: LUCK, Lucky Cement Ltd").
 *
 * THE CHANGE carries its direction three ways, never by colour alone: the
 * design system's arrow, its direction colour and a visually hidden word, so
 * a screen reader says "down -7.33 (-1.76%)".
 *
 * The logo box is exactly as tall as the ticker, name and units together
 * (--letterhead-block, in the CSS), so the logo spans that block as it spans
 * the bands on the MTS letterhead, under the same box rules
 * (Masthead.module.css).
 * ========================================================================= */

/** Midnight in Karachi, so the formatter's PKT zone lands on the same day. */
const sessionDate = (iso: string) => new Date(`${iso}T00:00:00+05:00`);

function PriceChange({ change, changePct }: { change: number; changePct: number | null }) {
  const dir = direction(change);
  const Icon = DIRECTION_ICON[dir];
  return (
    <span className={classes.change} data-direction={dir}>
      <Icon size="xs" />
      <span className="sr-only">{DIRECTION_LABEL[dir]} </span>
      <span data-numeric>
        {formatChange(change)}
        {changePct !== null && <> ({formatPercent(changePct, { decimals: 2, signStyle: 'minus' })})</>}
      </span>
    </span>
  );
}

export function CompanyLetterhead({
  company,
  units,
  price,
  titleId,
  label,
  masthead,
  customLogo,
}: {
  company: Company;
  /** "Amount in PKR Mn; per share in PKR". */
  units: string;
  price: SharePrice | null;
  titleId: string;
  /** The publication, read before the company by assistive technology. */
  label: string;
  masthead: MastheadChoice;
  customLogo?: CustomLogo;
}) {
  return (
    <header className={classes.letterhead}>
      <div className={classes.identity}>
        <h1 id={titleId} className={classes.heading}>
          <span className="sr-only">{label}: </span>
          <span className={classes.ticker}>{company.ticker}</span>
          <span className="sr-only">, </span>
          <span className={classes.name}>{company.name}</span>
        </h1>
        <p className={classes.units}>{units}</p>
      </div>

      {price && (
        <div className={classes.price}>
          <p className={classes.priceLabel}>Price as of</p>
          <p className={classes.priceLine}>
            <span className={classes.close}>
              PKR <span data-numeric>{formatPrice(price.close)}</span>
            </span>
            {price.change !== null && <PriceChange change={price.change} changePct={price.changePct} />}
          </p>
          <p className={classes.date}>
            <time dateTime={price.asOf}>{formatDate(sessionDate(price.asOf))}</time>
          </p>
        </div>
      )}

      <Masthead brand={masthead} custom={customLogo} />
    </header>
  );
}
