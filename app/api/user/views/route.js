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

    const db = client.db();

    const total = await db
      .collection('slicViews')
      .countDocuments({ userId: new ObjectId(session.user.id) });

    return NextResponse.json({ slicViews: total }, { status: 200 });
  } catch (error) {
    console.error('API Error: views GET:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
