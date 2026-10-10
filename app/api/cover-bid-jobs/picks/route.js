import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { isSaturday } from '@/lib/onCallSheet';
import {
  getCoverBidPickEvents,
  getCoverBidPicks,
  serializeCoverBidPickEvents,
  serializeCoverBidPicks,
} from '@/lib/db/coverBidPicks';

// A week's saved picks and their recent changes. Reads MongoDB only; the sheet
// is read by POST /api/cover-bid-jobs/refresh.
export async function GET(request) {
  const { denied } = await requireAdmin();
  if (denied) return denied;

  const weekEnding = new URL(request.url).searchParams.get('weekEnding');
  if (!isSaturday(weekEnding)) {
    return NextResponse.json(
      { error: 'weekEnding must be a Saturday as YYYY-MM-DD' },
      { status: 400 }
    );
  }

  try {
    const [picks, events] = await Promise.all([
      getCoverBidPicks(weekEnding),
      getCoverBidPickEvents(weekEnding),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        picks: serializeCoverBidPicks(picks),
        events: serializeCoverBidPickEvents(events),
      },
    });
  } catch (error) {
    console.error('API Error fetching cover bid picks:', error);
    return NextResponse.json({ error: "Couldn't load the picks." }, { status: 500 });
  }
}
