import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/authz';
import { deleteUserAccount, getUserById } from '@/lib/db/users';
import {
  markAdminActionFailed,
  recordAdminAction,
  recordAdminActionResult,
} from '@/lib/db/adminAudit';
import { normalizeEmail } from '@/lib/db/bmcEvents';
import { displayName } from '@/lib/names';

export const runtime = 'nodejs';

const REASON_MAX = 200;

// The super admin deletes another person's account (docs/ADMIN-USER-DELETION.md).
// Same cascade as the profile's "Delete account" (deleteUserAccount), so the two
// can't drift. Never your own account (that's the profile), never a super admin,
// and drivers only: staff are changed to Driver first, on the role menu, so both
// steps are in `admin_audit`. Body: { confirmEmail, reason? }. The email typed
// must match the account's, read fresh here, not what the page sent.
//
// The deleted person's sessions end on their next request: auth.js's jwt
// callback returns null when the user row is gone (CLAUDE.md, Auth).
export async function POST(req, { params }) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }
  if (id === session.user.id) {
    return NextResponse.json(
      { error: 'Delete your own account from your profile' },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);

  let target;
  try {
    target = await getUserById(id);
  } catch {
    target = null;
  }
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (target.superAdmin === true) {
    return NextResponse.json(
      { error: "A super admin's account can't be deleted here" },
      { status: 403 },
    );
  }
  if ((target.role || 'user') !== 'user') {
    return NextResponse.json(
      { error: 'Change their role to Driver first' },
      { status: 409 },
    );
  }

  const typed = normalizeEmail(body?.confirmEmail);
  const actual = normalizeEmail(target.email);
  if (!typed || !actual || typed !== actual) {
    return NextResponse.json(
      { error: "The email doesn't match this account" },
      { status: 400 },
    );
  }

  const reason =
    typeof body?.reason === 'string' && body.reason.trim()
      ? body.reason.trim().replace(/\s+/g, ' ').slice(0, REASON_MAX)
      : null;

  // Written first: if the audit row can't be saved, nothing is deleted.
  let auditId;
  try {
    auditId = await recordAdminAction({
      actor: session.user,
      action: 'user.deleted',
      targetType: 'user',
      targetId: id,
      targetName: displayName(target.name ?? ''),
      from: {
        role: 'user',
        joined: target.created_at ?? null,
        driver: target.driver?.name ?? null,
      },
      to: reason,
    });
  } catch (error) {
    console.error(`Admin delete of ${id}: audit write failed:`, error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }

  try {
    const result = await deleteUserAccount(id);
    await recordAdminActionResult(auditId, result).catch((error) =>
      console.error(`Admin delete of ${id}: saving the counts failed:`, error),
    );
    console.log(`Super admin ${session.user.id} deleted account ${id}:`, result);
    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error) {
    await markAdminActionFailed(auditId).catch(() => {});
    console.error(`Admin delete of ${id} failed:`, error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
