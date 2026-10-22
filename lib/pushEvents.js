import { SLIC_REPORT_KINDS } from '@/constants';
import { defaultBidDate, formatBidDay, timeLeftWords } from '@/lib/bidDay';
import { jobKey } from '@/lib/coverBidJobRow';
import { coverListStatus } from '@/lib/coverList';
import { driverNameKey } from '@/lib/driverNames';
import { formatWeekEnding } from '@/lib/onCallSheet';
import { sendPush, sendPushToAdmins } from '@/lib/push';
import { getCoverBidJobsByWeek } from '@/lib/db/coverBidJobs';
import { getHiddenJobKeys } from '@/lib/db/coverBidJobHides';
import { getUnseenCoverJobChangeRows } from '@/lib/db/coverJobChanges';
import { getCoverListsWithJobs } from '@/lib/db/coverPreferences';
import { getUnseenJobChangeRows } from '@/lib/db/sheetJobs';
import { getThreadParticipants } from '@/lib/db/comments';
import { getPlaceThreadParticipants } from '@/lib/db/places';
import {
  getCoverChangesSeenAt,
  getCoverDriverAudience,
  getDriverPushAudience,
  getJobChangesSeenAt,
} from '@/lib/db/users';

// Every push notification the app sends on its own, one function per kind
// (PUSH_TYPES in constants.js, docs/PUSH-NOTIFICATIONS.md stages 1b and 2).
// Routes call them inside `after()`; they never throw (lib/push.js).
//
// This is the one file that writes what a lock screen shows, so check every
// payload here against the rule: a SLIC number or a week and what happened.
// Never a name, an email, an address, a phone number, or the text of a tip,
// comment, report note or supporter message. `except` is the account whose
// action set it off; they never get their own.

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const week = (weekEnding) => `W/E ${formatWeekEnding(weekEnding)}`;

// --- What changed on the on-call sheet, in words ---

// How many jobs a push names before it only counts them.
const JOBS_NAMED = 3;
const listOf = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

// A changed field as a push says it: what kind of thing changed, never the
// value (a value can be a driver's name or why they're off).
const FIELD_WORDS = {
  driver: 'driver',
  seniority: 'seniority',
  description: 'description',
  name: 'name',
  assignedDriver: 'assigned driver',
  coverReason: 'cover reason',
};
// A day's start, hours or miles ('mon.start' on the Jobs tab, 'mon' on a
// cover tab) and the week's hours: the Changes feed's "Times" group.
const isTimeField = (field) => /^(sun|mon|tue|wed|thu|fri|sat)(\.|$)/.test(field ?? '') || field === 'weekHours';

// One job's unseen change rows, newest first → 'added', 'removed', or what
// changed ("times changed", "driver and description changed").
function jobOutcome(rows) {
  if (rows[0].kind === 'removed') return 'removed';
  if (rows.some((row) => row.kind === 'added')) return 'added';
  const words = [
    ...new Set(rows.map(({ field }) => (isTimeField(field) ? 'times' : (FIELD_WORDS[field] ?? 'details')))),
  ];
  return words.length <= 2 ? `${listOf.format(words)} changed` : 'changed';
}

// Change rows (newest first) → "SH16 added, LV92 removed, and WA03 times
// changed", or "7 jobs added, 1 removed, 2 changed" past JOBS_NAMED.
// `jobOf(row)` is the row's job code: a job name on the Jobs tab, a job
// number on a cover tab. Codes only, never a driver's name.
function describeJobs(rows, jobOf) {
  const byJob = new Map();
  for (const row of rows) {
    const job = jobOf(row) || 'A job';
    byJob.set(job, [...(byJob.get(job) ?? []), row]);
  }
  const outcomes = [...byJob].map(([job, jobRows]) => ({ job, outcome: jobOutcome(jobRows) }));
  if (outcomes.length <= JOBS_NAMED) {
    return listOf.format(outcomes.map(({ job, outcome }) => `${job} ${outcome}`));
  }
  const count = (kind) => outcomes.filter(({ outcome }) => (kind === 'changed' ? outcome.endsWith('changed') : outcome === kind)).length;
  const parts = ['added', 'removed', 'changed'].map((kind) => [kind, count(kind)]).filter(([, n]) => n > 0);
  // "jobs" once, on the first count.
  return parts.map(([kind, n], index) => (index === 0 ? `${plural(n, 'job')} ${kind}` : `${n} ${kind}`)).join(', ');
}

