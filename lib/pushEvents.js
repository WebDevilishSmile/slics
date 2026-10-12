import { SLIC_REPORT_KINDS } from '@/constants';
import { formatWeekEnding } from '@/lib/onCallSheet';
import { sendPush, sendPushToAdmins } from '@/lib/push';
import { countJobChangesSince } from '@/lib/db/sheetJobs';
import { getJobChangesSeenAt } from '@/lib/db/users';

// Every push notification the app sends on its own, one function per kind
// (PUSH_TYPES in constants.js, docs/PUSH-NOTIFICATIONS.md stage 1b). Routes
// call them inside `after()`; they never throw (lib/push.js).
//
// This is the one file that writes what a lock screen shows, so check every
// payload here against the rule: a SLIC number or a week and what happened.
// Never a name, an email, an address, a phone number, or the text of a tip,
// comment, report note or supporter message. `except` is the account whose
// action set it off; they never get their own.

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const week = (weekEnding) => `W/E ${formatWeekEnding(weekEnding)}`;

// --- Payload builders, shared by the real sends and the samples ---

const jobChanges = (count) => ({
  title: 'Jobs tab changed',
  body: `${plural(count, 'new change')} on the Jobs tab.`,
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

const coverJobs = (weekEnding, created) => ({
  title: created ? 'Cover jobs posted' : 'Cover jobs changed',
  body: `${week(weekEnding)}: ${created ? 'the week is on the sheet.' : 'jobs or times changed on the sheet.'}`,
  url: `/admin/cover/jobs?week=${weekEnding}`,
  tag: `cover-jobs-${weekEnding}`,
});

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

const slicEdit = (numSlic, action) => ({
  title: `SLIC ${numSlic} ${SLIC_ACTIONS[action] ?? 'changed'}`,
  body: 'By another admin.',
  url: action === 'deleted' ? '/admin/slics' : `/home?slic=${encodeURIComponent(numSlic)}`,
  tag: `slic-${numSlic}`,
});

// Buy Me a Coffee event types as the webhook names them (docs/BMC-SUPPORT.md).
// BMC doesn't publish the list, so anything else still gets a push, named as
// BMC sent it: a renewal shows up whatever it's called.
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

// Also the activity feed's words for a support event (lib/db/activity.js).
export function supportTitle(type) {
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
const support = (type, amount, currency) => ({
  title: supportTitle(type),
  body: formatAmount(amount, currency) ?? 'Open Supporters to see it.',
  url: '/admin/super/supporters',
});

// --- The sends ---

// Each admin's own count of Jobs-tab changes they haven't seen; nobody is sent
// one with nothing new. One tag, so a burst of sheet pings updates one
// notification instead of stacking them.
export function notifyJobChanges({ except } = {}) {
  return sendPushToAdmins(
    'jobChanges',
    async (adminId) => {
      const count = await countJobChangesSince(await getJobChangesSeenAt(adminId));
      return count === 0 ? null : jobChanges(count);
    },
    { except },
  );
}

export const notifySlicReport = ({ numSlic, kind, except }) =>
  sendPushToAdmins('slicReports', slicReport(numSlic, kind), { except });

export const notifyTip = ({ numSlic, isReply, except }) =>
  sendPushToAdmins('tips', tip(numSlic, isReply), { except });

export const notifyCoverJobs = ({ weekEnding, created, except }) =>
  sendPushToAdmins('coverJobs', coverJobs(weekEnding, created), { except });

export const notifyCoverPicks = ({ weekEnding, drivers, except }) =>
  sendPushToAdmins('coverPicks', coverPicks(weekEnding, drivers), { except });

export const notifyDriverClaim = ({ except }) =>
  sendPushToAdmins('driverClaims', driverClaim(), { except });

export const notifySignUp = () => sendPushToAdmins('signUps', signUp());

export const notifyPlace = ({ isComment, except }) =>
  sendPushToAdmins('places', place(isComment), { except });

export const notifySlicEdit = ({ numSlic, action, except }) =>
  sendPushToAdmins('slicEdits', slicEdit(numSlic, action), { except });

export const notifySupport = ({ type, amount, currency }) =>
  sendPushToAdmins('support', support(type, amount, currency));

// --- Samples: "Send me a sample" on /admin/super/notifications ---

// What each kind looks like, with made-up details, so a super admin can see it
// on their own lock screen. One tag, so samples replace each other.
const SAMPLES = {
  jobChanges: () => jobChanges(3),
  coverJobs: () => coverJobs(nextSaturday(), false),
  coverPicks: () => coverPicks(nextSaturday(), 2),
  slicReports: () => slicReport('1809', 'phone'),
  tips: () => tip('1809', false),
  driverClaims: driverClaim,
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
