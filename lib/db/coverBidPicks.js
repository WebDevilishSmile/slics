import client from '@/lib/db/client';
import { flattenPick } from '@/lib/coverSheetParser';
import { diffByKey } from '@/lib/sheetDiff';

// The pick section of a week's cover tab (docs/ON-CALL-SHEET-SYNC.md).
//
// `cover-bid-picks`: one doc per week, the picks as of the last refresh:
//   { weekEnding, rows: [{ slot, name, order, job, picks: [7] }], sheetTab,
//     refreshed_at, refreshedBy: { id, name } }
// `cover-bid-pick-events`: one row per field that changed between refreshes:
//   { weekEnding, name, field: 'added'|'removed'|'slot'|'order'|'job'|'pick1'…,
//     from, to, seenAt }
// A week's first refresh records no events: there's nothing to compare it to.

const PICKS = 'cover-bid-picks';
const EVENTS = 'cover-bid-pick-events';

const keyOf = (row) => row.name.toUpperCase();

export async function getCoverBidPicks(weekEnding) {
  const db = client.db();
  return db.collection(PICKS).findOne({ weekEnding });
}

export async function getCoverBidPickEvents(weekEnding, limit = 100) {
  const db = client.db();
  return db
    .collection(EVENTS)
    .find({ weekEnding })
    .sort({ seenAt: -1, _id: -1 })
    .limit(limit)
    .toArray();
}

// Saves the week's picks and records what changed. Returns the number of
// change events written.
export async function saveCoverBidPicks({ weekEnding, rows, sheetTab, user }) {
  try {
    const db = client.db();
    const previous = await db.collection(PICKS).findOne({ weekEnding });
    const now = new Date().toISOString();

    let events = [];
    if (previous) {
      const { added, removed, changed } = diffByKey(previous.rows, rows, {
        keyOf,
        flatten: flattenPick,
      });
      const nameOf = (key) => key.replace(/#\d+$/, '');
      events = [
        ...added.map(({ row }) => ({ name: row.name, field: 'added', from: '', to: '' })),
        ...removed.map(({ row }) => ({ name: row.name, field: 'removed', from: '', to: '' })),
        ...changed.map(({ key, field, from, to }) => ({
          name: rows.find((row) => keyOf(row) === nameOf(key))?.name ?? nameOf(key),
          field,
          from,
          to,
        })),
      ].map((event) => ({ weekEnding, ...event, seenAt: now }));
    }

    if (events.length > 0) {
      await db.collection(EVENTS).insertMany(events);
    }

    await db.collection(PICKS).updateOne(
      { weekEnding },
      {
        $set: {
          rows,
          sheetTab,
          refreshed_at: now,
          refreshedBy: user ? { id: user.id ?? null, name: user.name ?? null } : null,
        },
        $setOnInsert: { weekEnding, created_at: now },
      },
      { upsert: true }
    );

    return { events: events.length, firstRefresh: !previous };
  } catch (error) {
    console.error('Error saving cover bid picks:', error);
    throw error;
  }
}

export function serializeCoverBidPicks(doc) {
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() };
}

export function serializeCoverBidPickEvents(events) {
  return events.map((event) => ({ ...event, _id: event._id.toString() }));
}
