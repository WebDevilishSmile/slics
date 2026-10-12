import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/authz';
import { errorResponse } from '@/lib/httpError';
import { coverListDemand, coverListStatus } from '@/lib/coverList';
import { coverSpots } from '@/lib/coverDrivers';
import { driverNameKey } from '@/lib/driverNames';
import { isSaturday } from '@/lib/onCallSheet';
import { getCoverBidJobsByWeek } from '@/lib/db/coverBidJobs';
import { getHiddenJobKeys } from '@/lib/db/coverBidJobHides';
import { getCoverBidPicks } from '@/lib/db/coverBidPicks';
import { getWeekCoverLists } from '@/lib/db/coverPreferences';

// Admins: every verified driver's cover list for a week, and the demand for
// each job (docs/COVER-BIDDING.md, stage 2). Drivers only ever get their own
// list (/api/users/me/cover-preferences); this is admin-only, like the picks.
//
// GET ?week=YYYY-MM-DD → { success, data: { lists, demand } }
//   lists: [{ userId, name, driverName, updatedAt, spot, entries: [{ jobKey,
//     jobNumber, status }] }], in pick order: cover drivers by number, then
//     on call, then anyone not on the week's pick list. `spot` is the
//     driver's place (coverSpots) or null.
//   demand: [{ jobKey, jobNumber, lists, first }] for jobs still open, most
//     wanted first.

// Cover drivers by number, then on call by order, then everyone else.
function pickOrder(spot) {
  if (spot?.kind === 'cover') return spot.position ?? 50;
  if (spot?.kind === 'onCall') return 100 + (Number(spot.order) || 0);
  return 10000;
}

export async function GET(request) {
  const { denied } = await requireAdmin();
  if (denied) return denied;

  const weekEnding = new URL(request.url).searchParams.get('week');
  if (!isSaturday(weekEnding)) {
    return NextResponse.json({ error: 'week must be a Saturday as YYYY-MM-DD' }, { status: 400 });
  }

  try {
    const [lists, jobs, hiddenKeys, picks] = await Promise.all([
      getWeekCoverLists(weekEnding),
      getCoverBidJobsByWeek(weekEnding),
      getHiddenJobKeys(weekEnding),
      getCoverBidPicks(weekEnding),
    ]);

    const spots = coverSpots(picks?.rows ?? []);
    const placed = lists
      .map((list) => ({ ...list, spot: spots.get(driverNameKey(list.driverName ?? '')) ?? null }))
      .sort((a, b) => pickOrder(a.spot) - pickOrder(b.spot));

    const numbers = new Map(jobs.map((job) => [job.jobNumber?.trim().toUpperCase(), job.jobNumber?.trim()]));
    const demand = [...coverListDemand(lists, jobs, weekEnding, hiddenKeys)]
      .map(([jobKey, count]) => ({ jobKey, jobNumber: numbers.get(jobKey) ?? jobKey, ...count }))
      .sort((a, b) => b.first - a.first || b.lists - a.lists || a.jobKey.localeCompare(b.jobKey));

    return NextResponse.json({
      success: true,
      data: {
        lists: placed.map((list) => ({
          ...list,
          entries: coverListStatus(list.entries, jobs, weekEnding, hiddenKeys),
        })),
        demand,
      },
    });
  } catch (error) {
    console.error('Error reading cover lists:', error);
    return errorResponse(error, "Couldn't load the drivers' lists.");
  }
}
