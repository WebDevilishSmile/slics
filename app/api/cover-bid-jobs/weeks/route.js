import { getCoverBidJobWeeks } from '@/lib/db/coverBidJobs';
import { requireAdmin } from '@/lib/authz';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { denied } = await requireAdmin();
    if (denied) return denied;

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
