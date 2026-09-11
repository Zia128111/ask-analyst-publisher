/* ============================================================================
 * FORM VALIDATION
 * ============================================================================
 * Shared by sign-in, sign-up and forgot-password so an email is judged the
 * same way on every page, and the password rules shown live under the
 * sign-up field are the same ones the submit handler enforces.
 * ========================================================================= */

/** Deliberately loose: a real check is the verification email, not a regex. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

/**
 * Kept short on purpose. Length is the rule that matters; the other two are
 * the common expectations of a corporate IT policy, which is who signs a
 * research house up. Edit here and the sign-up checklist follows.
 */
export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: '8 or more characters', test: (v) => v.length >= 8 },
  { id: 'number', label: 'A number', test: (v) => /\d/.test(v) },
  {
    id: 'case',
    label: 'Upper and lower case',
    test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v),
  },
];

export const validateEmail = (value: string): string | null =>
  EMAIL_PATTERN.test(value.trim()) ? null : 'Enter a valid email address';

export const validateNewPassword = (value: string): string | null =>
  PASSWORD_RULES.every((rule) => rule.test(value))
    ? null
    : 'Your password does not meet the requirements below';

export const validateRequired =
  (message: string) =>
  (value: string): string | null =>
    value.trim() ? null : message;
