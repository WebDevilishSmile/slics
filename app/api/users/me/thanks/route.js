import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

import { requireUser } from '@/lib/authz';
import { markSupportThanked } from '@/lib/db/bmcEvents';

// POST: the signed-in driver dismissed the thank-you notice on /home
// (docs/BMC-SUPPORT.md stage 3). Stamps `thankedAt` on their waiting support
// events. Idempotent: a second call finds nothing to stamp.
export async function POST() {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  try {
    const thanked = await markSupportThanked(new ObjectId(session.user.id));
    return NextResponse.json({ thanked });
  } catch (error) {
    console.error('API Error: thanks POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
