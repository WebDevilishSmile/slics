// A driver's home building: the one they start from (docs/MULTI-HUB.md "Home
// base"), stored as `users.homeBase`. It isn't `users.hubId`, which is a hub
// set up in SLICs; this is any UPS building, asked so the census can say which
// hub to onboard next. Pure, with relative imports only, so the app and
// plain-Node scripts (scripts/backfillHomeBase.mjs) share it.
//
//   users.homeBase = { numSlic, alphaSlic, name, source, listed, at }
//
// `numSlic` is a string, as in `slics` (`allHubs` stores a number). The alpha
// code goes with it because `allHubs` reuses a few numbers on two buildings.

import { DEFAULT_HUB } from './hubScope.js';

// Where an answer came from:
//   sheet  a verified driver: a name on BETPA's on-call sheet
//   staff  a dispatcher or an admin, who are BETPA's
//   asked  the driver answered on /home or /profile
//   admin  an admin set it
export const HOME_BASE_SOURCES = ['sheet', 'staff', 'asked', 'admin'];

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
