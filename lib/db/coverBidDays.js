import client from '@/lib/db/client';
import { addDays, defaultBidDate, isDate } from '@/lib/bidDay';
import { isSaturday } from '@/lib/onCallSheet';
import { recordAdminAction } from '@/lib/db/adminAudit';

// Cover weeks whose bid day an admin moved off the usual Thursday
// (lib/bidDay.js, docs/COVER-BIDDING.md "Bid day"), for a holiday.
//
// `cover-bid-days`: one doc per moved week:
//   { weekEnding (unique), bidDate, setBy: { id, name }, at }
// A week with no doc is bid on defaultBidDate. Moving it back to the usual
// Thursday deletes the doc. Changing one writes `admin_audit` first.

const BID_DAYS = 'cover-bid-days';

// How early a bid day may be: four weeks before the week starts.
const EARLIEST_DAYS_BEFORE = 35;

// { weekEnding: bidDate } for every moved week from `weekEndingFrom` on (all
// of them without it). weekEnding is a zero-padded 'YYYY-MM-DD', so $gte
// compares dates.
export async function getBidDayOverrides(weekEndingFrom) {
  const docs = await client
    .db()
    .collection(BID_DAYS)
    .find(weekEndingFrom ? { weekEnding: { $gte: weekEndingFrom } } : {}, {
      projection: { weekEnding: 1, bidDate: 1 },
    })
    .toArray();
  return Object.fromEntries(docs.map((doc) => [doc.weekEnding, doc.bidDate]));
}

// One week's bid day as the admin page shows it: { weekEnding, bidDate,
// usual, moved, setBy, at }.
export async function getBidDay(weekEnding) {
  const doc = await client.db().collection(BID_DAYS).findOne({ weekEnding });
  const usual = defaultBidDate(weekEnding);
  return {
    weekEnding,
    bidDate: doc?.bidDate ?? usual,
    usual,
    moved: Boolean(doc),
    setBy: doc?.setBy ?? null,
    at: doc?.at ?? null,
  };
}

// The body of PUT /api/cover-bid-days → { weekEnding, bidDate } (bidDate null
// to go back to the usual Thursday), or { error }. A bid day falls before
// the week starts (its Sunday) and no more than four weeks before that.
export function validateBidDay(body) {
  const weekEnding = body?.weekEnding;
  if (!isSaturday(weekEnding)) return { error: 'Pick a week ending on a Saturday.' };
  const bidDate = body?.bidDate ?? null;
  if (bidDate === null) return { weekEnding, bidDate: null };
  if (!isDate(bidDate)) return { error: 'Pick a bid day.' };
  if (bidDate > addDays(weekEnding, -7)) {
    return { error: 'The bid day has to be before the week starts.' };
  }
  if (bidDate < addDays(weekEnding, -EARLIEST_DAYS_BEFORE)) {
    return { error: 'The bid day can be at most four weeks before the week starts.' };
  }
  return { weekEnding, bidDate };
}

// Moves a week's bid day, or back to the usual Thursday (`bidDate` null or
// the usual day). `actor` is the session's user. → the week's bid day
// (getBidDay).
export async function setBidDay({ weekEnding, bidDate }, actor) {
  const usual = defaultBidDate(weekEnding);
  const next = bidDate && bidDate !== usual ? bidDate : null;
  const collection = client.db().collection(BID_DAYS);
  const current = await collection.findOne({ weekEnding });
  if ((current?.bidDate ?? null) === next) return getBidDay(weekEnding);

  await recordAdminAction({
    actor,
    action: next ? 'coverBidDay.set' : 'coverBidDay.reset',
    targetType: 'coverWeek',
    targetId: weekEnding,
    from: current?.bidDate ?? usual,
    to: next ?? usual,
  });
  if (next) {
    await collection.updateOne(
      { weekEnding },
      {
        $set: {
          bidDate: next,
          setBy: { id: actor?.id ?? null, name: actor?.name ?? null },
          at: new Date().toISOString(),
        },
        $setOnInsert: { weekEnding },
      },
      { upsert: true },
    );
  } else {
    await collection.deleteOne({ weekEnding });
  }
  return getBidDay(weekEnding);
}
