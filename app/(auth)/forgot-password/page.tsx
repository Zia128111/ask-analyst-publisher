import type { Metadata } from 'next';

import { ForgotPasswordView } from '../../../src/views/auth/ForgotPasswordView';

// eslint-disable-next-line react/only-export-components
export const metadata: Metadata = {
  title: 'Reset your password',
  description: 'Request a password reset link for your Ask Analyst Publisher account.',
};

export default function Page() {
  return <ForgotPasswordView />;
}
