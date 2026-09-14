'use client';

import { useState } from 'react';

import { useBranding } from '../../branding/store';
import { customLogoAlt, customMastheadLabel } from '../../branding/types';
import { MASTHEADS, PUBLISHER } from '../../data/publications';
import type { Masthead, MastheadChoice, Publisher } from '../../data/types';
import type { CustomLogo } from './Masthead';

/* ============================================================================
 * useMasthead — the logo a report is printed under, and who publishes it
 * ============================================================================
 * Every publication view starts its masthead the same way: on the edition
 * the reader came in through, so Alpha Capital's report opens under the
 * Alpha Capital logo and KSA's under Akseer's — or, once a company logo has
 * been uploaded in the Report style, under that logo, which is the point of
 * uploading one. A choice made on the toggle holds until the logo itself
 * changes: uploading a new one shows it straight away. The figures are the
 * same report whichever logo is showing.
 *
 * It also answers the questions each view's downloads ask: who publishes the
 * report (the Report style's company name, or the publisher), who it goes
 * out under in words (a workbook cannot carry the logo), and the brand's
 * slug for file names. `branding` is the style the report shows: the
 * drawer's draft while there is one.
 * ========================================================================= */

/** The built-in logo each edition's reports open under. */
const EDITION_MASTHEADS: Readonly<Record<string, Masthead>> = {
  askanalyst: 'askanalyst',
  alphacapital: 'alphacapital',
  ksa: 'akseer',
};

/** "Acme Securities (Pvt) Ltd." -> "acme-securities-pvt-ltd", for file names. */
export const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function useMasthead(edition: string) {
  const { branding, ready } = useBranding();

  /* A choice remembers the logo it was made against, so a new upload
     overrides it without an effect to reset it. */
  const [choice, setChoice] = useState<{ masthead: MastheadChoice; logo: string | null } | null>(null);
  const automatic: MastheadChoice = branding.logo ? 'custom' : (EDITION_MASTHEADS[edition] ?? 'alphacapital');
  const masthead = choice && choice.logo === branding.logo ? choice.masthead : automatic;

  const customLogo: CustomLogo | undefined = branding.logo
    ? { src: branding.logo, alt: customLogoAlt(branding.company) }
    : undefined;
  const company = branding.company.trim();
  /* The Report style's company name publishes the report: the letterhead
     band where there is one, the Excel band, and the author of the PDF and
     the workbook. */
  const publisher: Publisher = company ? { name: company } : PUBLISHER;
  const attribution = masthead === 'custom' ? company : MASTHEADS[masthead].attribution;

  return {
    branding,
    ready,
    masthead,
    choose: (next: MastheadChoice) => setChoice({ masthead: next, logo: branding.logo }),
    customLogo,
    /** The uploaded logo's name on the toggle; undefined without one. */
    customLabel: branding.logo ? customMastheadLabel(branding.company) : undefined,
    publisher,
    attribution,
    brandSlug: masthead === 'custom' ? slug(branding.company) || 'custom' : masthead,
  };
}
