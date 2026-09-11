import { AuthLayout } from '../../src/views/auth/AuthLayout';

/* ============================================================================
 * AUTH ROUTE GROUP
 * ============================================================================
 * Sign-in, sign-up and forgot-password share one shell: the form column and
 * the brand panel. Putting it in a route-group layout means the panel is
 * rendered once and persists across navigation between the three pages, so
 * switching from sign-in to sign-up swaps only the form.
 * ========================================================================= */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
