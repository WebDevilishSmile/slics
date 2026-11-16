import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';
import { DEFAULT_HUB } from '@/lib/hubScope';
import {
  betpaHomeBase,
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

// Saves the building a driver picked or typed (`source: 'asked'`). The server
// decides `listed`: the All Hubs list has that number with that alpha code,
// and then its name is the list's town (BETPA's is "Bethlehem Center"). One
// it doesn't have keeps the driver's own name for it and waits for the super
// admin (MULTI-HUB.md "Home base", step 4). `input` is validated already
// (validateHomeBaseInput). → the saved home base, or { error } for a
// building that isn't listed and has no name.
export async function saveAskedHomeBase(userId, input) {
  const { numSlic, alphaSlic, name } = input;
  const listedRow = await client
    .db()
    .collection('allHubs')
    .findOne(
      { alphaSlic, numSlic: { $in: [numSlic, Number(numSlic)] } },
      { projection: { 'address.city': 1, 'address.state': 1 } },
    );
  if (!listedRow && !name) {
    return { error: "Add the building's name or town, so we can check it." };
  }
  const homeBase = {
    numSlic,
    alphaSlic,
    name: listedRow
      ? isDefaultHub(numSlic, alphaSlic)
        ? DEFAULT_HUB.name
        : hubTown(listedRow.address?.city, listedRow.address?.state)
      : name,
    source: 'asked',
    listed: Boolean(listedRow),
    at: new Date(),
  };
  await users().updateOne({ _id: toObjectId(userId) }, { $set: { homeBase } });
  return { homeBase };
}
