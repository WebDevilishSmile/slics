import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

import { STAFF_ROLES } from '@/constants';
import { isSuperAdmin, requireArea } from '@/lib/authz';
import { checkRateLimit } from '@/lib/rateLimit';
import { recordAdminAction } from '@/lib/db/adminAudit';
import { createPasswordReset, resetUrl } from '@/lib/db/passwordResets';
import client from '@/lib/db/client';
import { siteOrigin } from '@/lib/siteOrigin';

export const runtime = 'nodejs';

// How long an admin's link works: long enough to reach a driver mid-shift.
const LINK_TTL_MS = 24 * 60 * 60 * 1000;

// POST: makes a one-time password reset link for the account, which the admin
// texts to the driver (docs/PASSWORD-RESET.md stage 1). Answers
// `{ url, expiresAt }`. The link is in this response only: it's stored as a
// hash and never logged.
//
// Only password accounts, never the caller's own. An admin makes links for
// drivers (`role: 'user'`); only a super admin makes them for admins, and
// nobody for a super admin, so no admin can take over another's account.
// Super admins use scripts/passwordResetLink.mjs.
export async function POST(request, { params }) {
  const { session, denied } = await requireArea('users');
  if (denied) return denied;

  const { id } = await params;
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid user ID.' }, { status: 400 });
  }
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You can't make a reset link for your own account." },
      { status: 403 },
    );
  }

  const rate = await checkRateLimit({
    key: `password-reset-link:${session.user.id}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Too many reset links. Try again in ${Math.ceil(rate.retryAfterSeconds / 60)} minutes.` },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  try {
    const user = await client
      .db()
      .collection('users')
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { name: 1, role: 1, superAdmin: 1, password: 1 } },
      );
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    if (typeof user.password !== 'string') {
      return NextResponse.json(
        { error: 'This account signs in with Google, so it has no password to reset.' },
        { status: 400 },
      );
    }
    // A staff account (admin or dispatch, STAFF_ROLES) only from a super admin.
    if (user.superAdmin === true || (STAFF_ROLES.includes(user.role) && !isSuperAdmin(session))) {
      return NextResponse.json(
        { error: "You can't make a reset link for this account." },
        { status: 403 },
      );
    }

    // Audited first: if the record can't be written, no link is made.
    await recordAdminAction({
      actor: session.user,
      action: 'password.resetLinkCreated',
      targetType: 'user',
      targetId: id,
      targetName: user.name,
    });
    const { token, expiresAt } = await createPasswordReset(id, {
      via: 'admin',
      ttlMs: LINK_TTL_MS,
      actor: session.user,
    });

    return NextResponse.json({
      url: resetUrl(siteOrigin(request), token),
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error making a password reset link:', error);
    return NextResponse.json(
      { error: "Couldn't make a reset link. Please try again." },
      { status: 500 },
    );
  }
}
