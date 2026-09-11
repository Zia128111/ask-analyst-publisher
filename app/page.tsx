import { redirect } from 'next/navigation';

/* The module has no landing page of its own yet: the root sends a visitor to
   sign-in. Once the Publisher desk exists, this becomes a session check that
   sends a signed-in user there instead. */
export default function Page() {
  redirect('/sign-in');
}
