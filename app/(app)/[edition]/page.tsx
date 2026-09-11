import { notFound, redirect } from 'next/navigation';

import { EDITIONS, editionHome, findEdition } from '../../../src/data/publications';

/* An edition has no page of its own: /askanalyst opens its first publication. */

// eslint-disable-next-line react/only-export-components
export const dynamicParams = false;

// eslint-disable-next-line react/only-export-components
export function generateStaticParams() {
  return EDITIONS.map((e) => ({ edition: e.slug }));
}

export default async function Page({ params }: { params: Promise<{ edition: string }> }) {
  const edition = findEdition((await params).edition);
  if (!edition) notFound();
  redirect(editionHome(edition));
}
