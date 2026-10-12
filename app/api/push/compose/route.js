import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

import { PUSH_COMPOSE_BODY_MAX, PUSH_COMPOSE_TITLE_MAX } from '@/constants';
import { requireSuperAdmin } from '@/lib/authz';
import { safeCallbackUrl } from '@/lib/callbackUrl';
import { recordAdminAction } from '@/lib/db/adminAudit';
import client from '@/lib/db/client';
import { sendPush } from '@/lib/push';
import { checkRateLimit } from '@/lib/rateLimit';

// POST `{ title, body, url, to }`: a notification the super admin writes on
// /admin/super/notifications (docs/SUPER-ADMIN-HUB.md stage C). `to` is
// 'admins' (every admin with a device, whatever kinds they chose) or one
// admin's id. `url` is the page a tap opens: a path on this site only. Written
// to admin_audit before it's sent. → { success, data: { sent, failed } }

const LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000; // an hour

const clean = (value) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '');

export async function POST(request) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `push-compose:${session.user.id}`,
    limit: LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "You've sent a lot of notifications. Please try again later." },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const title = clean(body?.title);
  const text = clean(body?.body);
  if (!title || title.length > PUSH_COMPOSE_TITLE_MAX) {
    return NextResponse.json(
      { error: `Give it a title of ${PUSH_COMPOSE_TITLE_MAX} characters or fewer.` },
      { status: 400 },
    );
  }
  if (text.length > PUSH_COMPOSE_BODY_MAX) {
    return NextResponse.json(
      { error: `Keep the text to ${PUSH_COMPOSE_BODY_MAX} characters or fewer.` },
      { status: 400 },
    );
  }
  // A path on this site, or nothing (a tap opens /home).
  const rawUrl = typeof body?.url === 'string' ? body.url.trim() : '';
  const url = rawUrl ? safeCallbackUrl(rawUrl, null) : '/home';
  if (!url || url.length > 300) {
    return NextResponse.json({ error: 'The page must be a path on this site, like /home.' }, { status: 400 });
  }

  const to = body?.to;
  const users = client.db().collection('users');
  let recipients;
  let targetName;
  try {
    if (to === 'admins') {
      const admins = await users.find({ role: 'admin' }, { projection: { _id: 1 } }).toArray();
      recipients = admins.map((admin) => String(admin._id));
      targetName = 'Every admin';
    } else if (typeof to === 'string' && ObjectId.isValid(to)) {
      const admin = await users.findOne(
        { _id: new ObjectId(to), role: 'admin' },
        { projection: { name: 1 } },
      );
      if (!admin) {
        return NextResponse.json({ error: 'Send it to an admin.' }, { status: 400 });
      }
      recipients = [to];
      targetName = admin.name ?? null;
    } else {
      return NextResponse.json({ error: 'Choose who gets it.' }, { status: 400 });
    }

    const actor = { id: session.user.id, name: session.user.name ?? null };
    await recordAdminAction({
      actor,
      action: 'push.composed',
      targetType: to === 'admins' ? 'admins' : 'user',
      targetId: to === 'admins' ? null : to,
      targetName,
      to: title,
    });

    // sendPush never throws: a failure comes back as nothing sent.
    const result = await sendPush(
      recipients,
      { title, body: text, url },
      { source: 'compose', by: actor },
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error sending a written notification:', error);
    return NextResponse.json(
      { error: "Couldn't send the notification. Please try again." },
      { status: 500 },
    );
  }
}
