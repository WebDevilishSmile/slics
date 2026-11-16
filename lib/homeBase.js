// A driver's home building: the one they start from (docs/MULTI-HUB.md "Home
// base"), stored as `users.homeBase`. It isn't `users.hubId`, which is a hub
// set up in SLICs; this is any UPS building, asked so the census can say which
// hub to onboard next. Pure, with relative imports only, so the app and
// plain-Node scripts (scripts/backfillHomeBase.mjs) share it.
//
//   users.homeBase = { numSlic, alphaSlic, name, source, listed, at }
//
// `numSlic` is a string, as in `slics` (`allHubs` stores a number, which
// drops a leading 0). The alpha code goes with it because `allHubs` reuses a
// few numbers on two buildings. `listed` is whether the All Hubs list has the
// building; one a driver typed in waits for the super admin to check it, and
// keeps the `city` and `state` they gave (its `name` is "Allentown, PA"), which
// with the SLIC and alpha code are enough to find the building.

import { DEFAULT_HUB } from './hubScope.js';

// Where an answer came from:
//   sheet  a verified driver: a name on BETPA's on-call sheet
//   staff  a dispatcher or an admin, who are BETPA's
//   asked  the driver answered on /home or /profile
//   admin  an admin set it
export const HOME_BASE_SOURCES = ['sheet', 'staff', 'asked', 'admin'];

export const HOME_BASE_CITY_MAX_LENGTH = 40;

// Where a UPS building can be: the states (every one on the All Hubs list is
// one), DC and Puerto Rico.
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN',
  'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX',
  'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

// The home base the app knows without asking: BETPA, for a verified driver
// ('sheet') or staff ('staff').
export function betpaHomeBase(source, at = new Date()) {
  if (source !== 'sheet' && source !== 'staff') {
    throw new Error(`BETPA is filled in only for 'sheet' or 'staff', not ${JSON.stringify(source)}.`);
  }
  return {
    numSlic: DEFAULT_HUB.numSlic,
    alphaSlic: DEFAULT_HUB.alphaSlic,
    name: DEFAULT_HUB.name,
    source,
    listed: true,
    at,
  };
}

// A SLIC number as typed: 4 or 5 characters, mostly digits, but some
// buildings' have letters (070CR, 62GL in `allHubs`). Uppercased; null when
// it isn't one.
const SLIC_NUMBER = /^[0-9A-Z]{4,5}$/;
export function parseNumSlic(value) {
  const text = String(value ?? '').trim().toUpperCase();
  return SLIC_NUMBER.test(text) ? text : null;
}

// A number from `allHubs`, which stores most as numbers and so loses a
// leading 0 (269 → '0269'). null when it isn't one.
export function normalizeNumSlic(value) {
  const text = String(value ?? '').trim();
  return parseNumSlic(/^\d{1,3}$/.test(text) ? text.padStart(4, '0') : text);
}

// An alpha code, uppercased: letters and digits, 2–7 (BETPA, FTW1).
export function normalizeAlphaSlic(value) {
  const text = String(value ?? '').trim().toUpperCase();
  return /^[A-Z0-9]{2,7}$/.test(text) ? text : null;
}

// "EASTON", "PA" → "Easton, PA"; whatever is missing is left out.
export function hubTown(city, state) {
  const town = String(city ?? '')
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
  const st = String(state ?? '').trim().toUpperCase();
  return [town, st].filter(Boolean).join(', ');
}

// What PUT /api/users/me/home-base accepts: `{ numSlic, alphaSlic, city?,
// state? }`. The city and state are for a building the list doesn't have:
// both or neither, the city plain text, the state a two-letter code. Never a
// source or `listed`: the server decides those. → { value } or { error }.
export function validateHomeBaseInput(body) {
  const numSlic = parseNumSlic(body?.numSlic);
  if (!numSlic) return { error: 'The SLIC number is 4 or 5 characters, like 1809.' };
  const alphaSlic = normalizeAlphaSlic(body?.alphaSlic);
  if (!alphaSlic) return { error: 'The alpha code is 2 to 7 letters or digits, like BETPA.' };
  const city = typeof body?.city === 'string' ? body.city.replace(/\s+/g, ' ').trim() : '';
  const state = typeof body?.state === 'string' ? body.state.trim().toUpperCase() : '';
  if (city.length > HOME_BASE_CITY_MAX_LENGTH) {
    return { error: `Keep the city under ${HOME_BASE_CITY_MAX_LENGTH} characters.` };
  }
  if (state && !US_STATES.includes(state)) return { error: 'Use the two-letter state, like PA.' };
  if (Boolean(city) !== Boolean(state)) return { error: 'Add both the city and the state.' };
  return { value: { numSlic, alphaSlic, city, state } };
}

export const isDefaultHub = (numSlic, alphaSlic) =>
  numSlic === DEFAULT_HUB.numSlic && alphaSlic === DEFAULT_HUB.alphaSlic;

// "BETPA 1809 · Bethlehem Center".
export function homeBaseLabel(homeBase) {
  if (!homeBase) return '';
  const code = `${homeBase.alphaSlic} ${homeBase.numSlic}`;
  return homeBase.name ? `${code} · ${homeBase.name}` : code;
}

// A verified driver's building follows the on-call sheet and staff's their
// role, so they don't change it themselves (MULTI-HUB.md "Home base", open
// question 2: they'll ask an admin, step 4). Takes the session's user or
// toSelfUser's shape: both have `driverVerified` and `role`.
export const homeBaseIsFixed = (user) =>
  user?.driverVerified === true || user?.superAdmin === true || user?.role === 'admin' || user?.role === 'dispatch';

