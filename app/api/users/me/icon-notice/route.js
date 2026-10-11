import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/authz';
import { dismissIconNotice } from '@/lib/db/users';

// POST: the signed-in driver dismissed the "new app icon" notice on /home
// (install/NewIconNotice.jsx). Stamps `iconNoticeDismissedAt` so it stays gone
// after they remove and re-add the iPhone app. Idempotent.
export async function POST() {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  try {
    await dismissIconNotice(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error: icon-notice POST:', error);
    return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  }
}
