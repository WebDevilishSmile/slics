import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// The one place that reads the session (docs/SECURITY.md #4). Routes, pages and
// server components call these instead of `auth()`, so the boundary is written
// once instead of from memory in every new file.

// A session only counts if it names a user. On a misconfigured deployment
// (no AUTH_SECRET, say) older Auth.js betas returned an error object from
// `auth()` instead of null, which made every `if (!session)` pass
// (GHSA-8fpg-xm3f-6cx3). Beta.32 fixed that; this keeps the guard from
// depending on it.
export async function getSession() {
  const session = await auth();
  return session?.user?.id ? session : null;
}

// For route handlers: `{ session }` when allowed, `{ denied }` (the response
// to return) when not.
//
//   const { session, denied } = await requireAdmin();
//   if (denied) return denied;
export async function requireUser() {
  const session = await getSession();
  if (!session) {
    return {
      denied: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { session };
}

// `session.user.role` is fresh: auth.js's jwt callback re-reads the user row on
// every request, so there's no need to look the user up again.
export async function requireAdmin() {
  const result = await requireUser();
  if (result.denied) return result;
  if (result.session.user.role !== 'admin') {
    return {
      denied: NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 },
      ),
    };
  }
  return result;
}

// A super admin is an admin with `superAdmin: true` on their user row: every
// admin check still passes for them, and only they manage admins and see
// Buy Me a Coffee support. Set by scripts/setSuperAdmin.mjs, never from the app.
export const isSuperAdmin = (session) =>
  session?.user?.role === 'admin' && session.user.superAdmin === true;

export async function requireSuperAdmin() {
  const result = await requireAdmin();
  if (result.denied) return result;
  if (!isSuperAdmin(result.session)) {
    return {
      denied: NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 },
      ),
    };
  }
  return result;
}