// --- Payload builders, shared by the real sends and the samples ---

// `rows`: the admin's unseen Jobs-tab changes, newest first.
const jobChanges = (rows) => ({
  title: 'Jobs tab changed',
  body: `${describeJobs(rows, (row) => row.jobName)}.`,
  url: '/admin/jobs',
  tag: 'job-changes',
});

const slicReport = (numSlic, kind) => ({
  title: `New report on SLIC ${numSlic}`,
  // The kind ("Wrong phone number"), never the driver's note.
  body: SLIC_REPORT_KINDS.find((entry) => entry.value === kind)?.label ?? 'Something is wrong with this SLIC.',
  url: '/admin/reports',
  tag: `slic-report-${numSlic}`,
});

const tip = (numSlic, isReply) => ({
  title: `New ${isReply ? 'reply' : 'tip'} on SLIC ${numSlic}`,
  body: isReply ? 'A driver replied to a tip.' : 'A driver posted a tip.',
  url: `/home?slic=${encodeURIComponent(numSlic)}`,
  // One per SLIC, so a busy thread updates one notification.
  tag: `tip-${numSlic}`,
});

// `rows`: the admin's unseen cover-tab changes, newest first, each week said
// on its own: "W/E 10/24/2026: SH16 added and LV92 times changed." A week
// posted since they last looked is only "posted with 31 jobs", since all of
// it is new to them. One tag: each send carries everything unseen, so it
// replaces the last one.
function coverJobs(rows) {
  const weeks = new Map();
  for (const row of rows) weeks.set(row.weekEnding, [...(weeks.get(row.weekEnding) ?? []), row]);
  const lines = [...weeks]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([weekEnding, weekRows]) => {
      const posted = weekRows.find((row) => row.kind === 'posted');
      return posted
        ? { posted: true, text: `${week(weekEnding)} posted with ${plural(posted.jobs ?? 0, 'job')}.` }
        : { posted: false, text: `${week(weekEnding)}: ${describeJobs(weekRows, (row) => row.jobNumber)}.` };
    });
  return {
    title: lines.every((line) => line.posted) ? 'Cover jobs posted' : 'Cover jobs changed',
    body: lines.map((line) => line.text).join(' '),
    url: `/admin/cover/jobs?week=${rows[0].weekEnding}`,
    tag: 'cover-jobs',
  };
}

const coverPicks = (weekEnding, drivers) => ({
  title: 'Cover picks changed',
  body: `Picks changed for ${plural(drivers, 'driver')}, ${week(weekEnding)}.`,
  url: `/admin/cover/jobs?week=${weekEnding}`,
  // A live bid pings the sheet often: one notification per week, updated.
  tag: `cover-picks-${weekEnding}`,
});

const driverClaim = () => ({
  title: 'New driver claim',
  body: 'A driver asked to be verified for Covers.',
  url: '/admin/driver-claims',
  tag: 'driver-claims',
});

const coverDispute = () => ({
  title: 'Cover list dispute',
  body: "A driver says they should be on the week's cover list.",
  url: '/admin/driver-claims',
  tag: 'cover-disputes',
});

const signUp = () => ({
  title: 'New driver signed up',
  body: 'Someone made a SLICs account.',
  url: '/admin/users',
  tag: 'sign-ups',
});

const place = (isComment) => ({
  title: isComment ? 'New comment on a place' : 'New place added',
  body: isComment ? 'A driver commented on a place.' : 'A driver added a place.',
  url: '/places',
  tag: 'places',
});

