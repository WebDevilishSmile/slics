import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/authz';
import { cancelHomeBaseRequest } from '@/lib/db/homeBase';

// DELETE: the signed-in driver takes back the building change they asked an
// admin for (docs/MULTI-HUB.md "Home base", step 4). Idempotent.
export async function DELETE() {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  try {
    await cancelHomeBaseRequest(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error: home-base-request DELETE:', error);
    return NextResponse.json({ error: "Couldn't cancel your request. Please try again." }, { status: 500 });
  }
}
