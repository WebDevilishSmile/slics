import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/authz';
import { recordAdminAction } from '@/lib/db/adminAudit';
import client from '@/lib/db/client';

export const runtime = 'nodejs';

// The membership toggle on /admin/users. Every change is written to
// `admin_audit` first (SECURITY.md #17), so it shows on the super admin's
// Admins page.
export async function PATCH(req, { params }) {
  try {
    const { session, denied } = await requireAdmin();
    if (denied) return denied;

    const usersCollection = client.db().collection('users');

    const { id: userId } = await params;
    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
    }
    const _id = new ObjectId(userId);

    const userToUpdate = await usersCollection.findOne({ _id }, { projection: { password: 0 } });
    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newMembership = userToUpdate.bmcMember !== true;

    await recordAdminAction({
      actor: session.user,
      action: newMembership ? 'membership.granted' : 'membership.revoked',
      targetType: 'user',
      targetId: userId,
      targetName: userToUpdate.name,
      from: userToUpdate.bmcMember === true,
      to: newMembership,
    });
    const updatedUserDocument = await usersCollection.findOneAndUpdate(
      { _id },
      { $set: { bmcMember: newMembership } },
      { returnDocument: 'after', projection: { password: 0 } },
    );

    if (!updatedUserDocument) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUserDocument, { status: 200 });
  } catch (error) {
    console.error('API Error: Uncaught error in PATCH /toggle-member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
