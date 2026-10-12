import dayjs from 'dayjs';
import { NextResponse } from 'next/server';

import { requireVerifiedDriver } from '@/lib/authz';
import { errorResponse } from '@/lib/httpError';
import { checkRateLimit } from '@/lib/rateLimit';
import { cleanCoverList, coverListStatus } from '@/lib/coverList';
import { getUpcomingSaturday } from '@/lib/format';
import { isSaturday, todayInNewYork } from '@/lib/onCallSheet';
import { getCoverBidJobsByWeek } from '@/lib/db/coverBidJobs';
import { getHiddenJobKeys } from '@/lib/db/coverBidJobHides';
import { getMyCoverList, saveMyCoverList } from '@/lib/db/coverPreferences';
import { COVER_LIST_MAX } from '@/constants';

// The signed-in driver's cover list for one week (docs/COVER-BIDDING.md,
// stage 2). Verified drivers only (requireVerifiedDriver), and only their own:
// the list is read and written by session.user.id, never a sent id.
//
// GET ?week=YYYY-MM-DD → { success, data: { weekEnding, entries } }, each
//   entry with its status now ('open' | 'picked' | 'gone'), so /covers can
//   re-read it when the driver comes back to the page.
// PUT { weekEnding, jobNumbers: [in order] } → the same shape. Replaces the
//   list. Only this week or a later one; jobs that aren't in the week, or are
//   hidden from drivers, are dropped. A picked job may stay: the driver's
//   list was saved from what they saw, and reading it sorts that out.

// Reordering saves on every move, so this is generous; it only stops a loop.
const SAVE_LIMIT = 300;
const SAVE_WINDOW_MS = 60 * 60 * 1000;

async function weekJobs(weekEnding) {
  const [jobs, hiddenKeys] = await Promise.all([
    getCoverBidJobsByWeek(weekEnding),
    getHiddenJobKeys(weekEnding),
  ]);
  return { jobs, hiddenKeys };
}

export async function GET(request) {
  const { session, denied } = await requireVerifiedDriver();
  if (denied) return denied;

  const weekEnding = new URL(request.url).searchParams.get('week');
  if (!isSaturday(weekEnding)) {
    return NextResponse.json({ error: 'week must be a Saturday as YYYY-MM-DD' }, { status: 400 });
  }

  try {
    const [entries, { jobs, hiddenKeys }] = await Promise.all([
      getMyCoverList(session.user.id, weekEnding),
      weekJobs(weekEnding),
    ]);
    return NextResponse.json({
      success: true,
      data: { weekEnding, entries: coverListStatus(entries, jobs, weekEnding, hiddenKeys) },
    });
  } catch (error) {
    console.error('Error reading a cover list:', error);
    return errorResponse(error, "Couldn't load your list.");
  }
}

export async function PUT(request) {
  const { session, denied } = await requireVerifiedDriver();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `cover-list:${session.user.id}`,
    limit: SAVE_LIMIT,
    windowMs: SAVE_WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many changes. Try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  try {
    const { weekEnding, jobNumbers } = (await request.json().catch(() => null)) ?? {};
    if (!isSaturday(weekEnding)) {
      return NextResponse.json({ error: 'weekEnding must be a Saturday as YYYY-MM-DD' }, { status: 400 });
    }
    const thisWeek = getUpcomingSaturday(dayjs(todayInNewYork())).format('YYYY-MM-DD');
    if (weekEnding < thisWeek) {
      return NextResponse.json({ error: 'That week is over, so its list can’t change.' }, { status: 400 });
    }
    if (!Array.isArray(jobNumbers) || jobNumbers.length > COVER_LIST_MAX * 2) {
      return NextResponse.json({ error: 'jobNumbers must be a list of job numbers.' }, { status: 400 });
    }
    if (jobNumbers.some((number) => typeof number !== 'string' || number.length > 40)) {
      return NextResponse.json({ error: 'Each job number must be text, 40 characters at most.' }, { status: 400 });
    }

    const { jobs, hiddenKeys } = await weekJobs(weekEnding);
    if (jobs.length === 0) {
      return NextResponse.json({ error: 'That week’s jobs aren’t posted yet.' }, { status: 404 });
    }

    // Keep only jobs the driver can see this week.
    const entries = coverListStatus(cleanCoverList(jobNumbers), jobs, weekEnding, hiddenKeys)
      .filter((entry) => entry.status !== 'gone')
      .map(({ jobKey, jobNumber }) => ({ jobKey, jobNumber }));

    const saved = await saveMyCoverList(session.user.id, weekEnding, entries);
    return NextResponse.json({
      success: true,
      data: { weekEnding, entries: coverListStatus(saved, jobs, weekEnding, hiddenKeys) },
    });
  } catch (error) {
    console.error('Error saving a cover list:', error);
    return errorResponse(error, "Couldn't save your list.");
  }
}
