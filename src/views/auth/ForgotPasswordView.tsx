'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Alert, Anchor, Button, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Icons } from '@akseer/ask-analyst-design-system';

import { describeError, requestPasswordReset } from '../../auth/client';
import { validateEmail } from '../../auth/validation';
import { DoneMessage } from '../../components/auth/DoneMessage';

import classes from '../../components/auth/AuthForm.module.css';

/* ============================================================================
 * FORGOT PASSWORD
 * ============================================================================
 * One field. The confirmation is worded "if an account exists" on purpose:
 * confirming that an address IS registered would let anyone probe the
 * publisher list one email at a time.
 * ========================================================================= */

export function ForgotPasswordView() {
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { email: '' },
    validate: { email: validateEmail },
  });

  const submit = form.onSubmit(async ({ email }) => {
    setFailure(null);
    setPending(true);
    try {
      const result = await requestPasswordReset(email);
      setSentTo(result.email);
    } catch (error) {
      setFailure(describeError(error));
    } finally {
      setPending(false);
    }
  });

  if (sentTo) {
    return (
      <DoneMessage
        title="Check your inbox"
        footer={
          <Anchor component={Link} href="/sign-in">
            Back to sign in
          </Anchor>
        }
      >
        <p>
          If an account exists for <strong>{sentTo}</strong>, a link to choose a new password is
          on its way.
        </p>
        <p>
          Nothing arrived? Check your spam folder, or{' '}
          <Anchor component="button" type="button" onClick={() => setSentTo(null)}>
            try another email
          </Anchor>
          .
        </p>
      </DoneMessage>
    );
  }

  return (
    <>
      <Title order={1} size="h2" className={classes.heading}>
        Reset your password
      </Title>
      <Text component="p" className={classes.subtitle}>
        Enter your work email and we will send a link to choose a new one.
      </Text>

      {failure && (
        <Alert
          role="alert"
          variant="error"
          title="Could not send the link"
          icon={<Icons.warning />}
          className={classes.alert}
        >
          {failure}
        </Alert>
      )}

      <form className={classes.form} onSubmit={submit} noValidate>
        <TextInput
          label="Work email"
          placeholder="name@yourfirm.com"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          withAsterisk={false}
          key={form.key('email')}
          {...form.getInputProps('email')}
        />

        <Button
          type="submit"
          variant="filled"
          size="lg"
          fullWidth
          className={classes.submit}
          loading={pending}
        >
          Send reset link
        </Button>
      </form>

      <Text component="p" className={classes.switch}>
        Remembered it?{' '}
        <Anchor component={Link} href="/sign-in">
          Back to sign in
        </Anchor>
      </Text>
    </>
  );
}
