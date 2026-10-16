import dayjs from 'dayjs';
import { after, NextResponse } from 'next/server';

import { requireArea, requireVerifiedDriver } from '@/lib/authz';
import { offListWeeks } from '@/lib/coverDrivers';
import { getUpcomingSaturday } from '@/lib/format';
import { todayInNewYork } from '@/lib/onCallSheet';
import { notifyCoverDispute } from '@/lib/pushEvents';
import { checkRateLimit } from '@/lib/rateLimit';
import { getCoverBidPicksSince } from '@/lib/db/coverBidPicks';
import {
  createCoverDispute,
  getOpenDisputeCount,
  validateDisputeNote,
} from '@/lib/db/coverDisputes';
import { getDriverJobName } from '@/lib/db/sheetJobs';
import { getUserById } from '@/lib/db/users';

// Per driver, not per network: drivers share the building's wifi. Editing an
// open dispute counts too.
const DISPUTE_LIMIT = 5;
const DISPUTE_WINDOW_MS = 24 * 60 * 60 * 1000; // a day

// POST `{ note? }`: "This is a mistake" on /covers. A verified driver the
// posted pick list leaves off (lib/coverDrivers.js offListWeeks) tells the
// admins they should be on it, or edits the message they already sent. The
// weeks and the name their account is linked to are read here, never sent.
// Responds with the dispute as the driver sees it.
export async function POST(request) {
  const { session, denied } = await requireVerifiedDriver();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `cover-dispute:${session.user.id}`,
    limit: DISPUTE_LIMIT,
    windowMs: DISPUTE_WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "You've sent this a lot today. Please try again tomorrow." },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const { note, error } = validateDisputeNote(body?.note);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const thisWeek = getUpcomingSaturday(dayjs(todayInNewYork())).format('YYYY-MM-DD');
    const [user, pickWeeks] = await Promise.all([
      getUserById(session.user.id),
      getCoverBidPicksSince(thisWeek),
    ]);
    const weeks = offListWeeks(pickWeeks, user?.driver?.key);
    if (!user?.driver?.name || weeks.length === 0) {
      return NextResponse.json(
        { error: "You're on the posted cover list, so there's nothing to send." },
        { status: 409 },
      );
    }

    // The job they hold on the Jobs tab, for the admin; none if unreadable.
    const jobName = await getDriverJobName(user.driver.key).catch(() => null);
    const result = await createCoverDispute({
      userId: session.user.id,
      driverName: user.driver.name,
      jobName,
      weeks,
      note,
    });
    // A push to the admins who chose it, for a new dispute only (an edit of an
    // open one is already on the page). Never the name or the note.
    if (result.created) after(() => notifyCoverDispute({ except: session.user.id }));
    return NextResponse.json({ success: true, data: result.dispute });
  } catch (error) {
    console.error('Error saving a cover dispute:', error);
    return NextResponse.json(
      { error: "Couldn't send your message. Please try again." },
      { status: 500 },
    );
  }
}

// GET: how many disputes are open, for the admin menu badge
// (lib/coverDisputesStore.js): `{ success, data: { count } }`.
export async function GET() {
  const { denied } = await requireArea('driverClaims');
  if (denied) return denied;

  try {
    return NextResponse.json({ success: true, data: { count: await getOpenDisputeCount() } });
  } catch (error) {
    console.error('Error counting cover disputes:', error);
    return NextResponse.json({ error: "Couldn't load the disputes." }, { status: 500 });
  }
}
