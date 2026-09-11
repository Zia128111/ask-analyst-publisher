import { Logo } from '@akseer/ask-analyst-design-system';

import classes from './ProductLockup.module.css';

/* ============================================================================
 * PRODUCT LOCKUP
 * ============================================================================
 * The Ask Analyst logo with the module name beside it. The logo is the brand
 * asset exactly as the design system ships it; "Publisher" is set in interface
 * type next to it rather than drawn into the mark, so the lockup follows the
 * colour scheme and the wordmark token without a second SVG.
 *
 * Not a link on the auth pages: there is no page to go back to yet, and a link
 * that reloads the page you are on is a dead end dressed as navigation.
 * ========================================================================= */

export function ProductLockup({ height = 32 }: { height?: number }) {
  return (
    <div className={classes.lockup}>
      {/* The lockup's own text carries the product name, so the SVG is
          decorative here — passing null keeps it from being announced twice. */}
      <Logo height={height} title={null} />
      <span className={classes.product}>
        <span className="sr-only">Ask Analyst </span>Publisher
      </span>
    </div>
  );
}
