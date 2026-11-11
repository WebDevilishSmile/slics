import {
  SHEET_NOTICE_MAX_WAIT_MINUTES,
  SHEET_NOTICE_QUIET_MINUTES,
  SHEET_PUSH_DIGEST,
} from '@/constants';
import { todayInNewYork } from '@/lib/onCallSheet';
import { notifyCoverJobs, notifyCoverPicks, notifyJobChanges } from '@/lib/pushEvents';
import { countPickedJobs } from '@/lib/sheetChangeWords';
import { countPickEventDriversSince, getPickEventWindow } from '@/lib/db/coverBidPicks';
import { getCoverJobChangeWindow, getCoverPickRowsSince } from '@/lib/db/coverJobChanges';
import { claimNotice, getNotices, moveNotice } from '@/lib/db/coverNotices';
import { getJobChangeWindow } from '@/lib/db/sheetJobs';

// The admins' on-call sheet notifications as digests (since 2026-11-11,
// docs/PUSH-NOTIFICATIONS.md "Sheet digests").
//
// Until then every sheet read that changed something sent one, and a read
// follows every cell dispatch edits: 538 "Cover jobs", 299 "Cover picks" and
// 186 "Job changes" sends in 30 days, 49 in one hour. Now each of the three
// kinds waits until its part of the sheet has been quiet for
// SHEET_NOTICE_QUIET_MINUTES, then sends one notification saying where things
// ended up (lib/sheetChangeWords.js). While the edits keep coming, one goes
// out anyway once the oldest untold change is SHEET_NOTICE_MAX_WAIT_MINUTES
// old, so a long afternoon of edits is a notification an hour, not silence.
//
// The cron runs this every fifth minute with the Covers notices
// (lib/coverNotices.js). How far each kind has been told is a marker in
// `cover-notices` (`sheet:<kind>`, `through` = the newest change told), moved
// with a compare-and-set before sending, so a doubled run sends once. A
// kind's first run only sets its marker: changes from before aren't told.
// The banners and badges on the admin pages don't wait for any of this.

const MINUTE = 60_000;

// Whether a burst of changes (`oldest`/`newest` seenAt, ISO) is ready to be
// told at `now`. Pure.
export function digestDue(
  { oldest, newest },
  now,
  { quiet = SHEET_NOTICE_QUIET_MINUTES, maxWait = SHEET_NOTICE_MAX_WAIT_MINUTES } = {},
) {
  if (!oldest || !newest) return false;
  const time = now.getTime();
  return (
    time - new Date(newest).getTime() >= quiet * MINUTE || time - new Date(oldest).getTime() >= maxWait * MINUTE
  );
}

// The wider of two windows.
function widest(a, b) {
  const pick = (values, earliest) =>
    values.filter(Boolean).sort((x, y) => (earliest ? x.localeCompare(y) : y.localeCompare(x)))[0] ?? null;
  return { oldest: pick([a.oldest, b.oldest], true), newest: pick([a.newest, b.newest], false) };
}

// Picks since `since`, week by week: how many jobs' NAME ended up different
// and how many drivers' pick-list rows changed. → [{ weekEnding, jobs,
// drivers }], oldest week first, only weeks with something to count.
async function pickCounts(since, today) {
  const [nameRows, drivers] = await Promise.all([
    getCoverPickRowsSince(since, today),
    countPickEventDriversSince(since, today),
  ]);
  const byWeek = new Map();
  for (const row of nameRows) byWeek.set(row.weekEnding, [...(byWeek.get(row.weekEnding) ?? []), row]);
  return [...new Set([...byWeek.keys(), ...drivers.keys()])]
    .sort()
    .map((weekEnding) => ({
      weekEnding,
      jobs: countPickedJobs(byWeek.get(weekEnding) ?? []),
      drivers: drivers.get(weekEnding) ?? 0,
    }))
    .filter(({ jobs, drivers: count }) => jobs > 0 || count > 0);
}

// Each kind: the window of its untold changes, and the send. `since` is the
// kind's marker, so "Job changes" and "Cover jobs" skip an admin who has
// looked since the newest change (lib/pushEvents.js).
const KINDS = [
  {
    key: 'jobChanges',
    window: (since) => getJobChangeWindow(since),
    send: (since) => notifyJobChanges({ since }),
  },
  {
    key: 'coverJobs',
    window: (since, today) => getCoverJobChangeWindow(since, today, { picks: false }),
    send: (since) => notifyCoverJobs({ since }),
  },
  {
    key: 'coverPicks',
    window: async (since, today) =>
      widest(
        await getCoverJobChangeWindow(since, today, { picks: true }),
        await getPickEventWindow(since, today),
      ),
    send: async (since, today) => notifyCoverPicks({ weeks: await pickCounts(since, today) }),
  },
];

// → { <kind>: 'baseline' | 'quiet' (nothing new) | 'waiting' (still
// changing) | 'lost' (another run sent it) | 'error' | sent count }, or
// { off: true } with SHEET_PUSH_DIGEST off. One kind failing doesn't stop
// the others.
export async function runSheetNotices(now = new Date()) {
  if (!SHEET_PUSH_DIGEST) return { off: true };
  const today = todayInNewYork(now);
  const keyOf = (kind) => `sheet:${kind.key}`;
  const markers = await getNotices(KINDS.map(keyOf));

  const results = {};
  for (const kind of KINDS) {
    try {
      const key = keyOf(kind);
      const marker = markers.get(key);
      if (!marker) {
        await claimNotice(key, { kind: 'sheetDigest', through: now.toISOString() });
        results[kind.key] = 'baseline';
        continue;
      }
      const window = await kind.window(marker.through, today);
      if (!window.newest) {
        results[kind.key] = 'quiet';
      } else if (!digestDue(window, now)) {
        results[kind.key] = 'waiting';
      } else if (!(await moveNotice(key, { through: marker.through }, { through: window.newest }))) {
        results[kind.key] = 'lost';
      } else {
        results[kind.key] = (await kind.send(marker.through, today)).sent;
      }
    } catch (error) {
      console.error(`Error in the sheet digest (${kind.key}):`, error);
      results[kind.key] = 'error';
    }
  }
  return results;
}
