import PageContainer from '@/components/layout/PageContainer';
import RedirectMessage from '@/components/layout/RedirectMessage';
import { getSession, isStaff } from '@/lib/authz';

// Every page under /admin renders inside this check. It's the friendly
// redirect, not the boundary: a layout doesn't re-run on client navigation,
// and a page segment can be requested on its own. So every page checks its
// own area (getAreaSession) before reading anything, and every API route
// calls requireArea() (docs/SECURITY.md #7, docs/STAFF-ROLES.md). Any staff
// account gets past here: a dispatcher has only some areas, and a page
// outside them shows admin/NoAccess.jsx.
export default async function AdminLayout({ children }) {
  const session = await getSession();

  if (!session) {
    return (
      <RedirectMessage
        heading='You must be logged in to access admin pages.'
        subheading='Please sign in to continue.'
        redirect='/sign-in'
      />
    );
  }

  // `role` and `areas` are fresh: auth.js's jwt callback re-reads the user
  // row on every request, so there's no second lookup by email.
  if (!isStaff(session)) {
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
