import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { auth } from '@/auth';
import client from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.bmcMember) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const db = client.db();

    const views = await db
      .collection('slicViews')
      .find({
        userId: new ObjectId(session.user.id),
        viewedAt: { $gte: sixMonthsAgo },
      })
      .sort({ viewedAt: -1 })
      .toArray();

    return NextResponse.json({ views }, { status: 200 });
  } catch (error) {
    console.error('API Error: view-history GET:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
