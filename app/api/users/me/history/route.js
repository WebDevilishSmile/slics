import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getHistoryPage, parseHistoryQuery } from '@/lib/db/slicViews';

export const runtime = 'nodejs';

// GET one page of the signed-in member's lookup history. Query params are the
// History page's own (see parseHistoryQuery): q, from, to, type, notes, sort,
// cursor. Responds `{ views, nextCursor, total }`.
export async function GET(request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.user.bmcMember)
    return NextResponse.json(
      { error: 'History is available to members only.' },
      { status: 403 },
    );

  const { filters, error } = parseHistoryQuery(request.nextUrl.searchParams);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const page = await getHistoryPage(session.user.id, filters);
    return NextResponse.json(page);
  } catch (err) {
    console.error('Error fetching history page:', err);
    return NextResponse.json(
      { error: 'Could not load your history. Please try again.' },
      { status: 500 },
    );
  }
}
