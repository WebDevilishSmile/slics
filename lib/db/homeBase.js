import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';
import { betpaHomeBase } from '@/lib/homeBase';

// `users.homeBase`, the building a driver starts from (docs/MULTI-HUB.md
// "Home base"; the shape is in lib/homeBase.js).

// Fills in BETPA for an account the app has just placed there: a driver an
// admin verified ('sheet', setUserDriver) or a promotion to staff ('staff',
// setUserRole). Only where there's no home base yet, so an answer the driver
// gave or an admin set is never overwritten. Never throws: a home base is a
// census answer, not worth failing a verification or a promotion over.
export async function fillBetpaHomeBase(userId, source) {
  try {
    const _id = userId instanceof ObjectId ? userId : new ObjectId(String(userId));
    await client
      .db()
      .collection('users')
      .updateOne({ _id, homeBase: { $exists: false } }, { $set: { homeBase: betpaHomeBase(source) } });
  } catch (error) {
    console.error('Error filling in a home base:', error);
  }
}
