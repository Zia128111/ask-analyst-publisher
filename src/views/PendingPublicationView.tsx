'use client';

/* A client component because it hands Next's Link to Mantine's Button as its
   `component`: a function cannot cross from a server component into a client
   one. Its props are plain data, so the route stays a server component. */
import Link from 'next/link';
import { Button, Paper, Title } from '@mantine/core';
import { EmptyState } from '@akseer/ask-analyst-design-system';

import type { Edition, Publication } from '../data/types';

import classes from './PublicationView.module.css';

/* ============================================================================
 * PENDING PUBLICATION
 * ============================================================================
 * Every publication in the navigation is a real link, including the ones not
 * built yet. A link that 404s reads as a broken product; one that lands on a
 * page saying what is coming, and offering the way back, reads as a product
 * being built. Take a publication out of this state by adding its view and
 * its slug to BUILT_PUBLICATIONS.
 * ========================================================================= */

export function PendingPublicationView({
  edition,
  publication,
  fallback,
}: {
  edition: Edition;
  publication: Publication;
  /** A built publication in the same edition to offer instead, if any. */
  fallback: { href: string; label: string } | null;
}) {
  return (
    <Paper className={classes.pending}>
      <Title order={1} size="h3" className={classes.pendingTitle}>
        {publication.title}
      </Title>
      <EmptyState
        title="This publication is not built yet"
        description={`The ${publication.label} page for ${edition.label} is coming in a later release.`}
        action={
          fallback ? (
            <Button component={Link} href={fallback.href}>
              Open {fallback.label} instead
            </Button>
          ) : undefined
        }
      />
    </Paper>
  );
}
