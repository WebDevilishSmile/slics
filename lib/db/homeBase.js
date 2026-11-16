import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';
import { recordAdminAction } from '@/lib/db/adminAudit';
import { DEFAULT_HUB } from '@/lib/hubScope';
import {
  betpaHomeBase,
  homeBaseLabel,
  hubTown,
  isDefaultHub,
  normalizeAlphaSlic,
  normalizeNumSlic,
} from '@/lib/homeBase';

// `users.homeBase`, the building a driver starts from (docs/MULTI-HUB.md
// "Home base"; the shape is in lib/homeBase.js).

const users = () => client.db().collection('users');

const toObjectId = (userId) => (userId instanceof ObjectId ? userId : new ObjectId(String(userId)));

// Fills in BETPA for an account the app has just placed there: a driver an
// admin verified ('sheet', setUserDriver) or a promotion to staff ('staff',
// setUserRole). Only where there's no home base yet, so an answer the driver
// gave or an admin set is never overwritten. Never throws: a home base is a
// census answer, not worth failing a verification or a promotion over.
export async function fillBetpaHomeBase(userId, source) {
  try {
    await users().updateOne(
      { _id: toObjectId(userId), homeBase: { $exists: false } },
      { $set: { homeBase: betpaHomeBase(source) } },
    );
  } catch (error) {
    console.error('Error filling in a home base:', error);
  }
}

// The account's home base, or null when it has none. /home asks only to know
// whether to show the card.
export async function getHomeBase(userId) {
  const user = await users().findOne({ _id: toObjectId(userId) }, { projection: { homeBase: 1 } });
  return user?.homeBase ?? null;
}

// The All Hubs list as the picker needs it: `{ numSlic, alphaSlic, town }`,
// numbers as text with their leading 0, BETPA first and the rest by alpha
// code. A row with no usable number or alpha code is left out.
export async function getHubChoices() {
  const rows = await client
    .db()
    .collection('allHubs')
    .find({}, { projection: { numSlic: 1, alphaSlic: 1, 'address.city': 1, 'address.state': 1 } })
    .toArray();
  const choices = [];
  for (const row of rows) {
    const numSlic = normalizeNumSlic(row.numSlic);
    const alphaSlic = normalizeAlphaSlic(row.alphaSlic);
    if (!numSlic || !alphaSlic) continue;
    // BETPA by the name it's saved under (saveAskedHomeBase), not its town.
    const town = isDefaultHub(numSlic, alphaSlic) ? DEFAULT_HUB.name : hubTown(row.address?.city, row.address?.state);
    choices.push({ numSlic, alphaSlic, town });
  }
  const rank = (choice) => (isDefaultHub(choice.numSlic, choice.alphaSlic) ? 0 : 1);
  return choices.sort(
    (a, b) => rank(a) - rank(b) || a.alphaSlic.localeCompare(b.alphaSlic) || a.numSlic.localeCompare(b.numSlic),
  );
}

// A building as SLICs saves it, from validated input (validateHomeBaseInput):
// `listed` when the All Hubs list has that number with that alpha code, and
// then its name is the list's town (BETPA's "Bethlehem Center"). One it
// doesn't have keeps the city and state given, its name built from them
// ("Allentown, PA"), and waits for the super admin (MULTI-HUB.md "Home base",
// step 4). → { building } or { error } for an unlisted one with no city.
async function resolveBuilding({ numSlic, alphaSlic, city, state }) {
  const listedRow = await client
    .db()
    .collection('allHubs')
    .findOne(
      { alphaSlic, numSlic: { $in: [numSlic, Number(numSlic)] } },
      { projection: { 'address.city': 1, 'address.state': 1 } },
    );
  if (listedRow) {
    const name = isDefaultHub(numSlic, alphaSlic)
      ? DEFAULT_HUB.name
      : hubTown(listedRow.address?.city, listedRow.address?.state);
    return { building: { numSlic, alphaSlic, name, listed: true } };
  }
  if (!(city && state)) {
    return { error: "That one isn't on the list. Add its city and state, so we can check it." };
  }
  return {
    building: { numSlic, alphaSlic, name: hubTown(city, state), city: hubTown(city, ''), state, listed: false },
  };
}

const sameBuilding = (a, b) => Boolean(a && b) && a.numSlic === b.numSlic && a.alphaSlic === b.alphaSlic;

