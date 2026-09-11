'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Text, Title } from '@mantine/core';

import classes from './AuthForm.module.css';

/* ============================================================================
 * DONE MESSAGE
 * ============================================================================
 * The "check your inbox" step that replaces a form once it has been sent.
 *
 * When the form unmounts, the button that had focus goes with it and focus
 * falls back to the document body, so a keyboard or screen-reader user is left
 * with no idea the page changed. Moving focus to the new heading fixes both:
 * it is read out, and the next Tab goes to the first link below it.
 * ========================================================================= */

export function DoneMessage({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <>
      <Title order={1} size="h2" className={classes.heading} ref={heading} tabIndex={-1}>
        {title}
      </Title>
      <div className={classes.done}>{children}</div>
      {footer && (
        <Text component="p" className={classes.switch}>
          {footer}
        </Text>
      )}
    </>
  );
}
