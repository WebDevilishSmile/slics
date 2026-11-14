// The made-up data creator mode shows (docs/CREATOR-MODE.md). Every SLIC,
// address, phone number, driver and tip here is invented: the phone numbers
// are 555-01xx (reserved for fiction), the companies are stock sample names,
// and nothing is copied from a real SLIC. Oakdale Hub (1234, OAKHB, 100 Example
// Road) is the same made-up SLIC the landing page and /help show.
//
// Pure, so the server page (slic/SlicLookupPage.jsx) and the browser's
// stand-in API (lib/creatorFetch.js) read the same data. Edit freely to stage
// a video. It may import only pure modules: the browser loads it too.

import dayjs from 'dayjs';

import { COVER_REMINDER_DEFAULT_LEADS, PUSH_TYPES } from '@/constants';
import { addDays, bidDateFor, currentBidWeek } from '@/lib/bidDay';
import { cleanCoverList, coverListStatus } from '@/lib/coverList';
import { jobSchedule } from '@/lib/driverWeek';
import { getUpcomingSaturday } from '@/lib/format';
import { stopKey } from '@/lib/jobRoutes';

// ── The driver on screen ────────────────────────────────────────────────────

const AVATAR_COLORS = ['#0288d1', '#7b1fa2', '#2e7d32', '#c62828', '#ef6c00', '#00838f', '#5d4037', '#283593'];

