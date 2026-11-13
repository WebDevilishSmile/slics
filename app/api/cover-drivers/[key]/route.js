import { NextResponse } from 'next/server';
import { requireArea } from '@/lib/authz';
import { driverNameKey } from '@/lib/driverNames';
import { isSaturday } from '@/lib/onCallSheet';
import { getCoverDriverProfile } from '@/lib/db/coverDriverProfile';

// One driver's details for the Cover Drivers page (/admin/cover/drivers):
// `[key]` is their name as the sheet writes it (or its driverNameKey), and
// `?weekEnding=` the week the page shows. Reads MongoDB only.
export async function GET(request, { params }) {
  const { denied } = await requireArea('covers');
  if (denied) return denied;

  const weekEnding = new URL(request.url).searchParams.get('weekEnding');
  if (!isSaturday(weekEnding)) {
    return NextResponse.json({ error: 'weekEnding must be a Saturday as YYYY-MM-DD' }, { status: 400 });
  }

  const { key: raw } = await params;
  let name = raw ?? '';
  try {
    name = decodeURIComponent(name);
  } catch {
    // Already decoded, with a literal %.
  }
  const key = driverNameKey(name);
  if (!key || key.length > 100) {
    return NextResponse.json({ error: 'Which driver?' }, { status: 400 });
  }

  try {
    const profile = await getCoverDriverProfile(key, weekEnding);
    if (!profile) {
      return NextResponse.json({ error: 'That driver isn’t on the sheet.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('API Error fetching a cover driver:', error);
    return NextResponse.json({ error: "Couldn't load this driver." }, { status: 500 });
  }
}