const SLIC_ACTIONS = {
  created: 'added',
  updated: 'edited',
  deleted: 'deleted',
  pdf: 'PDF updated',
};

// To a driver in a tip's thread: the SLIC number and that someone replied,
// never who or what. One tag per thread, so a busy one updates one
// notification ('reply-' and an ObjectId).
const tipReply = (numSlic, threadId, isAuthor) => ({
  title: `New reply on SLIC ${numSlic}`,
  body: isAuthor ? 'Someone replied to your tip.' : 'Someone replied after you.',
  url: `/home?slic=${encodeURIComponent(numSlic)}`,
  tag: `reply-${threadId}`,
});

// To a driver in a place's thread, or who added the place. One tag per place.
const placeComment = (placeId, isReply) => ({
  title: 'New comment on Places',
  body: isReply ? 'Someone replied after you.' : 'A driver commented on a place you added.',
  url: '/places',
  tag: `place-${placeId}`,
});

// --- Covers (docs/PUSH-NOTIFICATIONS.md, stage 3) ---
// To a verified driver about their own place, call-in time and list: the
// week and job codes, never who took a job, nor anyone else's place, name or
// leave. Each links to /covers on that week.

const coversUrl = (weekEnding) => `/covers?week=${weekEnding}`;

// A driver's own place on a week's pick list (myCoverSpot,
// lib/coverDrivers.js): 'Cover 7', 'On call #23'.
export function spotWords(spot) {
  if (spot?.kind === 'onCall') return spot.order ? `On call #${spot.order}` : 'On call';
  return spot?.position ? `Cover ${spot.position}` : 'Cover';
}

// Their list's jobs just taken or removed from the week (`gone`: [{
// jobNumber, how: 'taken' | 'removed' }]) and what's left open on it, in
// their order (`left`, job numbers). One tag per week: each push says where
// the list stands now, so it replaces the last.
const GONE_WORDS = { taken: 'taken', removed: 'removed from the week' };

function coverListTaken(weekEnding, gone, left) {
  const hows = new Set(gone.map((job) => job.how));
  const how = hows.size === 1 ? gone[0].how : null;
  const goneText =
    gone.length > JOBS_NAMED
      ? `${gone.length} jobs on your list were ${how ? GONE_WORDS[how] : 'taken or removed'}`
      : how
        ? `${listOf.format(gone.map((job) => job.jobNumber))} ${gone.length === 1 ? 'was' : 'were'} ${GONE_WORDS[how]}`
        : listOf.format(gone.map((job) => `${job.jobNumber} was ${GONE_WORDS[job.how]}`));
  const nextText =
    left.length === 0
      ? 'Nothing on your list is open now.'
      : left.length === 1
        ? `Next up: ${left[0]}, the last on your list.`
        : `Next up: ${left[0]} (${left.length} left).`;
  return {
    title: !how
      ? 'Jobs on your list changed'
      : gone.length === 1
        ? `A job on your list was ${how}`
        : `Jobs on your list were ${how}`,
    body: `${week(weekEnding)}: ${goneText}. ${nextText}`,
    url: coversUrl(weekEnding),
    tag: `cover-list-${weekEnding}`,
  };
}

// Before their call-in on bid day. `minutesLeft` until it at send time;
// `list` their open jobs in order, the first few to read off on the call.
function coverReminder({ weekEnding, slot, spot, minutesLeft, list }) {
  const listText =
    list.length > 0
      ? `Your list: ${list.slice(0, JOBS_NAMED).join(', ')}${list.length > JOBS_NAMED ? '…' : ''}.`
      : 'Your list is empty. Open Covers to add jobs.';
  return {
    title: `Call in at ${slot}, in ${timeLeftWords(minutesLeft)}`,
    body: `${week(weekEnding)} · ${spotWords(spot)}. ${listText}`,
    url: coversUrl(weekEnding),
    // One per week: the 15-minute reminder replaces the 2-hour one.
    tag: `cover-reminder-${weekEnding}`,
  };
}