function initialsAvatar(name, color) {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"><rect width="40" height="40" rx="20" fill="${color}"/><text x="20" y="20" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="16" font-weight="bold" fill="white">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const CREATOR_NAME = 'Alex Rivera';

// The lifetime lookup count on the search bar.
export const CREATOR_VIEW_COUNT = 1286;

// The session user as a plain verified driver named Alex: no staff tools on
// the card or in the menu, and Covers through early access, so its row shows
// as a driver's would. The id stays the real one (the profile link), and so
// does the membership (the middleware's gate on /history reads the real one).
export function creatorUser(user) {
  return {
    id: user.id,
    name: CREATOR_NAME,
    image: initialsAvatar(CREATOR_NAME, AVATAR_COLORS[0]),
    role: 'user',
    superAdmin: false,
    areas: [],
    bmcMember: Boolean(user.bmcMember),
    driverVerified: true,
    coversAccess: true,
  };
}

// Tip authors, by first name as tips show them.
const DRIVERS = ['Dave', 'Maria', 'Kevin', 'Jess', 'Luis', 'Tom', 'Priya', 'Sam', 'Nate', 'Rosa'];
const author = (firstName, verified = true) => ({
  firstName,
  image: initialsAvatar(firstName, AVATAR_COLORS[(DRIVERS.indexOf(firstName) + 1) % AVATAR_COLORS.length]),
  verified,
});
export const CREATOR_AUTHOR = { firstName: 'Alex', image: initialsAvatar(CREATOR_NAME, AVATAR_COLORS[0]), verified: true };
const ME = CREATOR_AUTHOR;

// ── SLICs ───────────────────────────────────────────────────────────────────

// In toDriverSlic's shape (lib/serializers.js). `_id` is made up too.
function slic(fields) {
  const { numSlic } = fields;
  return {
    _id: `c7ea70700000000000${String(numSlic).padStart(6, '0')}`,
    alphaSlic: null,
    name: null,
    type: 'center',
    phone: null,
    pdf: false,
    pdfUrl: null,
    arrival: null,
    hasRoute: false,
    hasDocuments: false,
    ...fields,
    numSlic,
  };
}

export const CREATOR_SLICS = [
  slic({
    numSlic: 1234,
    alphaSlic: 'OAKHB',
    name: 'Oakdale Hub',
    address: { street: '100 Example Road', city: 'Oakdale', state: 'PA', zip: '15071' },
    phone: '(610) 555-0134',
    arrival:
      'Feeders use the north gate. Check in at the guard shack, then doors 14–20. Empties go in the back row by the fence.',
    hasRoute: true,
  }),
  slic({
    numSlic: 1240,
    alphaSlic: 'MPLRG',
    name: 'Maple Ridge',
    address: { street: '2200 Industrial Parkway', city: 'Maple Ridge', state: 'PA', zip: '18101' },
    phone: '(610) 555-0147',
    hasRoute: true,
  }),
  slic({
    numSlic: 1251,
    alphaSlic: 'RVRBD',
    name: 'Riverbend',
    address: { street: '45 Freight Lane', city: 'Riverbend', state: 'NJ', zip: '08801' },
    phone: '(908) 555-0162',
    arrival: 'Second driveway past the scale house. The first one is for package cars only.',
  }),
  slic({
    numSlic: 1263,
    alphaSlic: 'HLTWN',
    name: 'Hilltown',
    address: { street: '980 Commerce Drive', city: 'Hilltown', state: 'PA', zip: '18927' },
    phone: '(215) 555-0178',
  }),
  slic({
    numSlic: 1277,
    alphaSlic: 'PNCRK',
    name: 'Pine Creek',
    address: { street: '15 Depot Street', city: 'Pine Creek', state: 'PA', zip: '17740' },
    phone: '(570) 555-0119',
    hasRoute: true,
  }),
  slic({
    numSlic: 1288,
    alphaSlic: 'STNBR',
    name: 'Stonebridge',
    address: { street: '3100 Logistics Way', city: 'Stonebridge', state: 'NY', zip: '12901' },
    phone: '(518) 555-0190',
  }),
  slic({
    numSlic: 4012,
    type: 'customer',
    name: 'Fabrikam Distribution',
    address: { street: '500 Warehouse Road', city: 'Oakdale', state: 'PA', zip: '15071' },
    arrival: 'Check in at the window by door 1. They want the trailer backed into 6 or 7.',
  }),
  slic({
    numSlic: 4027,
    type: 'customer',
    name: 'Northwind Foods DC',
    address: { street: '1 Northwind Drive', city: 'Maple Ridge', state: 'PA', zip: '18101' },
    hasRoute: true,
  }),
  slic({
    numSlic: 4033,
    type: 'customer',
    name: 'Acme Paper Co.',
    address: { street: '77 Mill Street', city: 'Riverbend', state: 'NJ', zip: '08801' },
  }),
  slic({
    numSlic: 4048,
    type: 'customer',
    name: 'Contoso Rail Yard',
    address: { street: '2 Junction Road', city: 'Pine Creek', state: 'PA', zip: '17740' },
    arrival: 'Railyard: stay on the marked lane, and wait at the stop sign for the yard truck.',
  }),
  slic({
    numSlic: 4056,
    type: 'customer',
    name: 'Tailspin Outlets DC',
    address: { street: '880 Outlet Boulevard', city: 'Hilltown', state: 'PA', zip: '18927' },
  }),
];

// /hubs lists only the centers.
export const CREATOR_HUBS = CREATOR_SLICS.filter((s) => s.type === 'center');

// ── Directions ──────────────────────────────────────────────────────────────

// Plain text, one step per line; a line ending in ':' starts a section
// (lib/routeText.js).
export const CREATOR_ROUTES = {
  1234: `Way 1 (fastest):
Left out of the hub onto Example Road.
Right on Route 9 North for 4 miles.
Take exit 12 toward Oakdale.
Left at the second light onto Depot Street.
The north gate is on the right, past the rail crossing.
Way 2 (no low bridges):
Right out of the hub onto Example Road.
Left on Valley Pike, then stay on it for 7 miles.
Right on Depot Street at the four-way stop.
The north gate is on the left.
Way back:
Right out of the north gate onto Depot Street.
Right on Route 9 South to exit 4.
Left on Example Road to the hub.`,
  1240: `Left out of the hub onto Example Road.
Merge onto I-78 East for 11 miles.
Take exit 22, Maple Ridge.
Right on Industrial Parkway.
The building is the second on the left, with the blue doors.
Way back:
Left out of the lot onto Industrial Parkway.
I-78 West to exit 9, then left on Example Road.`,
  1277: `Left out of the hub onto Example Road.
Route 9 North for 18 miles, past the quarry.
Right on Creek Road at the flashing light.
Left on Depot Street; the yard is at the end.
Way back:
Turn around in the yard, Depot Street to Creek Road.
Left on Route 9 South back to the hub.`,
  4027: `Left out of the hub onto Example Road.
I-78 East to exit 22, Maple Ridge.
Left on Northwind Drive at the end of the ramp.
Truck entrance is the second driveway.`,
};

// ── Tips ────────────────────────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000;
const ago = (now, days, hours = 0) => new Date(now - days * DAY - hours * 60 * 60 * 1000).toISOString();

// Records in the shape getSlicThread gives each comment (lib/db/comments.js),
// flat: a reply has `parentId`. Dated from `now`, so they always read as recent.
export function creatorTips(now = Date.now()) {
  let n = 0;
  const id = () => `c7ea7070ee00000000${String((n += 1)).padStart(6, '0')}`;
  const tips = [];
  const tip = (numSlic, who, content, { days = 1, hours = 0, up = 0, down = 0, myVote = null, pin = null, parentId = null } = {}) => {
    const record = {
      _id: id(),
      numSlic: String(numSlic),
      parentId,
      author: who === 'me' ? ME : author(who),
      isMine: who === 'me',
      content,
      format: 'text',
      deleted: false,
      pin,
      upCount: up,
      downCount: down,
      myVote,
      created_at: ago(now, days, hours),
      updated_at: null,
    };
    tips.push(record);
    return record._id;
  };

  // Oakdale Hub: a busy thread, with replies, a pin and one of Alex's own.
  const gate = tip(1234, 'Dave', 'Feeders use the north gate. Check in at the guard shack, then doors 14–20.', {
    days: 2,
    up: 14,
    myVote: 'up',
  });
  tip(1234, 'Maria', 'Still true. The south gate is package cars only after 6pm.', { days: 1, hours: 3, up: 4, parentId: gate });
  tip(1234, 'Luis', 'Guard asks for the trailer number, have it ready.', { hours: 5, up: 2, parentId: gate });
  tip(1234, 'Kevin', 'Truck parking for breaks is past the fuel island, along the fence. Restroom is inside door 3.', {
    days: 5,
    up: 9,
    pin: { lat: 40.5191, lng: -80.2216 },
  });
  tip(1234, 'me', 'Low branch on Depot Street right before the gate. Swing wide.', { days: 9, up: 6 });
  tip(1234, 'Jess', 'Diner across Route 9 has room for a set. Good coffee.', { days: 14, up: 3, down: 1 });

  // Maple Ridge
  const doors = tip(1240, 'Tom', 'Drop empties on the far row, they get mad if you block door 2.', { days: 3, up: 7 });
  tip(1240, 'Priya', 'And call the number on the board if nobody is at the window.', { days: 2, up: 3, parentId: doors });
  tip(1240, 'Sam', 'Exit 22 ramp is tight, take it slow.', { days: 6, up: 5 });
  tip(1240, 'me', 'Window closes for lunch 12 to 12:30. Drop and hook still works.', { days: 12, up: 4 });

  // Riverbend
  tip(1251, 'Nate', 'Scale house closes at 10pm. After that, go straight to the yard.', { days: 4, up: 8 });

  // Pine Creek
  tip(1277, 'Rosa', 'No cell signal past the quarry. Download the directions before you leave.', { days: 2, up: 11 });
  tip(1277, 'Dave', 'Plenty of room to turn around at the end of Depot Street.', { days: 8, up: 4 });

  // Fabrikam Distribution
  tip(4012, 'Kevin', 'Back into 6 or 7 only. They hold the paperwork until you do.', { days: 1, up: 6 });

  // Northwind Foods DC
  const cold = tip(4027, 'Maria', 'Reefer doors are on the north side. Check in first, they assign the door.', { days: 3, up: 5 });
  tip(4027, 'Luis', 'Bring your own pen, they never have one.', { days: 2, up: 9, parentId: cold });
  tip(4027, 'me', 'And they want the seal number on the sheet before you leave.', { days: 1, up: 2, parentId: cold });

  // Contoso Rail Yard
  tip(4048, 'Tom', 'Wait for the yard truck to wave you in. Do not cross the tracks on your own.', { days: 2, up: 12 });

  return tips;
}

// Live tips and replies on one SLIC, as the server counts them.
export const countCreatorTips = (tips, numSlic) =>
  tips.filter((tip) => tip.numSlic === String(numSlic) && !tip.deleted).length;

// Flat comment records → a thread: top level by score then newest, replies
// oldest first (getSlicThread, lib/db/comments.js; getPlaceThread,
// lib/db/places.js).
export function threadOf(records) {
  const time = (record) => new Date(record.created_at).getTime();
  const score = (record) => record.upCount - record.downCount;
  return records
    .filter((record) => !record.parentId)
    .map((record) => ({
      ...record,
      replies: records.filter((reply) => reply.parentId === record._id).sort((a, b) => time(a) - time(b)),
    }))
    .sort((a, b) => score(b) - score(a) || time(b) - time(a));
}

// The thread for one SLIC as GET /api/comments sends it.
export const creatorThread = (tips, numSlic) => threadOf(tips.filter((tip) => tip.numSlic === String(numSlic)));

// Alex's own tips and replies, newest first, as the profile's "Your tips"
// lists them (CommentCard reads vote arrays, as getCommentsByUserId gives).
export function creatorMyTips(tips) {
  return tips
    .filter((tip) => tip.isMine && !tip.deleted)
    .map((tip) => ({
      _id: tip._id,
      numSlic: tip.numSlic,
      parentId: tip.parentId,
      content: tip.content,
      format: 'text',
      pin: tip.pin,
      upVotes: Array.from({ length: tip.upCount }, (_, i) => `up${i}`),
      downVotes: Array.from({ length: tip.downCount }, (_, i) => `down${i}`),
      created_at: tip.created_at,
      updated_at: tip.updated_at,
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// The "Votes" dialog: names to go with a tip's counts.
export function creatorVoters(tip) {
  const voter = (firstName, i) => ({
    _id: `c7ea7070ff0000000000${String(i).padStart(4, '0')}`,
    name: firstName,
    image: author(firstName).image,
  });
  const others = DRIVERS.filter((name) => name !== tip.author?.firstName);
  const up = others.slice(0, Math.min(tip.upCount, others.length)).map(voter);
  if (tip.myVote === 'up' && up.length) up[0] = { ...up[0], name: CREATOR_NAME, image: ME.image };
  const down = others.slice(-Math.min(tip.downCount, others.length)).map((name, i) => voter(name, 100 + i));
  return { upVoters: up, downVoters: tip.downCount ? down : [] };
}

export function creatorSlicName(numSlic) {
  const found = CREATOR_SLICS.find((s) => String(s.numSlic) === String(numSlic));
  return found?.name || found?.alphaSlic || null;
}

// ── Profile ─────────────────────────────────────────────────────────────────

// Alex's profile in toSelfUser's shape (lib/serializers.js), under the real
// account id so the page's own-profile check passes.
export function creatorProfile(userId, now = Date.now()) {
  return {
    _id: userId,
    name: CREATOR_NAME,
    image: CREATOR_AUTHOR.image,
    firstName: 'Alex',
    lastName: 'Rivera',
    email: 'alex.rivera@example.com',
    emailConfirmed: true,
    phone: '(610) 555-0188',
    role: 'user',
    bmcMember: true,
    driverVerified: true,
    driverName: 'Rivera, Alex',
    created_at: new Date(now - 400 * DAY).toISOString(),
    hasPassword: true,
  };
}

export const creatorSupporterSince = (now = Date.now()) => new Date(now - 200 * DAY).toISOString();

// Every kind a verified cover driver chooses, at its default (resolvePushPrefs,
// lib/db/users.js).
export const creatorPushPrefs = () =>
  Object.fromEntries(
    PUSH_TYPES.filter((type) => type.audience === 'driver' || type.audience === 'coverDriver').map((type) => [
      type.key,
      type.defaultOn,
    ]),
  );

export const creatorReminderLeads = () => [...COVER_REMINDER_DEFAULT_LEADS];

// ── Covers ──────────────────────────────────────────────────────────────────

// Alex's place on every posted week's pick list (myCoverSpot's shape).
export const CREATOR_CALL_IN = '14:30';
const CREATOR_SPOT = { kind: 'cover', position: 4, name: '', callIn: CREATOR_CALL_IN, job: '', status: 'in' };

// A week's jobs: number, start times Sun→Sat ('' off) and the sheet's route.
const JOB_TEMPLATES = [
  ['OAK101', ['', '03:30', '03:30', '03:30', '03:30', '03:30', ''], 'MON-FRI: OAKHB > MPLRG > OAKHB'],
  ['OAK102', ['', '04:15', '04:15', '04:15', '04:15', '04:15', ''], 'MON-FRI: OAKHB > RVRBD > OAKHB'],
  ['OAK103', ['', '05:00', '05:00', '05:00', '05:00', '05:00', ''], 'MON-FRI: OAKHB > HLTWN > STNBR > OAKHB'],
  ['OAK104', ['22:00', '22:00', '22:00', '22:00', '22:00', '', ''], 'SUN-THU: OAKHB > PNCRK > OAKHB'],
  ['OAK105', ['', '06:30', '06:30', '06:30', '06:30', '06:30', ''], 'MON-FRI: OAKHB > MPLRG > HLTWN > OAKHB'],
  ['OAK106', ['', '19:45', '19:45', '19:45', '19:45', '19:45', ''], 'MON-FRI: OAKHB > STNBR > OAKHB'],
  ['OAK107', ['', '', '08:00', '08:00', '08:00', '08:00', '08:00'], 'TUE-SAT: OAKHB > RVRBD > MPLRG > OAKHB'],
  ['OAK108', ['', '21:30', '21:30', '21:30', '21:30', '21:30', ''], 'MON-FRI: OAKHB > PNCRK > HLTWN > OAKHB'],
  ['OAK109', ['', '02:45', '02:45', '02:45', '02:45', '02:45', ''], 'MON-FRI: OAKHB > HLTWN > OAKHB'],
  ['OAK110', ['', '23:15', '23:15', '23:15', '23:15', '', ''], 'MON-THU: OAKHB > MPLRG > RVRBD > OAKHB'],
  ['OAK111', ['', '07:00', '07:00', '07:00', '07:00', '07:00', ''], 'MON-FRI: OAKHB > STNBR > HLTWN > OAKHB'],
  ['OAK112', ['18:00', '18:00', '18:00', '18:00', '18:00', '', ''], 'SUN-THU: OAKHB > RVRBD > OAKHB'],
  ['OAK113', ['', '01:30', '01:30', '01:30', '01:30', '01:30', ''], 'MON-FRI: OAKHB > PNCRK > OAKHB'],
  ['OAK114', ['', '10:00', '10:00', '10:00', '10:00', '10:00', ''], 'MON-FRI: OAKHB > MPLRG > OAKHB'],
];
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// The job Alex covers this week, on the profile's This week card.
const MY_JOB = 'OAK105';

// The cover weeks, as New York dates: this week (under way, most jobs taken)
// and the week bid on this week (a few taken). → { thisWeek, bidWeek, weeks }
function coverWeeks(today) {
  const thisWeek = getUpcomingSaturday(dayjs(today)).format('YYYY-MM-DD');
  const bidWeek = currentBidWeek(today);
  return { thisWeek, bidWeek, weeks: [...new Set([thisWeek, bidWeek])] };
}

// Every week's jobs in toDriverCoverJob's shape (lib/serializers.js): picked
// or not, never by whom.
export function creatorCoverJobs(today) {
  const { thisWeek, weeks } = coverWeeks(today);
  return weeks.flatMap((weekEnding, w) =>
    JOB_TEMPLATES.map(([jobNumber, times, description], i) => ({
      _id: `c7ea7070cc0000000${w}${String(i).padStart(6, '0')}`,
      weekEnding,
      jobNumber,
      description,
      ...Object.fromEntries(DAYS.map((day, d) => [day, times[d]])),
      sortOrder: i,
      // This week: all but three taken (Alex has OAK105). The bid week: four.
      picked: weekEnding === thisWeek ? ![2, 9, 12].includes(i) : [0, 3, 6, 10].includes(i),
    })),
  );
}

// A list of the jobs Alex wants, as CoverBoard holds it: entries with where
// each job stands (coverListStatus, lib/coverList.js).
export function creatorCoverListStatus(jobNumbers, jobs, weekEnding) {
  return coverListStatus(
    cleanCoverList(jobNumbers),
    jobs.filter((job) => job.weekEnding === weekEnding),
    weekEnding,
  );
}

// Everything /covers passes its components for a verified cover driver
// (app/covers/page.jsx), made up.
export function creatorCovers(today) {
  const { thisWeek, bidWeek, weeks } = coverWeeks(today);
  const jobs = creatorCoverJobs(today);
  const bidDates = Object.fromEntries(weeks.map((week) => [week, bidDateFor(week, {})]));
  return {
    jobs,
    thisWeek,
    bidWeek,
    minWeekEnding: addDays(thisWeek, -28),
    bidDates,
    callIns: Object.fromEntries(weeks.map((week) => [week, CREATOR_CALL_IN])),
    myWeek: { weekEnding: bidWeek, bidDate: bidDates[bidWeek], posted: true, spot: CREATOR_SPOT },
    // The jobs Alex has listed for the week being bid on.
    lists: { [bidWeek]: creatorCoverListStatus(['OAK102', 'OAK108', 'OAK111'], jobs, bidWeek) },
    dispatch: { name: 'OAKHB', phone: '(610) 555-0134' },
  };
}

// The made-up SLICs a route's stops link to, as [stopKey, { numSlic, alpha }]
// pairs (what getSlicsByAlpha, lib/db/slics.js, returns as a Map).
const creatorStops = () =>
  CREATOR_SLICS.filter((s) => s.alphaSlic).map((s) => [
    stopKey(s.alphaSlic),
    { numSlic: s.numSlic, alpha: s.alphaSlic },
  ]);

// Everything /jobs passes its board (app/jobs/page.jsx), made up: the Covers
// jobs as bid jobs in toDriverSheetJob's shape (lib/serializers.js), each
// with hours, miles and a seniority number, and the stops that are SLICs.
// None is Alex's: he's a cover driver.
export function creatorJobs() {
  const jobs = JOB_TEMPLATES.map(([jobName, times, description], i) => {
    const hours = 8.5 + (i % 4) * 0.5;
    const miles = 180 + ((i * 53) % 160);
    const worked = times.filter(Boolean).length;
    return {
      jobName,
      days: Object.fromEntries(
        DAYS.map((day, d) => [
          day,
          times[d] ? { start: times[d], hours: String(hours), miles: String(miles) } : { start: '', hours: '', miles: '' },
        ]),
      ),
      description,
      weekHours: String(hours * worked),
      seniority: String(((i * 37) % 140) + 1),
      mine: false,
    };
  });
  return { jobs, stops: creatorStops() };
}

// The profile's This week card in toDriverWeek's shape: covering a job this
// week and, next week, a place on the list with no job picked yet.
export function creatorDriverWeek(today) {
  const { thisWeek, bidWeek } = coverWeeks(today);
  const job = creatorCoverJobs(today).find((j) => j.weekEnding === thisWeek && j.jobNumber === MY_JOB);
  const slicsByStop = new Map(creatorStops());
  const schedule = jobSchedule({
    starts: Object.fromEntries(DAYS.map((day) => [day, job[day]])),
    description: job.description,
    slicsByStop,
  });
  const weeks = [
    {
      weekEnding: thisWeek,
      which: 'this',
      posted: true,
      assignment: { kind: 'covering', jobNumber: MY_JOB, callIn: CREATOR_CALL_IN },
      schedule,
    },
  ];
  if (bidWeek !== thisWeek) {
    weeks.push({
      weekEnding: bidWeek,
      which: 'next',
      posted: true,
      assignment: { kind: 'coverUnpicked', position: CREATOR_SPOT.position, callIn: CREATOR_CALL_IN },
      schedule: null,
    });
  }
  return { today, ownJob: null, weeks };
}

// ── History ─────────────────────────────────────────────────────────────────

// The page size of /history (HISTORY_PAGE_SIZE, lib/db/slicViews.js, which
// imports the database and can't load here).
const HISTORY_PAGE_SIZE = 50;

const NOTES = {
  3: 'Gate guard wanted the seal number.',
  11: 'Door 17, empties on the fence row.',
  24: 'Took Way 2, bridge work on Route 9.',
  40: 'Dock window closed until 12:30.',
};

// About 90 lookups over the last six weeks, newest first, a few with notes.
// Spread by a fixed sequence, so the server and the browser make the same rows.
export function creatorHistory(now = Date.now()) {
  const order = [1234, 1240, 1234, 4012, 1277, 1251, 1234, 4027, 1263, 1240, 1288, 4048, 1234, 4033, 1277, 4056];
  let at = now - 2 * 60 * 60 * 1000;
  return Array.from({ length: 90 }, (_, i) => {
    at -= (((i * 7919) % 13) + 4) * 54 * 60 * 1000;
    return {
      id: `c7ea7070bb0000000000${String(i).padStart(4, '0')}`,
      numSlic: order[(i * 5) % order.length],
      viewedAt: new Date(at).toISOString(),
      note: NOTES[i] ?? null,
      hidden: false,
    };
  });
}

const findSlic = (numSlic) => CREATOR_SLICS.find((s) => String(s.numSlic) === String(numSlic));

const slicForHistory = (numSlic) => {
  const slic = findSlic(numSlic);
  return slic ? { alphaSlic: slic.alphaSlic, name: slic.name || null, type: slic.type || 'center' } : null;
};

const historyMatches = (view, needle) => {
  const slic = findSlic(view.numSlic);
  return (
    [slic?.numSlic, slic?.alphaSlic, slic?.name, ...Object.values(slic?.address ?? {})].some(
      (field) => field && String(field).toLowerCase().includes(needle),
    ) || Boolean(view.note?.toLowerCase().includes(needle))
  );
};

// One page of the history as GET /api/users/me/history sends it, from the
// same query (parseHistoryQuery + getHistoryPage, lib/db/slicViews.js): q,
// from, to, type, notes=1, sort, and a cursor (here, the rows already sent).
// `query` is URLSearchParams or a plain object. → { views, nextCursor, total }
export function creatorHistoryPage(views, query = {}) {
  const get = (key) => {
    const value = typeof query.get === 'function' ? query.get(key) : query[key];
    return (Array.isArray(value) ? value[0] : value) || null;
  };
  const time = (value) => (value ? new Date(value).getTime() : NaN);
  const from = time(get('from'));
  const to = time(get('to'));
  const needle = (get('q') || '').trim().toLowerCase();
  const type = get('type');
  const oldest = get('sort') === 'oldest';

  const matching = views
    .filter((view) => !view.hidden)
    .filter((view) => Number.isNaN(from) || time(view.viewedAt) >= from)
    .filter((view) => Number.isNaN(to) || time(view.viewedAt) < to)
    .filter((view) => !type || slicForHistory(view.numSlic)?.type === type)
    .filter((view) => !needle || historyMatches(view, needle))
    .filter((view) => get('notes') !== '1' || Boolean(view.note))
    .sort((a, b) => (oldest ? 1 : -1) * (time(a.viewedAt) - time(b.viewedAt)));

  const start = Number.parseInt(get('cursor'), 10) || 0;
  const page = matching.slice(start, start + HISTORY_PAGE_SIZE);
  return {
    views: page.map((view) => ({
      id: view.id,
      numSlic: view.numSlic,
      viewedAt: view.viewedAt,
      note: view.note || null,
      slic: slicForHistory(view.numSlic),
    })),
    nextCursor: start + HISTORY_PAGE_SIZE < matching.length ? String(start + HISTORY_PAGE_SIZE) : null,
    total: matching.length,
  };
}

// ── Places ──────────────────────────────────────────────────────────────────

const placeId = (n) => `c7ea7070aa${String(n).padStart(14, '0')}`;

const place = (fields) => ({
  phone: '',
  open24h: false,
  hours: '',
  parking: null,
  slics: [],
  updated_at: null,
  addedByMe: false,
  ...fields,
});

// Places in getPlaces' shape (lib/db/places.js), less `commentCount`, which
// the page counts from the comments. Ordered by state, city, name.
export function creatorPlaces(now = Date.now()) {
  const ago = (days) => new Date(now - days * DAY).toISOString();
  return [
    place({
      _id: placeId(5),
      name: 'Hilltown Truck Stop',
      categories: ['fuel', 'food', 'truck-parking', 'showers'],
      trailerAccess: 'yes',
      address: { street: '2500 Commerce Drive', city: 'Hilltown', state: 'PA', zip: '18927' },
      phone: '(215) 555-0150',
      open24h: true,
      parking: { lat: 40.3401, lng: -75.2502 },
      slics: ['1263', '4056'],
      created_at: ago(60),
      creatorName: 'Tom',
    }),
    place({
      _id: placeId(3),
      name: 'Maple Ridge Rest Area (eastbound)',
      categories: ['rest-area', 'restroom', 'truck-parking'],
      trailerAccess: 'yes',
      address: { street: '', city: 'Maple Ridge', state: 'PA', zip: '' },
      open24h: true,
      parking: { lat: 40.6021, lng: -75.4712 },
      slics: ['1240', '4027'],
      created_at: ago(21),
      creatorName: 'Maria',
    }),
    place({
      _id: placeId(1),
      name: 'Oakdale Travel Plaza',
      categories: ['fuel', 'food', 'restroom', 'showers'],
      trailerAccess: 'yes',
      address: { street: '1 Plaza Drive', city: 'Oakdale', state: 'PA', zip: '15071' },
      phone: '(610) 555-0111',
      open24h: true,
      parking: { lat: 40.4012, lng: -80.2451 },
      slics: ['1234', '4012'],
      created_at: ago(30),
      creatorName: 'Kevin',
    }),
    place({
      _id: placeId(2),
      name: 'Route 9 Diner',
      categories: ['food', 'restroom'],
      trailerAccess: 'tight',
      address: { street: '412 Route 9', city: 'Oakdale', state: 'PA', zip: '15071' },
      hours: '5am–10pm',
      parking: { lat: 40.4123, lng: -80.2309 },
      slics: ['1234'],
      created_at: ago(14),
      addedByMe: true,
      creatorName: 'Alex',
    }),
    place({
      _id: placeId(4),
      name: 'Quarry Road Fuel',
      categories: ['fuel'],
      trailerAccess: 'yes',
      address: { street: '88 Quarry Road', city: 'Pine Creek', state: 'PA', zip: '17740' },
      hours: '6am–9pm',
      parking: { lat: 41.2214, lng: -77.3301 },
      slics: ['1277', '4048'],
      created_at: ago(40),
      creatorName: 'Rosa',
    }),
    place({
      _id: placeId(6),
      name: 'Riverbend Coffee',
      categories: ['food', 'restroom'],
      trailerAccess: 'no',
      address: { street: '9 Main Street', city: 'Riverbend', state: 'NJ', zip: '08801' },
      hours: '6am–2pm',
      parking: { lat: 40.6401, lng: -74.8805 },
      slics: ['1251'],
      created_at: ago(9),
      creatorName: 'Nate',
    }),
    place({
      _id: placeId(7),
      name: 'Stonebridge Service Area',
      categories: ['fuel', 'food', 'restroom', 'rest-area'],
      trailerAccess: 'yes',
      address: { street: '', city: 'Stonebridge', state: 'NY', zip: '' },
      open24h: true,
      parking: { lat: 44.6601, lng: -73.4802 },
      slics: ['1288'],
      created_at: ago(50),
      creatorName: 'Priya',
    }),
  ];
}

// Comments on places, flat, in getPlaceThread's record shape plus `placeId`.
export function creatorPlaceComments(now = Date.now()) {
  let n = 0;
  const comments = [];
  const comment = (placeNumber, who, content, { days = 1, up = 0, down = 0, myVote = null, parentId = null } = {}) => {
    const record = {
      _id: `c7ea7070ab00000000${String((n += 1)).padStart(6, '0')}`,
      placeId: placeId(placeNumber),
      parentId,
      author: who === 'me' ? { firstName: 'Alex', image: CREATOR_AUTHOR.image } : { firstName: who, image: author(who).image },
      isMine: who === 'me',
      content,
      deleted: false,
      upCount: up,
      downCount: down,
      myVote,
      created_at: new Date(now - days * DAY).toISOString(),
      updated_at: null,
    };
    comments.push(record);
    return record._id;
  };
  const lot = comment(1, 'Kevin', 'Truck lot is around back. Showers are clean, ask for a key at the counter.', {
    days: 4,
    up: 8,
    myVote: 'up',
  });
  comment(1, 'Luis', 'Lot fills up after 9pm, get there early.', { days: 2, up: 3, parentId: lot });
  comment(2, 'Jess', 'Pull in from the side street, the front lot is too tight for a set.', { days: 6, up: 5 });
  comment(2, 'me', 'Best breakfast on the run. Opens at 5.', { days: 10, up: 4 });
  comment(3, 'Maria', 'Restrooms were closed for cleaning at 3am, open again by 4.', { days: 3, up: 2 });
  comment(5, 'Tom', 'Diesel lanes on the left. Scale is free with fuel.', { days: 7, up: 6 });
  comment(6, 'Nate', 'Bobtail only, there is nowhere to put a trailer.', { days: 1, up: 3 });
  return comments;
}

// The thread for one place as GET /api/place-comments sends it.
export const creatorPlaceThread = (comments, id) => threadOf(comments.filter((comment) => comment.placeId === id));

// The places with their live comment counts, as the page lists them.
export const withCommentCounts = (places, comments) =>
  places.map((p) => ({
    ...p,
    commentCount: comments.filter((comment) => comment.placeId === p._id && !comment.deleted).length,
  }));

// The SLIC pickers on /places (app/places/page.jsx's slicOptions).
export const creatorSlicOptions = () =>
  CREATOR_SLICS.map(({ numSlic, alphaSlic, name }) => ({
    numSlic: String(numSlic),
    alphaSlic: alphaSlic || '',
    name: name || '',
  }));
