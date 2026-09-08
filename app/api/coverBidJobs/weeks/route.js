import { getCoverBidJobWeeks } from '@/utils/coverBidJobsApi';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
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

    const weeks = await getCoverBidJobWeeks();

    return NextResponse.json({ success: true, data: weeks }, { status: 200 });
  } catch (error) {
    console.error('API Error fetching cover bid job weeks:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