// Their place and call-in on a week's pick list: `change` is 'new' (the list
// names them for the first time), 'moved' (their time, place or bid day
// changed) or 'off' (it doesn't name them anymore).
function coverCallIn({ weekEnding, bidDate, slot, spot, change }) {
  const url = coversUrl(weekEnding);
  const tag = `cover-call-in-${weekEnding}`;
  if (change === 'off') {
    return {
      title: `Pick list for ${week(weekEnding)}`,
      body: "You're not on this week's pick list anymore. Open Covers to check.",
      url,
      tag,
    };
  }
  const when =
    spot?.status === 'out'
      ? 'out this week'
      : slot
        ? `call in ${formatBidDay(bidDate)} at ${slot}`
        : `bid day ${formatBidDay(bidDate)}`;
  return {
    title: change === 'new' ? `You're on the ${week(weekEnding)} pick list` : `Your call-in for ${week(weekEnding)} changed`,
    body: `${spotWords(spot)}: ${when}.`,
    url,
    tag,
  };
}

// A week's jobs as drivers see them, posted or changed: `rows` are its
// cover-job-changes already cut to what drivers may know (no picks, no
// assigned driver or cover reason, no hidden job; coverWeekRowsForDrivers in
// lib/coverNotices.js), newest first; `posted` the jobs drivers see when the
// week was just posted, or null.
function coverWeekJobs(weekEnding, rows, posted = null) {
  return posted !== null
    ? {
        title: 'Cover jobs posted',
        body: `${week(weekEnding)} posted with ${plural(posted, 'job')}.`,
        url: coversUrl(weekEnding),
        tag: `cover-week-${weekEnding}`,
      }
    : {
        title: 'Cover jobs changed',
        body: `${week(weekEnding)}: ${describeJobs(rows, (row) => row.jobNumber)}.`,
        url: coversUrl(weekEnding),
        tag: `cover-week-${weekEnding}`,
      };
}

// `byRole`: the editor's role, since Dispatch edits SLICs too
// (docs/STAFF-ROLES.md).
const slicEdit = (numSlic, action, byRole) => ({
  title: `SLIC ${numSlic} ${SLIC_ACTIONS[action] ?? 'changed'}`,
  body: byRole === 'dispatch' ? 'By dispatch.' : 'By another admin.',
  url: action === 'deleted' ? '/admin/slics' : `/home?slic=${encodeURIComponent(numSlic)}`,
  tag: `slic-${numSlic}`,
});

// Buy Me a Coffee event types as the webhook names them (docs/BMC-SUPPORT.md).
// BMC doesn't publish the list, so anything else still gets a push, named as
// BMC sent it.
const SUPPORT_TITLES = {
  'donation.created': 'New coffee',
  'donation.refunded': 'Coffee refunded',
  'membership.started': 'New membership',
  'membership.updated': 'Membership updated',
  'membership.cancelled': 'Membership cancelled',
  'membership.canceled': 'Membership cancelled',
  'recurring_donation.started': 'New monthly supporter',
  'recurring_donation.updated': 'Monthly support updated',
  'recurring_donation.cancelled': 'Monthly support cancelled',
  'recurring_donation.canceled': 'Monthly support cancelled',
};

// A renewal and a failed charge both come as `.updated` (seen 2026-10-14);
// `update` (lib/db/bmcEvents.js) says which. Rows from before have none.
const UPDATE_TITLES = {
  renewed: { membership: 'Membership renewed', recurring_donation: 'Monthly support renewed' },
  paymentFailed: { membership: 'Membership payment failed', recurring_donation: 'Monthly support payment failed' },
  paid: { membership: 'Membership renewal paid', recurring_donation: 'Monthly support renewal paid' },
};

