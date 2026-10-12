import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { errorResponse } from '@/lib/httpError';
import { isSaturday } from '@/lib/onCallSheet';
import { hideCoverBidJob, showCoverBidJob } from '@/lib/db/coverBidJobHides';

// Hides a cover job from drivers (PUT) or shows it again (DELETE), by week and
// job number so the hide survives sheet refreshes (docs/COVER-JOB-HIDING.md).
// /covers leaves hidden jobs out before toDriverCoverJob.
//
// Body: { weekEnding: 'YYYY-MM-DD' (a Saturday), jobNumber }
// 400 a bad week or no job number.

async function readBody(request) {
  const { weekEnding, jobNumber } = (await request.json()) ?? {};
  if (!isSaturday(weekEnding)) {
    return { error: 'weekEnding must be a Saturday as YYYY-MM-DD' };
  }
  if (typeof jobNumber !== 'string') {
    return { error: 'jobNumber is required' };
  }
  return { weekEnding, jobNumber };
}

export async function PUT(request) {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const { error, weekEnding, jobNumber } = await readBody(request);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const hide = await hideCoverBidJob(weekEnding, jobNumber, session.user);
    return NextResponse.json({ success: true, data: hide });
  } catch (error) {
    console.error('Error hiding a cover job:', error);
    return errorResponse(error, "Couldn't hide the job.");
  }
}

export async function DELETE(request) {
  const { denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const { error, weekEnding, jobNumber } = await readBody(request);
    if (error) return NextResponse.json({ error }, { status: 400 });

    await showCoverBidJob(weekEnding, jobNumber);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error showing a cover job:', error);
    return errorResponse(error, "Couldn't show the job.");
  }
}
