import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { countSlicViews } from '@/lib/db/slicViews';

export const runtime = 'nodejs';

// The driver's lifetime lookup count. The lookup page now gets it with the
// page (slic/SlicLookupPage.jsx); this stays for an app opened before that.
export async function GET() {
  try {
    const { session, denied } = await requireUser();
    if (denied) return denied;

    const total = await countSlicViews(session.user.id);

    return NextResponse.json({ slicViews: total }, { status: 200 });
  } catch (error) {
    console.error('API Error: views GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
