import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { auth } from '@/auth';
import { getJobChanges, serializeJobChanges } from '@/lib/db/sheetJobs';

const GROUPS = ['driver', 'times', 'description', 'seniority'];
const PAGE = 100;

// Changes to the on-call sheet's Jobs tab, newest first (MongoDB only).
// ?before=<ISO>&beforeId=<id> (the last change shown) pages back ·
// ?job=<jobName> · ?group=driver|times|description|seniority
export async function GET(request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const beforeSeenAt = params.get('before');
  const beforeId = params.get('beforeId');
  const job = params.get('job');
  const group = params.get('group');
  if (beforeSeenAt && (Number.isNaN(Date.parse(beforeSeenAt)) || !ObjectId.isValid(beforeId))) {
    return NextResponse.json(
      { error: 'before must be an ISO date, with beforeId the last change id' },
      { status: 400 }
    );
  }
  const before = beforeSeenAt ? { seenAt: beforeSeenAt, id: beforeId } : null;
  if (group && !GROUPS.includes(group)) {
    return NextResponse.json({ error: `group must be one of ${GROUPS.join(', ')}` }, { status: 400 });
  }

  try {
    const changes = await getJobChanges({ before, job, group, limit: PAGE });
    return NextResponse.json({
      success: true,
      data: { changes: serializeJobChanges(changes), more: changes.length === PAGE },
    });
  } catch (error) {
    console.error('API Error fetching job changes:', error);
    return NextResponse.json({ error: "Couldn't load the changes." }, { status: 500 });
  }
}
