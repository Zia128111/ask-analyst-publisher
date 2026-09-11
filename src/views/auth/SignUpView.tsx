'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Anchor,
  Button,
  Divider,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Icons } from '@akseer/ask-analyst-design-system';

import { describeError, signInWith, signUp, type SsoProvider } from '../../auth/client';
import { validateEmail, validateNewPassword, validateRequired } from '../../auth/validation';
import { DoneMessage } from '../../components/auth/DoneMessage';
import { PasswordRequirements } from '../../components/auth/PasswordRequirements';
import { SsoButton } from '../../components/auth/SsoButton';

import classes from '../../components/auth/AuthForm.module.css';

/* ============================================================================
 * SIGN UP
 * ============================================================================
 * The same shell and rhythm as sign-in, with the fields a research house
 * needs to be set up as a publisher: who you are, how to reach you, which
 * house you publish for, and a password checked live against the rules.
 *
 * A successful submission swaps the form for a "check your inbox" step. The
 * account is not usable until the address is verified, so the page does not
 * pretend otherwise by sending the reader straight to the desk.
 * ========================================================================= */

type Pending = 'email' | SsoProvider | null;

export function SignUpView() {
  const [pending, setPending] = useState<Pending>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { name: '', email: '', organisation: '', password: '' },
    validate: {
      name: validateRequired('Enter your full name'),
      email: validateEmail,
      organisation: validateRequired('Enter the organisation you publish for'),
      password: validateNewPassword,
    },
  });

  // The form is uncontrolled, so the live checklist subscribes to the one
  // field it needs rather than re-rendering the whole form per keystroke.
  form.watch('password', ({ value }) => setPassword(value));

  const busy = pending !== null;

  const submit = form.onSubmit(async (values) => {
    setFailure(null);
    setPending('email');
    try {
      const { email } = await signUp(values);
      setSentTo(email);
    } catch (error) {
      setFailure(describeError(error));
    } finally {
      setPending(null);
    }
  });

  const continueWith = async (provider: SsoProvider) => {
    setFailure(null);
    setPending(provider);
    try {
      const { redirectTo } = await signInWith(provider);
      window.location.assign(redirectTo);
    } catch (error) {
      setFailure(describeError(error));
      setPending(null);
    }
  };

  if (sentTo) {
    return (
      <DoneMessage
        title="Check your inbox"
        footer={
          <>
            Already verified?{' '}
            <Anchor component={Link} href="/sign-in">
              Sign in
            </Anchor>
          </>
        }
      >
        <p>
          We sent a verification link to <strong>{sentTo}</strong>. Open it to activate your
          publisher account.
        </p>
        <p>
          Nothing arrived? Check your spam folder, or{' '}
          <Anchor component="button" type="button" onClick={() => setSentTo(null)}>
            use a different email
          </Anchor>
          .
        </p>
      </DoneMessage>
    );
  }

  return (
    <>
      <Title order={1} size="h2" className={classes.heading}>
        Create your account
      </Title>
      <Text component="p" className={classes.subtitle}>
        Join Ask Analyst as a research publisher.
      </Text>

      {failure && (
        <Alert
          role="alert"
          variant="error"
          title="Could not create your account"
          icon={<Icons.warning />}
          className={classes.alert}
        >
          {failure}
        </Alert>
      )}

      <form className={classes.form} onSubmit={submit} noValidate>
        {/* Two short answers share a line, so the form fits one screen. */}
        <div className={classes.fieldRow}>
          <TextInput
            label="Full name"
            autoComplete="name"
            required
            withAsterisk={false}
            key={form.key('name')}
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Organisation"
            placeholder="Research house or brokerage"
            autoComplete="organization"
            required
            withAsterisk={false}
            key={form.key('organisation')}
            {...form.getInputProps('organisation')}
          />
        </div>

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

        <div>
          <PasswordInput
            label="Password"
            autoComplete="new-password"
            required
            withAsterisk={false}
            visibilityToggleFocusable
            visibilityToggleButtonProps={{ 'aria-label': 'Show password' }}
            key={form.key('password')}
            {...form.getInputProps('password')}
          />
          <PasswordRequirements value={password} />
        </div>

        <Button
          type="submit"
          variant="filled"
          size="lg"
          fullWidth
          className={classes.submit}
          loading={pending === 'email'}
          disabled={busy && pending !== 'email'}
        >
          Create account
        </Button>

        <Text component="p" className={classes.legal}>
          By continuing you agree to our{' '}
          <Anchor inherit href="/terms">
            Terms
          </Anchor>{' '}
          and{' '}
          <Anchor inherit href="/privacy">
            Privacy Policy
          </Anchor>
          .
        </Text>
      </form>

      <Divider label="or continue with" labelPosition="center" className={classes.divider} />

      <div className={classes.sso}>
        <SsoButton
          provider="google"
          verb="Sign up"
          loading={pending === 'google'}
          disabled={busy && pending !== 'google'}
          onClick={() => continueWith('google')}
        />
        <SsoButton
          provider="microsoft"
          verb="Sign up"
          loading={pending === 'microsoft'}
          disabled={busy && pending !== 'microsoft'}
          onClick={() => continueWith('microsoft')}
        />
      </div>

      <Text component="p" className={classes.switch}>
        Already have an account?{' '}
        <Anchor component={Link} href="/sign-in">
          Sign in
        </Anchor>
      </Text>
    </>
  );
}
