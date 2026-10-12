import { NextResponse } from 'next/server';

import { requireSuperAdmin } from '@/lib/authz';
import { getActivity } from '@/lib/db/activity';

// GET ?before=<cursor>&kinds=tips,reports: the super admin's activity feed,
// newest first, a page at a time (/admin/super/activity,
// docs/SUPER-ADMIN-HUB.md stage D). Unknown kinds are ignored; none means
// every kind. → { success, data: { rows, next } }
export async function GET(request) {
  const { denied } = await requireSuperAdmin();
  if (denied) return denied;

  const params = request.nextUrl.searchParams;
  const before = params.get('before');
  const kinds = (params.get('kinds') ?? '')
    .split(',')
    .map((kind) => kind.trim())
    .filter(Boolean);

  try {
    return NextResponse.json({ success: true, data: await getActivity({ before, kinds }) });
  } catch (error) {
    console.error('Error reading the activity feed:', error);
    return NextResponse.json({ error: "Couldn't load the activity." }, { status: 500 });
  }
}
