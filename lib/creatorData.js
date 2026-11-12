// The made-up data creator mode shows (docs/CREATOR-MODE.md). Every SLIC,
// address, phone number, driver and tip here is invented: the phone numbers
// are 555-01xx (reserved for fiction), the companies are stock sample names,
// and nothing is copied from a real SLIC. Oakdale Hub (1234, OAKHB, 100 Example
// Road) is the same made-up SLIC the landing page and /help show.
//
// Pure, so the server page (slic/SlicLookupPage.jsx) and the browser's
// stand-in API (lib/creatorFetch.js) read the same data. Edit freely to stage
// a video.

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
// the card or in the menu. The id stays the real one (the profile link), and
// so does the membership.
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
    coversAccess: false,
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

  // Contoso Rail Yard
  tip(4048, 'Tom', 'Wait for the yard truck to wave you in. Do not cross the tracks on your own.', { days: 2, up: 12 });

  return tips;
}

// Live tips and replies on one SLIC, as the server counts them.
export const countCreatorTips = (tips, numSlic) =>
  tips.filter((tip) => tip.numSlic === String(numSlic) && !tip.deleted).length;

// The thread for one SLIC as GET /api/comments sends it: top level by score
// then newest, replies oldest first (getSlicThread, lib/db/comments.js).
export function creatorThread(tips, numSlic) {
  const time = (tip) => new Date(tip.created_at).getTime();
  const score = (tip) => tip.upCount - tip.downCount;
  const mine = tips.filter((tip) => tip.numSlic === String(numSlic));
  return mine
    .filter((tip) => !tip.parentId)
    .map((tip) => ({
      ...tip,
      replies: mine.filter((reply) => reply.parentId === tip._id).sort((a, b) => time(a) - time(b)),
    }))
    .sort((a, b) => score(b) - score(a) || time(b) - time(a));
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