// Saves the building a driver picked or typed (`source: 'asked'`), from the
// /home card or Change on /profile. → { homeBase } or { error }.
export async function saveAskedHomeBase(userId, input) {
  const { building, error } = await resolveBuilding(input);
  if (error) return { error };
  const homeBase = { ...building, source: 'asked', at: new Date() };
  await users().updateOne({ _id: toObjectId(userId) }, { $set: { homeBase } });
  return { homeBase };
}

// A verified driver or staff asks to change theirs (homeBaseIsFixed): the
// pick waits as `users.homeBaseRequest` for an admin, and `homeBase` stays as
// it is. One at a time; a new one replaces it. → { request } or { error }.
export async function requestHomeBaseChange(userId, input) {
  const { building, error } = await resolveBuilding(input);
  if (error) return { error };
  const _id = toObjectId(userId);
  const user = await users().findOne({ _id }, { projection: { homeBase: 1 } });
  if (sameBuilding(user?.homeBase, building)) return { error: "That's already your building." };
  const request = { ...building, at: new Date() };
  await users().updateOne({ _id }, { $set: { homeBaseRequest: request } });
  return { request };
}

// The driver takes their request back.
export async function cancelHomeBaseRequest(userId) {
  await users().updateOne({ _id: toObjectId(userId) }, { $unset: { homeBaseRequest: '' } });
}

async function loadTarget(targetId) {
  if (!ObjectId.isValid(targetId)) return { error: 'Invalid user id', status: 400 };
  const target = await users().findOne(
    { _id: new ObjectId(targetId) },
    { projection: { name: 1, homeBase: 1, homeBaseRequest: 1 } },
  );
  return target ? { target } : { error: 'User not found', status: 404 };
}

// An admin sets an account's building on /admin/users/[id] (`source:
// 'admin'`), which also settles a request waiting on it. Written to
// `admin_audit` first. → { user: { homeBase, homeBaseRequest } } or
// { error, status }.
export async function setHomeBaseByAdmin(targetId, input, actor) {
  const loaded = await loadTarget(targetId);
  if (loaded.error) return loaded;
  const { target } = loaded;
  const { building, error } = await resolveBuilding(input);
  if (error) return { error, status: 400 };

  await recordAdminAction({
    actor,
    action: 'user.homeBase',
    targetType: 'user',
    targetId,
    targetName: target.name,
    from: target.homeBase ? homeBaseLabel(target.homeBase) : null,
    to: homeBaseLabel(building),
  });
  const homeBase = { ...building, source: 'admin', at: new Date() };
  await users().updateOne({ _id: target._id }, { $set: { homeBase }, $unset: { homeBaseRequest: '' } });
  return { user: { homeBase, homeBaseRequest: null } };
}

// An admin decides a request: approve makes it the account's building
// (`source: 'admin'`), decline drops it. Written to `admin_audit` first.
// → { user: { homeBase, homeBaseRequest } } or { error, status }.
export async function decideHomeBaseRequest(targetId, approve, actor) {
  const loaded = await loadTarget(targetId);
  if (loaded.error) return loaded;
  const { target } = loaded;
  const request = target.homeBaseRequest;
  if (!request) return { error: 'There is no request waiting.', status: 409 };

  await recordAdminAction({
    actor,
    action: approve ? 'user.homeBaseRequestApproved' : 'user.homeBaseRequestDeclined',
    targetType: 'user',
    targetId,
    targetName: target.name,
    from: target.homeBase ? homeBaseLabel(target.homeBase) : null,
    to: homeBaseLabel(request),
  });
  if (!approve) {
    await users().updateOne({ _id: target._id }, { $unset: { homeBaseRequest: '' } });
    return { user: { homeBase: target.homeBase ?? null, homeBaseRequest: null } };
  }
  const { at, ...building } = request;
  const homeBase = { ...building, source: 'admin', at: new Date() };
  await users().updateOne({ _id: target._id }, { $set: { homeBase }, $unset: { homeBaseRequest: '' } });
  return { user: { homeBase, homeBaseRequest: null } };
}

// How many requests wait for an admin, for the header-menu badge
// (/api/admin-alerts) and the /admin banner.
export async function countHomeBaseRequests() {
  return users().countDocuments({ homeBaseRequest: { $exists: true } });
}

