import {
  createCoverBidJobs,
  deleteCoverBidJobsByWeek,
  getCoverBidJobsByWeek,
  serializeCoverBidJobs,
} from '@/utils/coverBidJobsApi';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const weekEnding = searchParams.get('weekEnding');

    if (!weekEnding) {
      return NextResponse.json(
        { error: 'weekEnding query parameter is required' },
        { status: 400 }
      );
    }

    const jobs = await getCoverBidJobsByWeek(weekEnding);

    return NextResponse.json(
      { success: true, data: serializeCoverBidJobs(jobs) },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error fetching cover bid jobs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

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
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

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
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
