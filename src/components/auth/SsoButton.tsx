import { Button } from '@mantine/core';

import type { SsoProvider } from '../../auth/client';

import classes from './SsoButton.module.css';

/* ============================================================================
 * SSO BUTTON
 * ============================================================================
 * "Sign in with Google" / "Sign in with Microsoft", in the design system's
 * default button (white fill, brand border, dark label) with the provider's
 * own mark at the inline-start.
 *
 * The two buttons share one line so the page fits a single screen, which
 * leaves no room for the full sentence at half the measure. The visible label
 * is the provider's name; the accessible name is the full action, and it
 * contains the visible text, as WCAG 2.5.3 (Label in Name) requires.
 *
 * The marks are BRAND ASSETS, not interface colours, and are kept exactly as
 * the providers publish them, the same way the design system leaves the Ask
 * Analyst logo's blues alone: a third party's logo is not recoloured to match
 * the interface. They are the one place a raw hex is allowed in this app.
 * ========================================================================= */

const PROVIDER_NAME: Record<SsoProvider, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
};

/** Google's "G", from the Sign in with Google branding guidelines. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className={classes.mark} aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

/** Microsoft's four squares, from the Microsoft identity branding guidelines. */
function MicrosoftMark() {
  return (
    <svg viewBox="0 0 21 21" className={classes.mark} aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

const MARK: Record<SsoProvider, () => React.JSX.Element> = {
  google: GoogleMark,
  microsoft: MicrosoftMark,
};

export interface SsoButtonProps {
  provider: SsoProvider;
  /** "Sign in" on the sign-in page, "Sign up" on the sign-up page. */
  verb?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function SsoButton({
  provider,
  verb = 'Continue',
  loading,
  disabled,
  onClick,
}: SsoButtonProps) {
  const Mark = MARK[provider];
  const name = PROVIDER_NAME[provider];
  return (
    <Button
      type="button"
      size="md"
      fullWidth
      leftSection={<Mark />}
      aria-label={`${verb} with ${name}`}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
    >
      {name}
    </Button>
  );
}
