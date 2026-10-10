import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireSuperAdmin } from '@/lib/authz';
import { recordAdminAction } from '@/lib/db/adminAudit';
import { linkSupportToUser, normalizeEmail, setBmcMember } from '@/lib/db/bmcEvents';
import { getUserById } from '@/lib/db/users';

// POST `{ email, userId }`: attach the support from an email that matched no
// account to that account (docs/BMC-SUPPORT.md stage 2, "Link to account").
// If the email's latest membership event is a start, membership is turned on
// too. Both are written to `admin_audit` first. Super admin only.
export async function POST(request) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const email = normalizeEmail(body?.email);
  if (!email) return NextResponse.json({ error: 'Which email?' }, { status: 400 });
  if (!ObjectId.isValid(body?.userId)) {
    return NextResponse.json({ error: 'Pick an account.' }, { status: 400 });
  }

  try {
    const user = await getUserById(body.userId);
    if (!user) return NextResponse.json({ error: 'That account no longer exists.' }, { status: 404 });

    await recordAdminAction({
      actor: session.user,
      action: 'support.linked',
      targetType: 'user',
      targetId: user._id,
      targetName: user.name,
      from: null,
      to: email,
    });
    const { linked, membershipStarted } = await linkSupportToUser(email, user._id);

    let membershipGranted = false;
    if (membershipStarted && user.bmcMember !== true) {
      await recordAdminAction({
        actor: session.user,
        action: 'membership.granted',
        targetType: 'user',
        targetId: user._id,
        targetName: user.name,
        from: false,
        to: true,
      });
      await setBmcMember(user._id, true);
      membershipGranted = true;
    }

    return NextResponse.json({ success: true, data: { linked, membershipGranted } });
  } catch (error) {
    console.error('Error linking support to an account:', error);
    return NextResponse.json({ error: "Couldn't link that support." }, { status: 500 });
  }
}
