import PageContainer from '@/components/layout/PageContainer';
import RedirectMessage from '@/components/layout/RedirectMessage';
import { getSession } from '@/lib/authz';

// Every page under /admin renders inside this check. It's the friendly
// redirect, not the boundary: a layout doesn't re-run on client navigation,
// so the API routes and data each check for themselves (docs/SECURITY.md #7).
export default async function AdminLayout({ children }) {
  const session = await getSession();

  if (!session) {
    return (
      <RedirectMessage
        heading='You must be logged in to access admin pages.'
        subheading='Please sign in to continue.'
        redirect='/'
      />
    );
  }

  // `role` is fresh: auth.js's jwt callback re-reads the user row on every
  // request, so there's no second lookup by email.
  if (session.user.role !== 'admin') {
    return (
      <RedirectMessage
        heading='You must be an administrator to access this content.'
        subheading='Redirecting you to the home page...'
        redirect='/home'
      />
    );
  }

  return <PageContainer>{children}</PageContainer>;
}
