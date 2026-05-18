// app/api/cover/[position]/route.js

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import client from '@/lib/db';

export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

  // In Next.js 15, params is a Promise, so we await it
  const { position } = await params;
  const posInt = parseInt(position, 10);

  try {
    const updates = await request.json();
    const db = client.db();

    const result = await db
      .collection('cover')
      .updateOne({ position: posInt }, { $set: updates });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Updated' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