// Also the activity feed's words for a support event (lib/db/activity.js).
export function supportTitle(type, update) {
  const byUpdate = UPDATE_TITLES[update]?.[String(type).split('.')[0]];
  if (byUpdate && String(type).endsWith('.updated')) return byUpdate;
  if (SUPPORT_TITLES[type]) return SUPPORT_TITLES[type];
  const named = String(type ?? 'unknown')
    .replace(/[^\w.\- ]/g, '')
    .slice(0, 40);
  return `Buy Me a Coffee: ${named || 'unknown'}`;
}

export function formatAmount(amount, currency) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return null;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  } catch {
    // A currency code Intl doesn't know.
    return `${amount.toFixed(2)} ${String(currency ?? '').slice(0, 3)}`.trim();
  }
}

// The kind and the amount (decided 2026-10-12); never the supporter's name,
// email or message, which stay on the Supporters page.
function support(type, amount, currency, update) {
  const money = formatAmount(amount, currency);
  return {
    title: supportTitle(type, update),
    body:
      update === 'paymentFailed'
        ? `The ${money ? `${money} ` : ''}charge didn't go through.`
        : (money ?? 'Open Supporters to see it.'),
    url: '/admin/super/supporters',
  };
}

// --- The sends ---

// Each admin is told the Jobs-tab changes they haven't seen; nobody is sent
// one with nothing new. One tag, so a burst of sheet pings updates one
// notification instead of stacking them.
export function notifyJobChanges({ except } = {}) {
  return sendPushToAdmins(
    'jobChanges',
    async (adminId) => {
      const rows = await getUnseenJobChangeRows(await getJobChangesSeenAt(adminId));
      return rows.length === 0 ? null : jobChanges(rows);
    },
    { except },
  );
}

// The same for cover weeks: what each admin hasn't seen on /admin/cover/jobs.
export function notifyCoverJobs({ except } = {}) {
  return sendPushToAdmins(
    'coverJobs',
    async (adminId) => {
      const rows = await getUnseenCoverJobChangeRows(await getCoverChangesSeenAt(adminId));
      return rows.length === 0 ? null : coverJobs(rows);
    },
    { except },
  );
}

export const notifySlicReport = ({ numSlic, kind, except }) =>
  sendPushToAdmins('slicReports', slicReport(numSlic, kind), { except });

export const notifyTip = ({ numSlic, isReply, except }) =>
  sendPushToAdmins('tips', tip(numSlic, isReply), { except });

export const notifyCoverPicks = ({ weekEnding, drivers, except }) =>
  sendPushToAdmins('coverPicks', coverPicks(weekEnding, drivers), { except });

export const notifyDriverClaim = ({ except }) =>
  sendPushToAdmins('driverClaims', driverClaim(), { except });

export const notifyCoverDispute = ({ except }) =>
  sendPushToAdmins('coverDisputes', coverDispute(), { except });

export const notifySignUp = () => sendPushToAdmins('signUps', signUp());

export const notifyPlace = ({ isComment, except }) =>
  sendPushToAdmins('places', place(isComment), { except });

// Sends a driver kind to whichever of `userIds` chose it (getDriverPushAudience:
// admins only while "Notifications for every driver" is off). → the ids it was
// sent to, for the admin kinds' `except`; [] on any failure.
async function sendToDrivers(type, userIds, payload, except) {
  try {
    const ids = await getDriverPushAudience(type, userIds.filter((id) => id !== except));
    if (ids.length === 0) return [];
    await sendPush(ids, payload, { type, source: 'event' });
    return ids;
  } catch (error) {
    console.error(`Error sending ${type} push notifications:`, error);
    return [];
  }
}

// A reply on a SLIC: everyone who wrote in the thread but the replier. The
// tip's writer is told it's their tip.
export async function notifyTipReply({ numSlic, threadId, except }) {
  try {
    const { authorId, userIds } = await getThreadParticipants(threadId);
    return await sendToDrivers(
      'tipReplies',
      userIds,
      (userId) => tipReply(numSlic, threadId, userId === authorId),
      except,
    );
  } catch (error) {
    console.error('Error sending tip reply push notifications:', error);
    return [];
  }
}

