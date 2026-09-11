'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Divider,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Icons } from '@akseer/ask-analyst-design-system';

import { describeError, signIn, signInWith, type SsoProvider } from '../../auth/client';
import { validateEmail, validateRequired } from '../../auth/validation';
import { SsoButton } from '../../components/auth/SsoButton';

import classes from '../../components/auth/AuthForm.module.css';

/* ============================================================================
 * SIGN IN
 * ============================================================================
 * The benchmark's order, kept: heading, email and password, remember-me beside
 * the forgot link, the primary action, then the SSO options under an "or"
 * rule, then the switch to sign-up.
 *
 * Departures, each a design-system rule rather than taste:
 *   - every field has a visible label (placeholder-as-label is forbidden)
 *   - links are underlined; colour alone does not mark a link
 *   - "Keep me signed in" is OFF by default, so a shared machine is not
 *     remembered by accident
 *   - no wave emoji in the greeting (icons rule 1)
 * ========================================================================= */

/** Which action is in flight. Only one runs at a time; the others disable. */
type Pending = 'email' | SsoProvider | null;

export function SignInView() {
  const router = useRouter();
  const [pending, setPending] = useState<Pending>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { email: '', password: '', remember: false },
    validate: {
      email: validateEmail,
      // Sign-in checks presence only. Enforcing the sign-up rules here would
      // lock out anyone whose password predates them.
      password: validateRequired('Enter your password'),
    },
  });

  const busy = pending !== null;

  const submit = form.onSubmit(async (values) => {
    setFailure(null);
    setPending('email');
    try {
      const { redirectTo } = await signIn(values);
      router.push(redirectTo);
    } catch (error) {
      setFailure(describeError(error));
      setPending(null);
    }
  });

  const continueWith = async (provider: SsoProvider) => {
    setFailure(null);
    setPending(provider);
    try {
      const { redirectTo } = await signInWith(provider);
      router.push(redirectTo);
    } catch (error) {
      setFailure(describeError(error));
      setPending(null);
    }
  };

  return (
    <>
      <Title order={1} size="h2" className={classes.heading}>
        Welcome back
      </Title>
      <Text component="p" className={classes.subtitle}>
        Sign in to manage your publications.
      </Text>

      {failure && (
        /* role="alert" so the failure is announced the moment it appears.
           The title carries the meaning; the icon and tone reinforce it. */
        <Alert
          role="alert"
          variant="error"
          title="Could not sign you in"
          icon={<Icons.warning />}
          className={classes.alert}
        >
          {failure}
        </Alert>
      )}

      {/* noValidate: the browser's own bubbles would compete with the errors
          rendered beside each field. The `required` attributes still tell
          assistive tech which fields are mandatory. */}
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

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          required
          withAsterisk={false}
          /* Mantine takes the show/hide button out of the tab order by
             default. It is a real control, so it stays reachable and named;
             Mantine adds aria-pressed for the state. */
          visibilityToggleFocusable
          visibilityToggleButtonProps={{ 'aria-label': 'Show password' }}
          key={form.key('password')}
          {...form.getInputProps('password')}
        />

        <div className={classes.row}>
          <Checkbox
            label="Keep me signed in"
            key={form.key('remember')}
            {...form.getInputProps('remember', { type: 'checkbox' })}
          />
          <Anchor component={Link} href="/forgot-password" size="sm">
            Forgot password?
          </Anchor>
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
          Sign in with email
        </Button>
      </form>

      <Divider label="or continue with" labelPosition="center" className={classes.divider} />

      <div className={classes.sso}>
        <SsoButton
          provider="google"
          verb="Sign in"
          loading={pending === 'google'}
          disabled={busy && pending !== 'google'}
          onClick={() => continueWith('google')}
        />
        <SsoButton
          provider="microsoft"
          verb="Sign in"
          loading={pending === 'microsoft'}
          disabled={busy && pending !== 'microsoft'}
          onClick={() => continueWith('microsoft')}
        />
      </div>

      <Text component="p" className={classes.switch}>
        New to Ask Analyst Publisher?{' '}
        <Anchor component={Link} href="/sign-up">
          Create an account
        </Anchor>
      </Text>
    </>
  );
}
