// Which hub (building) a piece of data or a request belongs to, and what a
// hub's settings are (docs/MULTI-HUB.md). Pure and import-free, so client
// components, the server and plain-Node scripts all share it. The stored
// settings are `hub-configs` (lib/db/hubConfigs.js); this file only shapes them.
//
// "Hub" here is a building using SLICs. It isn't the super admin's hub
// (lib/db/hub.js), the Covers hub (lib/db/coverHub.js) or the `allHubs` list.

export const DEFAULT_HUB_ID = 'betpa';

// BETPA's settings as the code has always had them. A missing `hub-configs`
// doc or field falls back to these, so deleting BETPA's doc is the rollback.
// The rules under `covers` are the on-call sheet's (docs/COVER-BIDDING.md):
//   coverDriverCount  pick order 1–20 are the cover drivers (lib/coverDrivers.js)
//   bidDayOffsetDays  bid day is this many days before the week's Saturday,
//                     so 9 is the Thursday before (lib/bidDay.js)
//   sleeperPattern    a job number matching it is a sleeper team's job, hidden
//                     from drivers (lib/coverBidJobRow.js)
//   layout            which sheet parsers read the tabs; only 'betpa-v1' exists
export const DEFAULT_HUB = Object.freeze({
  id: DEFAULT_HUB_ID,
  name: 'Bethlehem Center',
  alphaSlic: 'BETPA',
  numSlic: '1809',
  // The SLIC whose phone "Call dispatch" on /covers dials. By number, which
  // never changes, so editing the hub's phone in the SLIC form updates it.
  dispatchNumSlic: '1809',
  timeZone: 'America/New_York',
  covers: Object.freeze({
    enabled: true,
    layout: 'betpa-v1',
    coverDriverCount: 20,
    bidDayOffsetDays: 9,
    sleeperPattern: '^ER\\d',
  }),
});

export const HUB_LAYOUTS = ['betpa-v1'];

const HUB_ID = /^[a-z0-9-]{2,20}$/;

export const isHubId = (value) => typeof value === 'string' && HUB_ID.test(value);

// Every function that reads or writes per-hub data calls this first, so a
// forgotten hub fails loudly instead of reading every hub's rows.
export function assertHubId(hubId) {
  if (!isHubId(hubId)) throw new Error(`A hub id is required (got ${JSON.stringify(hubId)}).`);
  return hubId;
}

// The query part that scopes a per-hub collection. Until every BETPA doc has
// a `hubId` (MULTI-HUB.md stage 1), the default hub also matches docs with
// none: `$in` with null matches a missing field. It's one field, so it
// combines with a query's own `$or`.
export function hubFilter(hubId) {
  assertHubId(hubId);
  return hubId === DEFAULT_HUB_ID ? { hubId: { $in: [hubId, null] } } : { hubId };
}

// A key in keyed state (`sync-state` _ids, `cover-notices` keys). BETPA keeps
// the keys it has always had, so nothing is renamed and no reminder is sent
// twice; another hub's carry its id in front: 'allpa:jobs',
// 'allpa:reminder:…' (docs/MULTI-HUB.md, stage 2).
export function hubKey(hubId, key) {
  assertHubId(hubId);
  return hubId === DEFAULT_HUB_ID ? key : `${hubId}:${key}`;
}

const isText = (value, max = 80) => typeof value === 'string' && value.trim() !== '' && value.length <= max;
const isNumSlic = (value) => typeof value === 'string' && /^\d{1,6}$/.test(value);
const isWhole = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

function isTimeZone(value) {
  if (!isText(value, 64)) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function isPattern(value) {
  if (!isText(value, 40)) return false;
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}

// Settings for a hub that isn't BETPA start from BETPA's rules, with Covers
// off until its sheet is set up (MULTI-HUB.md stage 4).
function baseFor(hubId) {
  if (hubId === DEFAULT_HUB_ID) return DEFAULT_HUB;
  return {
    id: hubId,
    name: hubId.toUpperCase(),
    alphaSlic: hubId.toUpperCase(),
    numSlic: null,
    dispatchNumSlic: null,
    timeZone: DEFAULT_HUB.timeZone,
    covers: { ...DEFAULT_HUB.covers, enabled: false },
  };
}

// A hub's settings: the stored `hub-configs` doc (or null) over the base, one
// field at a time, so a missing or malformed field keeps the base value. Never
// includes the sheet's id or webhook secret; lib/db/hubConfigs.js adds those
// on the server as `sheet`.
export function hubConfigFrom(hubId, doc) {
  assertHubId(hubId);
  const base = baseFor(hubId);
  const covers = doc?.covers ?? {};
  const pick = (value, valid, fallback) => (valid(value) ? value : fallback);
  return {
    id: hubId,
    name: pick(doc?.name, isText, base.name),
    alphaSlic: pick(doc?.alphaSlic, (value) => isText(value, 10), base.alphaSlic),
    numSlic: pick(doc?.numSlic, isNumSlic, base.numSlic),
    dispatchNumSlic: pick(doc?.dispatchNumSlic, isNumSlic, base.dispatchNumSlic),
    timeZone: pick(doc?.timeZone, isTimeZone, base.timeZone),
    covers: {
      enabled: pick(covers.enabled, (value) => typeof value === 'boolean', base.covers.enabled),
      layout: pick(covers.layout, (value) => HUB_LAYOUTS.includes(value), base.covers.layout),
      coverDriverCount: pick(covers.coverDriverCount, (value) => isWhole(value, 1, 200), base.covers.coverDriverCount),
      bidDayOffsetDays: pick(covers.bidDayOffsetDays, (value) => isWhole(value, 0, 27), base.covers.bidDayOffsetDays),
      sleeperPattern: pick(covers.sleeperPattern, isPattern, base.covers.sleeperPattern),
    },
  };
}

// What may reach a browser: everything but `sheet` (the sheet's id and the
// webhook secret's hash).
export function publicHub(hub) {
  if (!hub) return null;
  const { sheet, ...rest } = hub;
  return rest;
}