// A comment on a place: a reply goes to everyone who wrote in the thread, a
// new comment to the driver who added the place. Never to the writer.
export async function notifyPlaceComment({ placeId, threadId, isReply, placeCreatedBy, except }) {
  try {
    const userIds = isReply
      ? (await getPlaceThreadParticipants(threadId)).userIds
      : [placeCreatedBy].filter(Boolean);
    return await sendToDrivers('placeComments', userIds, placeComment(placeId, isReply), except);
  } catch (error) {
    console.error('Error sending place comment push notifications:', error);
    return [];
  }
}

// A pick on the sheet fills a job's NAME; a job can also leave the week.
// Anything else (a pick cleared, one name for another) isn't news for a list.
function listJobChange(row) {
  if (row.kind === 'removed') return 'removed';
  const filled = row.kind === 'changed' && row.field === 'name';
  return filled && !String(row.from ?? '').trim() && String(row.to ?? '').trim() ? 'taken' : null;
}

// A refresh of a cover week took or removed jobs (`changes`, its
// cover-job-changes rows): each verified driver whose list for the week
// held one is told which, and what's next on their list. The driver who took
// it isn't (the job's NAME is the sheet name their account is linked to), and
// nobody is told who did. → the ids it was sent to; [] on any failure.
export async function notifyCoverListTaken({ weekEnding, changes }) {
  try {
    const gone = (changes ?? [])
      .map((row) => ({ row, how: listJobChange(row) }))
      .filter(({ row, how }) => how && jobKey(row.jobNumber))
      .map(({ row, how }) => ({
        key: jobKey(row.jobNumber),
        jobNumber: String(row.jobNumber).trim(),
        how,
        takenBy: how === 'taken' ? driverNameKey(row.to) : null,
      }));
    if (gone.length === 0) return [];
    const lists = await getCoverListsWithJobs(weekEnding, [...new Set(gone.map((job) => job.key))]);
    if (lists.length === 0) return [];
    const audience = await getCoverDriverAudience(
      'coverListTaken',
      lists.map((list) => list.userId),
    );
    if (audience.length === 0) return [];
    const [weekJobs, hiddenKeys] = await Promise.all([
      getCoverBidJobsByWeek(weekEnding),
      getHiddenJobKeys(weekEnding),
    ]);

    const drivers = new Map(audience.map((driver) => [driver.id, driver]));
    const payloads = new Map();
    for (const list of lists) {
      const driver = drivers.get(list.userId);
      if (!driver) continue;
      const listed = new Set(list.entries.map((entry) => entry.jobKey));
      const theirs = gone.filter(
        (job) => listed.has(job.key) && !(job.takenBy && job.takenBy === driver.driverKey),
      );
      if (theirs.length === 0) continue;
      const left = coverListStatus(list.entries, weekJobs, weekEnding, hiddenKeys)
        .filter((entry) => entry.status === 'open')
        .map((entry) => entry.jobNumber);
      payloads.set(list.userId, coverListTaken(weekEnding, theirs, left));
    }
    if (payloads.size === 0) return [];
    const ids = [...payloads.keys()];
    await sendPush(ids, (userId) => payloads.get(userId) ?? null, {
      type: 'coverListTaken',
      source: 'event',
    });
    return ids;
  } catch (error) {
    console.error('Error sending cover list push notifications:', error);
    return [];
  }
}

// The Covers notifications the cron sends (lib/coverNotices.js decides who
// and when; these only word and send them). Each takes the week and, per
// driver, what to say. → { sent, failed }; they never throw (sendPush).

