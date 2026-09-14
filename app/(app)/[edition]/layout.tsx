import { notFound } from 'next/navigation';

import { AppShell } from '../../../src/components/app/AppShell';
import { findEdition } from '../../../src/data/publications';

/* The Report style's typefaces. Declared here, not in the root layout, so
   the sign-in pages carry none of their @font-face rules. */
import '../../../src/branding/fonts';

/* ============================================================================
 * EDITION LAYOUT — the signed-in shell
 * ============================================================================
 * Renders once per edition and persists across its publications, so moving
 * from MTS to BOP swaps the sheet and leaves the header and the publication
 * sidebar, open groups and all, where they are. An unknown edition is a 404
 * here, before any page runs.
 * ========================================================================= */

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ edition: string }>;
}) {
  const { edition } = await params;
  if (!findEdition(edition)) notFound();

  return <AppShell edition={edition}>{children}</AppShell>;
}
