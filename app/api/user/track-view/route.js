import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { auth } from '@/auth';
import client from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { numSlic } = await req.json();

    if (!numSlic) {
      return NextResponse.json({ error: 'numSlic is required' }, { status: 400 });
    }

    const db = client.db();

    await db.collection('slicViews').insertOne({
      userId: new ObjectId(session.user.id),
      numSlic,
      viewedAt: new Date(),
    });

    const total = await db
      .collection('slicViews')
      .countDocuments({ userId: new ObjectId(session.user.id) });

    return NextResponse.json({ slicViews: total }, { status: 200 });
  } catch (error) {
    console.error('API Error: track-view POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
