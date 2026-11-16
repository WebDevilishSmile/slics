import { NextResponse } from 'next/server';

import { requireArea } from '@/lib/authz';
import { decideHomeBaseRequest } from '@/lib/db/homeBase';
import { toHomeBase } from '@/lib/serializers';

// POST `{ approve: boolean }`: an admin decides the building change a verified
// driver or staff member asked for (docs/MULTI-HUB.md "Home base", step 4).
// Approve makes it their building, decline drops it. Users area;
// `admin_audit` first. A value, not a toggle, so a double tap can't flip it.
// → { homeBase, homeBaseRequest } (toHomeBase).
export async function POST(request, { params }) {
  const { session, denied } = await requireArea('users');
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.approve !== 'boolean') {
    return NextResponse.json({ error: 'Say whether to approve or decline.' }, { status: 400 });
  }

  try {
    const result = await decideHomeBaseRequest(id, body.approve, session.user);
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({
      homeBase: toHomeBase(result.user.homeBase),
      homeBaseRequest: toHomeBase(result.user.homeBaseRequest),
    });
  } catch (error) {
    console.error('API Error: users/[id]/home-base-request POST:', error);
    return NextResponse.json({ error: "Couldn't save the decision." }, { status: 500 });
  }
}
