import {
  createCoverBidJobs,
  deleteCoverBidJobsByWeek,
  getCoverBidJobsByWeek,
  serializeCoverBidJobs,
} from '@/lib/db/coverBidJobs';
import { getWeekHides } from '@/lib/db/coverBidJobHides';
import { requireArea } from '@/lib/authz';
import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/httpError';

export async function GET(request) {
  try {
    const { denied } = await requireArea('covers');
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const weekEnding = searchParams.get('weekEnding');

    if (!weekEnding) {
      return NextResponse.json(
        { error: 'weekEnding query parameter is required' },
        { status: 400 }
      );
    }

    const [jobs, hidden] = await Promise.all([
      getCoverBidJobsByWeek(weekEnding),
      getWeekHides(weekEnding),
    ]);

    // `hidden`: the week's jobs hidden from drivers, by job number
    // (docs/COVER-JOB-HIDING.md).
    return NextResponse.json(
      { success: true, data: serializeCoverBidJobs(jobs), hidden },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error fetching cover bid jobs:', error);
    return errorResponse(error, "Couldn't load the cover bid jobs.");
  }
}

export async function POST(request) {
  try {
    const { session, denied } = await requireArea('covers');
    if (denied) return denied;

    const { weekEnding, rows } = await request.json();
    const created = await createCoverBidJobs(rows, weekEnding, session.user);

    return NextResponse.json(
      {
        success: true,
        data: created,
        message: 'Cover bid jobs saved successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API Error creating cover bid jobs:', error);
    return errorResponse(error, "Couldn't save the cover bid jobs.");
  }
}

export async function DELETE(request) {
  try {
    const { denied } = await requireArea('covers');
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const weekEnding = searchParams.get('weekEnding');

    if (!weekEnding) {
      return NextResponse.json(
        { error: 'weekEnding query parameter is required' },
        { status: 400 }
      );
    }

    const result = await deleteCoverBidJobsByWeek(weekEnding);

    return NextResponse.json(
      { success: true, ...result },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error deleting cover bid jobs:', error);
    return errorResponse(error, "Couldn't delete the cover bid jobs.");
  }
}
