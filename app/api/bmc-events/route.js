import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/authz';
import { getRecentSupport } from '@/lib/db/bmcEvents';

// GET ?before=<event id>: the next page of the Supporters page's Recent list
// ("Load more"). `{ success, data: { events, hasMore } }`. Emails, amounts
// and messages, so super admin only.
export async function GET(request) {
  const { denied } = await requireSuperAdmin();
  if (denied) return denied;

  const before = new URL(request.url).searchParams.get('before');
  if (!before) return NextResponse.json({ error: 'before is required' }, { status: 400 });

  try {
    return NextResponse.json({ success: true, data: await getRecentSupport({ before }) });
  } catch (error) {
    console.error('Error loading more support events:', error);
    return NextResponse.json({ error: "Couldn't load more." }, { status: 500 });
  }
}
