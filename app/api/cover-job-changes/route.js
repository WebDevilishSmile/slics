import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireArea } from '@/lib/authz';
import { getCoverJobChanges, serializeCoverJobChanges } from '@/lib/db/coverJobChanges';
import { getCoverChangesSeenAt } from '@/lib/db/users';

const PAGE = 10;

// What changed on the cover weeks' tabs, every week, newest first (MongoDB
// only), for the Changes list on /admin/cover/jobs.
// ?before=<ISO>&beforeId=<id> (the last change shown) pages back.
// → { changes, more, seenAt }. `seenAt` is the admin's mark from before this
// visit (null: all new), sent with the first page only.
export async function GET(request) {
  const { session, denied } = await requireArea('covers');
  if (denied) return denied;

  const params = new URL(request.url).searchParams;
  const beforeSeenAt = params.get('before');
  const beforeId = params.get('beforeId');
  if (beforeSeenAt && (Number.isNaN(Date.parse(beforeSeenAt)) || !ObjectId.isValid(beforeId))) {
    return NextResponse.json(
      { error: 'before must be an ISO date, with beforeId the last change id' },
      { status: 400 }
    );
  }
  const before = beforeSeenAt ? { seenAt: beforeSeenAt, id: beforeId } : null;

  try {
    const [changes, seenAt] = await Promise.all([
      getCoverJobChanges({ before, limit: PAGE }),
      before ? null : getCoverChangesSeenAt(session.user.id),
    ]);
    return NextResponse.json({
      success: true,
      data: { changes: serializeCoverJobChanges(changes), more: changes.length === PAGE, seenAt },
    });
  } catch (error) {
    console.error('API Error fetching cover job changes:', error);
    return NextResponse.json({ error: "Couldn't load the changes." }, { status: 500 });
  }
}
