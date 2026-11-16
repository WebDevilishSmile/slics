import { NextResponse } from 'next/server';

import { requireArea } from '@/lib/authz';
import { setHomeBaseByAdmin } from '@/lib/db/homeBase';
import { validateHomeBaseInput } from '@/lib/homeBase';
import { toHomeBase } from '@/lib/serializers';

// PUT `{ numSlic, alphaSlic, city?, state? }`: an admin sets an account's home
// building on /admin/users/[id] (docs/MULTI-HUB.md "Home base", step 4),
// `source: 'admin'`, settling any request waiting on it. Users area;
// `admin_audit` first. → { homeBase, homeBaseRequest } (toHomeBase).
export async function PUT(request, { params }) {
  const { session, denied } = await requireArea('users');
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const { value, error } = validateHomeBaseInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const result = await setHomeBaseByAdmin(id, value, session.user);
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({
      homeBase: toHomeBase(result.user.homeBase),
      homeBaseRequest: toHomeBase(result.user.homeBaseRequest),
    });
  } catch (error) {
    console.error('API Error: users/[id]/home-base PUT:', error);
    return NextResponse.json({ error: "Couldn't save the building." }, { status: 500 });
  }
}
