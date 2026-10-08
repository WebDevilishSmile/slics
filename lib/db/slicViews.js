import { ObjectId } from 'mongodb';
import client from '@/lib/db/client';
import { getAllSlics } from '@/lib/db/slics';

const VIEWS_COLLECTION = 'slicViews';

// One row per lookup: `{ userId: ObjectId, numSlic, viewedAt: Date }`, written
// by /api/users/me/track-view. Two optional fields belong to the member History
// page: `note` (+ `noteUpdatedAt`), a private note on that one lookup, and
// `hidden: true` (+ `hiddenAt`) once the driver removes it from their history.
// Hidden rows stay in the collection on purpose: the /home lookup counter
// counts every row, and account deletion removes them all.
export const HISTORY_NOTE_MAX = 280;
export const HISTORY_PAGE_SIZE = 50;

// A lookup of the SLIC the driver looked up last, within this window, is the
// same lookup coming back: phones reload a backgrounded page (iOS does when
// the driver switches to Maps), and /home?slic= then reports it again.
export const REPEAT_LOOKUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Records a lookup unless it repeats the driver's latest one (see
 * REPEAT_LOOKUP_WINDOW_MS); a different SLIC in between makes it a new
 * lookup. Returns `{ recorded, total }`, `total` being the driver's lifetime
 * lookup count, the /home counter.
 */
export async function recordSlicView(userId, numSlic) {
  const views = client.db().collection(VIEWS_COLLECTION);
  const user = new ObjectId(userId);

  // Backed by the { userId, viewedAt } index (scripts/createIndexes.js).
  const latest = await views.findOne(
    { userId: user },
    { sort: { viewedAt: -1 }, projection: { numSlic: 1, viewedAt: 1 } },
  );
  const repeat =
    latest &&
    String(latest.numSlic) === String(numSlic) &&
    Date.now() - new Date(latest.viewedAt).getTime() < REPEAT_LOOKUP_WINDOW_MS;

  if (!repeat) {
    await views.insertOne({ userId: user, numSlic, viewedAt: new Date() });
  }

  const total = await views.countDocuments({ userId: user });
  return { recorded: !repeat, total };
}

export async function getSlicViewsByUserId(userId) {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const db = client.db();
    const views = await db
      .collection(VIEWS_COLLECTION)
      .find({ userId: new ObjectId(userId) })
      .sort({ viewedAt: -1 })
      .toArray();

    return views;
  } catch (error) {
    console.error('Error fetching slic views by user ID:', error);
    throw error;
  }
}

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseInstant = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

// Cursors are `<viewedAt ISO>_<_id>` of the last row on the previous page.
const encodeCursor = (view) =>
  `${new Date(view.viewedAt).toISOString()}_${view._id}`;
const decodeCursor = (cursor) => {
  const [at, id] = String(cursor).split('_');
  const viewedAt = parseInstant(at);
  if (!viewedAt || !ObjectId.isValid(id)) return null;
  return { viewedAt, id: new ObjectId(id) };
};

/**
 * Reads the History page's filters from URL search params (the page and
 * GET /api/users/me/history share this). `from`/`to` are ISO instants computed in
 * the browser, so "today" is the driver's own day. Returns `{ filters }` or
 * `{ error }` with a message for a 400.
 */
