import { NextResponse } from 'next/server';
import { requireArea } from '@/lib/authz';
import { errorResponse } from '@/lib/httpError';
import { isSaturday } from '@/lib/onCallSheet';
import { getBidDay, setBidDay, validateBidDay } from '@/lib/db/coverBidDays';

// A cover week's bid day (lib/bidDay.js, docs/COVER-BIDDING.md "Bid day"):
// the Thursday 9 days before the week ends, unless an admin moved it for a
// holiday on /admin/cover/jobs. Drivers see it beside their call-in time,
// and the call-in reminders go out on it.
//
// GET ?week=YYYY-MM-DD → { success, data: { weekEnding, bidDate, usual,
//   moved, setBy, at } }
// PUT { weekEnding, bidDate } moves it; bidDate null (or the usual Thursday)
//   moves it back. Written to admin_audit first. → the same shape.

export async function GET(request) {
  const { denied } = await requireArea('covers');
  if (denied) return denied;

  const week = new URL(request.url).searchParams.get('week');
  if (!isSaturday(week)) {
    return NextResponse.json({ error: 'week must be a Saturday as YYYY-MM-DD' }, { status: 400 });
  }

  try {
    return NextResponse.json({ success: true, data: await getBidDay(week) });
  } catch (error) {
    console.error('Error reading a cover week’s bid day:', error);
    return errorResponse(error, "Couldn't read the bid day.");
  }
}

export async function PUT(request) {
  const { session, denied } = await requireArea('covers');
  if (denied) return denied;

  try {
    const { error, weekEnding, bidDate } = validateBidDay(await request.json());
    if (error) return NextResponse.json({ error }, { status: 400 });

    const bidDay = await setBidDay({ weekEnding, bidDate }, session.user);
    return NextResponse.json({ success: true, data: bidDay });
  } catch (error) {
    console.error('Error moving a cover week’s bid day:', error);
    return errorResponse(error, "Couldn't save the bid day.");
  }
}
