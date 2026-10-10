import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { recordSlicView } from '@/lib/db/slicViews';

export const runtime = 'nodejs';

// POST `{ numSlic }` — /home reports each SLIC it shows. A repeat of the
// driver's latest lookup within 30 minutes isn't recorded again (see
// recordSlicView). Responds `{ slicViews }`, the lifetime lookup count.
export async function POST(req) {
  try {
    const { session, denied } = await requireUser();
    if (denied) return denied;

    const { numSlic } = await req.json();

    if (!numSlic) {
      return NextResponse.json({ error: 'numSlic is required' }, { status: 400 });
    }

    const { total } = await recordSlicView(session.user.id, numSlic);

    return NextResponse.json({ slicViews: total }, { status: 200 });
  } catch (error) {
    console.error('API Error: track-view POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