export function parseHistoryQuery(params) {
  const get = (key) => {
    const value = typeof params.get === 'function' ? params.get(key) : params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const from = parseInstant(get('from'));
  const to = parseInstant(get('to'));
  if (from === undefined || to === undefined) {
    return { error: 'Invalid date range.' };
  }

  const sort = get('sort') || 'newest';
  if (!['newest', 'oldest'].includes(sort)) {
    return { error: 'Invalid sort.' };
  }

  const type = get('type') || null;
  if (type && !['center', 'customer'].includes(type)) {
    return { error: 'Invalid SLIC type.' };
  }

  let cursor = null;
  if (get('cursor')) {
    cursor = decodeCursor(get('cursor'));
    if (!cursor) return { error: 'Invalid cursor.' };
  }

  return {
    filters: {
      q: (get('q') || '').trim().slice(0, 100),
      from,
      to,
      type,
      hasNote: get('notes') === '1',
      sort,
      cursor,
    },
  };
}

const slicMatches = (slic, needle) =>
  [
    slic.numSlic,
    slic.alphaSlic,
    slic.name,
    slic.address?.street,
    slic.address?.city,
    slic.address?.state,
    slic.address?.zip,
  ].some((field) => field && String(field).toLowerCase().includes(needle));

/**
 * One page of a driver's visible history, newest (or oldest) first, with each
 * row's SLIC joined in. Search covers the SLIC's code, name and address (via
 * the slics collection) and the row's note. Paging is by cursor, not skip, so
 * removing a row mid-scroll can't shift the next page.
 *
 * Returns `{ views, nextCursor, total }`; rows never carry `userId`.
 */
export async function getHistoryPage(userId, filters, limit = HISTORY_PAGE_SIZE) {
  const { q, from, to, type, hasNote, sort, cursor } = filters;
  const db = client.db();
  const slics = await getAllSlics();
  const slicByNum = new Map(slics.map((slic) => [slic.numSlic, slic]));

  const and = [{ userId: new ObjectId(userId) }, { hidden: { $ne: true } }];

  if (from || to) {
    and.push({
      viewedAt: { ...(from && { $gte: from }), ...(to && { $lt: to }) },
    });
  }

  if (type) {
    // A slic without a `type` is a center, as in home/SlicsSearch.jsx.
    const ofType = slics
      .filter((slic) => (slic.type || 'center') === type)
      .map((slic) => slic.numSlic);
    and.push({ numSlic: { $in: ofType } });
  }

  if (q) {
    const needle = q.toLowerCase();
    const matching = slics
      .filter((slic) => slicMatches(slic, needle))
      .map((slic) => slic.numSlic);
    and.push({
      $or: [
        { numSlic: { $in: matching } },
        { note: { $regex: escapeRegex(q), $options: 'i' } },
      ],
    });
  }

  if (hasNote) and.push({ note: { $exists: true } });

  const base = { $and: and };
  const direction = sort === 'oldest' ? 1 : -1;
  const op = direction === 1 ? '$gt' : '$lt';
  const query = cursor
    ? {
        $and: [
          ...and,
          {
            $or: [
              { viewedAt: { [op]: cursor.viewedAt } },
              { viewedAt: cursor.viewedAt, _id: { [op]: cursor.id } },
            ],
          },
        ],
      }
    : base;

  const collection = db.collection(VIEWS_COLLECTION);
  const [rows, total] = await Promise.all([
    collection
      .find(query)
      .sort({ viewedAt: direction, _id: direction })
      .limit(limit + 1)
      .toArray(),
    collection.countDocuments(base),
  ]);

  const page = rows.slice(0, limit);
  const views = page.map((view) => {
    const slic = slicByNum.get(view.numSlic);
    return {
      id: view._id.toString(),
      numSlic: view.numSlic,
      viewedAt: new Date(view.viewedAt).toISOString(),
      note: view.note || null,
      slic: slic
        ? { alphaSlic: slic.alphaSlic, name: slic.name || null, type: slic.type || 'center' }
        : null,
    };
  });

  return {
    views,
    nextCursor: rows.length > limit ? encodeCursor(page[page.length - 1]) : null,
    total,
  };
}

// Ownership is part of the filter, so a driver can only touch their own rows.
// Both return null when no visible row of theirs matched (the route's 404).
export async function updateHistoryNote(userId, viewId, note) {
  const text = (note || '').trim();
  const update = text
    ? { $set: { note: text, noteUpdatedAt: new Date().toISOString() } }
    : { $unset: { note: '', noteUpdatedAt: '' } };

  const db = client.db();
  const result = await db.collection(VIEWS_COLLECTION).updateOne(
    {
      _id: new ObjectId(viewId),
      userId: new ObjectId(userId),
      hidden: { $ne: true },
    },
    update,
  );
  return result.matchedCount ? { note: text || null } : null;
}

export async function setHistoryHidden(userId, viewId, hidden) {
  const update = hidden
    ? { $set: { hidden: true, hiddenAt: new Date().toISOString() } }
    : { $unset: { hidden: '', hiddenAt: '' } };

  const db = client.db();
  const result = await db
    .collection(VIEWS_COLLECTION)
    .updateOne(
      { _id: new ObjectId(viewId), userId: new ObjectId(userId) },
      update,
    );
  return result.matchedCount ? { hidden: Boolean(hidden) } : null;
}
