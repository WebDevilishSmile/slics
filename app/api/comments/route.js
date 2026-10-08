import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getSlicThread } from '@/lib/db/comments';
import { getSlicByNumSlic } from '@/lib/db/slics';

// GET ?slic=<numSlic> — the SLIC's tips as a thread, shaped for the signed-in
// viewer (see getSlicThread). Responds `{ comments, slicName }`.
export async function GET(request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const numSlic = request.nextUrl.searchParams.get('slic');
  if (!numSlic)
    return NextResponse.json({ error: 'Slic ID is required' }, { status: 400 });

  try {
    const comments = await getSlicThread(numSlic, session.user.id);

    let slicName = null;
    try {
      const slic = await getSlicByNumSlic(numSlic);
      slicName = slic?.name || slic?.alphaSlic || null;
    } catch {
      // Slic may not exist (e.g. deleted) — comments can still be shown.
    }

    return NextResponse.json({ comments, slicName });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Could not load comments. Please try again.' },
      { status: 500 },
    );
  }
}
