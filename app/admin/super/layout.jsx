import { redirect } from 'next/navigation';

import { getSession, isSuperAdmin } from '@/lib/authz';

// Every page under /admin/super is the super admin's (lib/authz.js). The admin
// layout above has already turned away everyone who isn't an admin; this sends
// other admins back to /admin. Like that layout, it's the friendly redirect,
// not the boundary: each page and API route checks again (SECURITY.md #7).
export default async function SuperAdminLayout({ children }) {
  const session = await getSession();
  if (!isSuperAdmin(session)) redirect('/admin');
  return children;
}
