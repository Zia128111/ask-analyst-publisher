import type { Metadata } from 'next';

import { SignUpView } from '../../../src/views/auth/SignUpView';

// eslint-disable-next-line react/only-export-components
export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create an Ask Analyst Publisher account for your research house.',
};

export default function Page() {
  return <SignUpView />;
}