// `reminders`: Map of userId → { slot, spot, minutesLeft, list }.
export const sendCoverReminders = (weekEnding, reminders) =>
  sendPush(
    [...reminders.keys()],
    (userId) => (reminders.has(userId) ? coverReminder({ weekEnding, ...reminders.get(userId) }) : null),
    { type: 'coverReminder', source: 'event' },
  );

// `notices`: Map of userId → { bidDate, slot, spot, change }.
export const sendCoverCallIns = (weekEnding, notices) =>
  sendPush(
    [...notices.keys()],
    (userId) => (notices.has(userId) ? coverCallIn({ weekEnding, ...notices.get(userId) }) : null),
    { type: 'coverCallIn', source: 'event' },
  );

// The same words for every driver in `userIds`: `rows` the week's changes
// drivers may know, `posted` the jobs they see when it was just posted.
export const sendCoverWeekJobs = (weekEnding, userIds, rows, posted = null) =>
  sendPush(userIds, coverWeekJobs(weekEnding, rows, posted), { type: 'coverWeekJobs', source: 'event' });

export const notifySlicEdit = ({ numSlic, action, except, byRole }) =>
  sendPushToAdmins('slicEdits', slicEdit(numSlic, action, byRole), { except });

export const notifySupport = ({ type, update, amount, currency }) =>
  sendPushToAdmins('support', support(type, amount, currency, update));

// --- Samples: "Send me a sample" on /admin/super/notifications ---

// What each kind looks like, with made-up details, so a super admin can see it
// on their own lock screen. One tag, so samples replace each other.
const SAMPLES = {
  jobChanges: () =>
    jobChanges([
      { jobName: 'LV57', kind: 'changed', field: 'mon.start' },
      { jobName: 'BE11', kind: 'added' },
    ]),
  coverJobs: () =>
    coverJobs([
      { weekEnding: nextSaturday(), jobNumber: 'SH16', kind: 'added' },
      { weekEnding: nextSaturday(), jobNumber: 'LV92', kind: 'changed', field: 'mon' },
    ]),
  coverPicks: () => coverPicks(nextSaturday(), 2),
  slicReports: () => slicReport('1809', 'phone'),
  tipReplies: () => tipReply('1809', '000000000000000000000000', true),
  coverReminder: () =>
    coverReminder({
      weekEnding: nextSaturday(),
      slot: '9:15',
      spot: { kind: 'cover', position: 7 },
      minutesLeft: 15,
      list: ['LV92', 'SH16', 'WA03'],
    }),
  coverListTaken: () =>
    coverListTaken(nextSaturday(), [{ jobNumber: 'LV92', how: 'taken' }], ['SH16', 'WA03']),
  coverCallIn: () =>
    coverCallIn({
      weekEnding: nextSaturday(),
      bidDate: defaultBidDate(nextSaturday()),
      slot: '9:15',
      spot: { kind: 'cover', position: 7, status: 'in' },
      change: 'new',
    }),
  coverWeekJobs: () =>
    coverWeekJobs(nextSaturday(), [
      { jobNumber: 'SH16', kind: 'added' },
      { jobNumber: 'LV92', kind: 'changed', field: 'mon' },
    ]),
  placeComments: () => placeComment('000000000000000000000000', false),
  tips: () => tip('1809', false),
  driverClaims: driverClaim,
  coverDisputes: coverDispute,
  signUps: signUp,
  places: () => place(false),
  slicEdits: () => slicEdit('1809', 'updated'),
  support: () => support('donation.created', 5, 'USD'),
};

function nextSaturday() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + ((6 - date.getUTCDay() + 7) % 7));
  return date.toISOString().slice(0, 10);
}

export const hasSample = (type) => Object.hasOwn(SAMPLES, type);

// Sends a sample of `type` to `userId`'s own devices, whatever their kinds.
// → { sent, failed }.
export function sendSample(type, userId, by) {
  const payload = SAMPLES[type]();
  return sendPush(
    [userId],
    { ...payload, body: `${payload.body} (Sample)`, tag: 'sample' },
    { type, source: 'sample', by },
  );
}
