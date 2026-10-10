import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireUser } from '@/lib/authz';
import client from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { session, denied } = await requireUser();
    if (denied) return denied;

    const db = client.db();

    const total = await db
      .collection('slicViews')
      .countDocuments({ userId: new ObjectId(session.user.id) });

    return NextResponse.json({ slicViews: total }, { status: 200 });
  } catch (error) {
    console.error('API Error: views GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
