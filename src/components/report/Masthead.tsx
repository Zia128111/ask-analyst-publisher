import { Logo } from '@akseer/ask-analyst-design-system';

import { MASTHEADS } from '../../data/publications';
import type { MastheadChoice } from '../../data/types';

import classes from './Masthead.module.css';

/* ============================================================================
 * MASTHEAD
 * ============================================================================
 * The logo at the top right of a report sheet, chosen by the toggle above it.
 * Every logo is sized to the full height of the letterhead's text block: its
 * top meets the top of the publisher band and its foot the foot of the title
 * band (see Masthead.module.css).
 *
 * ALPHA CAPITAL uses the supplied Alpha Capital + Akseer lockup, which draws
 * both SECP registrations under the marks. The registrations are outlined
 * paths, not text, so the alt text carries them.
 *
 * The supplied file is black-on-transparent and has no dark variant; on the
 * dark scheme the wordmarks and the lower half of the Alpha mark disappear.
 * public/brand/alpha-akseer-ren-dark.svg is the same file with its black and
 * navy fills set to white and the blues untouched — a stand-in until a dark
 * version is supplied. Both images are in the markup; CSS shows the one that
 * matches the scheme, and the hidden one is out of the accessibility tree.
 *
 * ASK ANALYST uses the design system's Logo, which follows the scheme itself.
 *
 * CUSTOM is the logo uploaded in the account drawer's Report style, named by
 * the company name given there. An uploaded logo has no dark variant either,
 * so on the dark scheme it sits on a light plate rather than disappearing.
 * ========================================================================= */

/* The artwork's own proportions, 880 × 269, at roughly its rendered size so
   the box is right before the stylesheet sizes it exactly. */
const ALPHA_HEIGHT = 88;
const ALPHA_WIDTH = Math.round((880 / 269) * ALPHA_HEIGHT);

export interface CustomLogo {
  /** A data: URL. */
  src: string;
  alt: string;
}

export function Masthead({ brand, custom }: { brand: MastheadChoice; custom?: CustomLogo }) {
  if (brand === 'custom' && custom) {
    return (
      <span className={classes.slot}>
        {/* A data: URL from the reader's own upload: nothing for an image
            optimiser to fetch or resize. */}
        <img src={custom.src} alt={custom.alt} className={classes.custom} />
      </span>
    );
  }

  if (brand === 'alphacapital') {
    const alt = MASTHEADS.alphacapital.attribution;
    return (
      <span className={classes.slot}>
        <img
          src="/brand/alpha-akseer-ren.svg"
          alt={alt}
          width={ALPHA_WIDTH}
          height={ALPHA_HEIGHT}
          className={classes.onLight}
        />
        <img
          src="/brand/alpha-akseer-ren-dark.svg"
          alt={alt}
          width={ALPHA_WIDTH}
          height={ALPHA_HEIGHT}
          className={classes.onDark}
        />
      </span>
    );
  }

  return (
    <span className={classes.slot}>
      <Logo height={ALPHA_HEIGHT} title={MASTHEADS.askanalyst.label} />
    </span>
  );
}
