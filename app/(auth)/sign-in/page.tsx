import type { Metadata } from 'next';

import { SignInView } from '../../../src/views/auth/SignInView';

// eslint-disable-next-line react/only-export-components
export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Ask Analyst Publisher to manage your research publications.',
};

export default function Page() {
  return <SignInView />;
}
