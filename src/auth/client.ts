/* ============================================================================
 * AUTH CLIENT
 * ============================================================================
 * The ONLY file that knows how the auth pages talk to a server. Today every
 * call is a fixture with realistic latency; pointing the module at the real
 * identity service is a change to the function bodies here and nowhere else.
 * No view imports a constant from this file — they call the functions and
 * render whatever comes back.
 *
 * Demo behaviour, so every state on the pages can be exercised:
 *   - sign-in with the password `wrong` fails with "Incorrect email or password"
 *   - sign-up with `taken@example.com` fails with "already exists"
 *   - everything else succeeds after ~0.9s
 * ========================================================================= */

export type SsoProvider = 'google' | 'microsoft';

export interface SignInInput {
  email: string;
  password: string;
  remember: boolean;
}

export interface SignUpInput {
  name: string;
  email: string;
  organisation: string;
  password: string;
}

export type AuthErrorCode = 'invalid_credentials' | 'email_taken' | 'unavailable';

/** A failure the page can show the user, as opposed to a bug. */
export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(message: string, code: AuthErrorCode) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

/** Where a signed-in publisher lands: the first built publication. */
export const HOME_AFTER_SIGN_IN = '/askanalyst/mts';

/** Who is signed in. A fixture until sessions exist. */
export interface Account {
  name: string;
  organisation: string;
  /** Two letters for the avatar. The avatar is 36px, above the initials floor. */
  initials: string;
}

export const CURRENT_ACCOUNT: Account = {
  name: 'Research desk',
  organisation: 'Akseer Research (Pvt) Ltd.',
  initials: 'AR',
};

export async function signOut(): Promise<{ redirectTo: string }> {
  return { redirectTo: '/sign-in' };
}

const FIXTURE_LATENCY_MS = 900;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function signIn(input: SignInInput): Promise<{ redirectTo: string }> {
  await wait(FIXTURE_LATENCY_MS);
  if (input.password === 'wrong') {
    throw new AuthError('Incorrect email or password.', 'invalid_credentials');
  }
  return { redirectTo: HOME_AFTER_SIGN_IN };
}

export async function signInWith(_provider: SsoProvider): Promise<{ redirectTo: string }> {
  await wait(FIXTURE_LATENCY_MS);
  return { redirectTo: HOME_AFTER_SIGN_IN };
}

export async function signUp(input: SignUpInput): Promise<{ email: string }> {
  await wait(FIXTURE_LATENCY_MS);
  if (input.email.trim().toLowerCase() === 'taken@example.com') {
    throw new AuthError(
      'An account with this email already exists. Sign in instead, or reset your password.',
      'email_taken',
    );
  }
  return { email: input.email.trim() };
}

export async function requestPasswordReset(email: string): Promise<{ email: string }> {
  await wait(FIXTURE_LATENCY_MS);
  return { email: email.trim() };
}

/** The message for anything that is not an AuthError: a bug or a dead network. */
export const GENERIC_FAILURE = 'Something went wrong on our side. Please try again.';

export const describeError = (error: unknown): string =>
  error instanceof AuthError ? error.message : GENERIC_FAILURE;
