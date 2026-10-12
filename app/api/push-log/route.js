import { NextResponse } from 'next/server';

import { requireSuperAdmin } from '@/lib/authz';
import { getPushLog } from '@/lib/db/pushLog';

// GET ?before=<id>: the push send log, newest first, a page at a time, for
// "Load more" on /admin/super/notifications (docs/SUPER-ADMIN-HUB.md stage C).
// Super admin only. → { success, data: { rows, hasMore } }
export async function GET(request) {
  const { denied } = await requireSuperAdmin();
  if (denied) return denied;

  const before = request.nextUrl.searchParams.get('before');
  try {
    return NextResponse.json({ success: true, data: await getPushLog({ before }) });
  } catch (error) {
    console.error('Error reading the push log:', error);
    return NextResponse.json({ error: "Couldn't load the send log." }, { status: 500 });
  }
}
