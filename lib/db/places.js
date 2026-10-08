import client from '@/lib/db/client';
import { ObjectId } from 'mongodb';
import { isValidLatLng } from '@/lib/geo';
import {
  PLACE_CATEGORIES,
  PLACE_COMMENT_MAX_LENGTH,
  TRAILER_ACCESS,
} from '@/constants';

// Data access for Whip It In & Out (/whip-it-in-and-out): places along routes
// that any signed-in driver can add (fuel, food, restrooms, …), and a comment
// thread on each with one level of replies and thumbs up/down.
//
// Rules that live here rather than in the routes:
// - A top-level comment that still has replies is soft-deleted (shown as
//   "Comment deleted") so the replies keep their context; anything else is
//   removed. Removing the last reply under a placeholder removes it too.
// - What goes to the client is shaped here: first name + avatar for authors,
//   vote counts plus the viewer's own vote, and "is this mine" flags — never
//   another driver's user id.
//
// The write functions take the output of validatePlace / validatePlaceComment;
// the API routes validate first so a bad request is a 400, not a thrown error.

const MAX_LENGTHS = {
  name: 100,
  street: 120,
  city: 60,
  state: 20,
  zip: 10,
  phone: 20,
  hours: 120,
};
const MAX_SLIC_TAGS = 50;

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Normalizes a place from a request body. Returns `{ place }` or `{ error }`
// with a message fit to show the driver. Every field is replaced, so PATCH
// takes the whole place (the edit form always sends every field).
export function validatePlace(input) {
  if (!input || typeof input !== 'object') {
    return { error: 'Invalid place data.' };
  }

  const address = input.address || {};
  const open24h = input.open24h === true;
  const place = {
    name: cleanText(input.name),
    categories: [],
    trailerAccess: input.trailerAccess ?? 'unknown',
    address: {
      street: cleanText(address.street),
      city: cleanText(address.city),
      state: cleanText(address.state).toUpperCase(),
      zip: cleanText(address.zip),
    },
    phone: cleanText(input.phone),
    open24h,
    hours: open24h ? '' : cleanText(input.hours),
    parking: null,
    slics: [],
  };

  if (!place.name || !place.address.city || !place.address.state) {
    return { error: 'Name, city and state are required.' };
  }

  const lengths = {
    name: place.name,
    street: place.address.street,
    city: place.address.city,
    state: place.address.state,
    zip: place.address.zip,
    phone: place.phone,
    hours: place.hours,
  };
  for (const [field, value] of Object.entries(lengths)) {
    if (value.length > MAX_LENGTHS[field]) {
      return {
        error: `${field[0].toUpperCase()}${field.slice(1)} must be ${MAX_LENGTHS[field]} characters or fewer.`,
      };
    }
  }

  if (!Array.isArray(input.categories)) {
    return { error: 'Pick at least one category.' };
  }
  const categories = [...new Set(input.categories)];
  if (
    categories.some(
      (category) => !PLACE_CATEGORIES.some(({ value }) => value === category),
    )
  ) {
    return { error: 'Unknown category.' };
  }
  if (categories.length === 0) return { error: 'Pick at least one category.' };
  place.categories = categories;

  if (!TRAILER_ACCESS.some(({ value }) => value === place.trailerAccess)) {
    return { error: 'Unknown trailer access.' };
  }

  if (input.parking != null) {
    const parking = { lat: input.parking.lat, lng: input.parking.lng };
    if (!isValidLatLng(parking)) {
      return { error: 'The parking pin is not a valid latitude/longitude.' };
    }
    place.parking = parking;
  }

  // Rest areas have no street address; a pin is enough to navigate by.
  if (!place.address.street && !place.parking) {
    return {
      error: 'Add a street address or a parking pin so drivers can find it.',
    };
  }

  if (input.slics != null) {
    if (!Array.isArray(input.slics)) return { error: 'Invalid SLIC tags.' };
    const slics = [...new Set(input.slics.map((slic) => String(slic).trim()))];
    if (slics.some((slic) => !/^\d+$/.test(slic))) {
      return { error: 'SLIC tags must be numeric SLICs.' };
    }
    if (slics.length > MAX_SLIC_TAGS) {
      return { error: `Tag at most ${MAX_SLIC_TAGS} SLICs.` };
    }
    place.slics = slics;
  }

  return { place };
}

export function validatePlaceComment(content) {
  const text = cleanText(content);
  if (!text) return { error: "Comment can't be empty." };
  if (text.length > PLACE_COMMENT_MAX_LENGTH) {
    return {
      error: `Comments must be ${PLACE_COMMENT_MAX_LENGTH} characters or fewer.`,
    };
  }
  return { content: text };
}

// `userId` strings → `{ firstName, image }`, in one query. Users are keyed by
// ObjectId while comments store the id as a string (like SLIC comments), so
// this converts in JS rather than with $toObjectId in a $lookup.
async function getAuthors(db, userIds) {
  const ids = [
    ...new Set(userIds.filter((id) => id && ObjectId.isValid(id))),
  ];
  if (ids.length === 0) return new Map();

  const users = await db
    .collection('users')
    .find(
      { _id: { $in: ids.map((id) => new ObjectId(id)) } },
      { projection: { name: 1, image: 1 } },
    )
    .toArray();

  return new Map(
    users.map((user) => [
      user._id.toString(),
      {
        firstName: user.name?.split(' ').at(0) || 'Driver',
        image: user.image || null,
      },
    ]),
  );
}

// Every place, ordered by state, city, name, shaped for the page: string
// `_id`, a live comment count, the adder's first name (null once their
// account is gone) and whether the viewer added it.
export async function getPlaces(viewerId) {
  try {
    const db = client.db();
    const [places, counts] = await Promise.all([
      db
        .collection('places')
        .find({})
        .sort({ 'address.state': 1, 'address.city': 1, name: 1 })
        .toArray(),
      db
        .collection('placeComments')
        .aggregate([
          { $match: { deleted: { $ne: true } } },
          { $group: { _id: '$placeId', count: { $sum: 1 } } },
        ])
        .toArray(),
    ]);

    const countByPlace = new Map(
      counts.map(({ _id, count }) => [_id.toString(), count]),
    );
    const authors = await getAuthors(
      db,
      places.map((place) => place.createdBy),
    );

    return places.map(({ _id, createdBy, updatedBy, ...place }) => ({
      ...place,
      _id: _id.toString(),
      addedByMe: Boolean(viewerId) && createdBy === viewerId,
      creatorName: authors.get(createdBy)?.firstName ?? null,
      commentCount: countByPlace.get(_id.toString()) ?? 0,
    }));
  } catch (error) {
    console.error('Error fetching places:', error);
    throw error;
  }
}

export async function getPlaceById(placeId) {
  return client
    .db()
    .collection('places')
    .findOne({ _id: new ObjectId(placeId) });
}

export async function createPlace(place, user) {
  const result = await client
    .db()
    .collection('places')
    .insertOne({
      ...place,
      createdBy: user.id,
      created_at: new Date().toISOString(),
      updated_at: null,
      updatedBy: null,
    });
  return result.insertedId;
}

// Returns false when no place has that id.
export async function updatePlace(placeId, place, user) {
  const result = await client
    .db()
    .collection('places')
    .updateOne(
      { _id: new ObjectId(placeId) },
      {
        $set: {
          ...place,
          updated_at: new Date().toISOString(),
          updatedBy: user.id,
        },
      },
    );
  return result.matchedCount > 0;
}

// Live comments on a place written by anyone other than `userId`. The driver
// who added a place may delete it only while this is zero — otherwise it
// takes other drivers' comments with it, and that's an admin call.
export async function countOtherDriversComments(placeId, userId) {
  return client
    .db()
    .collection('placeComments')
    .countDocuments({
      placeId: new ObjectId(placeId),
      deleted: { $ne: true },
      userId: { $ne: userId },
    });
}

// Deletes the place first: if the comment cleanup then fails, the leftovers
// are unreachable orphans rather than comments lost from a live place.
export async function deletePlace(placeId) {
  const db = client.db();
  const _id = new ObjectId(placeId);

  const result = await db.collection('places').deleteOne({ _id });
  if (result.deletedCount === 0) return false;

  await db.collection('placeComments').deleteMany({ placeId: _id });
  return true;
}

// The thread for one place, as the viewer sees it: top-level comments by
// score (up − down) then newest, each with its replies oldest-first.
export async function getPlaceThread(placeId, viewerId) {
  const db = client.db();
  const comments = await db
    .collection('placeComments')
    .find({ placeId: new ObjectId(placeId) })
    .toArray();
  const authors = await getAuthors(
    db,
    comments.map((comment) => comment.userId),
  );

  const shape = (comment) => {
    const upVotes = comment.upVotes || [];
    const downVotes = comment.downVotes || [];
    return {
      _id: comment._id.toString(),
      parentId: comment.parentId ? comment.parentId.toString() : null,
      author: comment.userId ? (authors.get(comment.userId) ?? null) : null,
      isMine: Boolean(viewerId) && comment.userId === viewerId,
      content: comment.deleted ? '' : comment.content,
      deleted: Boolean(comment.deleted),
      upCount: upVotes.length,
      downCount: downVotes.length,
      myVote: upVotes.includes(viewerId)
        ? 'up'
        : downVotes.includes(viewerId)
          ? 'down'
          : null,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
    };
  };

  const topLevel = [];
  const repliesByParent = new Map();
  for (const comment of comments.map(shape)) {
    if (!comment.parentId) {
      topLevel.push(comment);
      continue;
    }
    if (!repliesByParent.has(comment.parentId)) {
      repliesByParent.set(comment.parentId, []);
    }
    repliesByParent.get(comment.parentId).push(comment);
  }

  // ISO strings sort chronologically as plain strings.
  const score = (comment) => comment.upCount - comment.downCount;
  topLevel.sort(
    (a, b) => score(b) - score(a) || b.created_at.localeCompare(a.created_at),
  );
  return topLevel.map((comment) => ({
    ...comment,
    replies: (repliesByParent.get(comment._id) ?? []).sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    ),
  }));
}

// A live (not soft-deleted) comment, or null.
export async function getPlaceCommentById(commentId) {
  return client
    .db()
    .collection('placeComments')
    .findOne({ _id: new ObjectId(commentId), deleted: { $ne: true } });
}

// Returns `{ id }`, or `{ notFound: 'place' | 'parent' }`. A reply to a reply
// is stored under that reply's top-level comment, so threads stay one level.
export async function addPlaceComment({ placeId, parentId, content, user }) {
  const db = client.db();
  const placeObjectId = new ObjectId(placeId);

  const place = await db
    .collection('places')
    .findOne({ _id: placeObjectId }, { projection: { _id: 1 } });
  if (!place) return { notFound: 'place' };

  let threadId = null;
  if (parentId) {
    const parent = await db
      .collection('placeComments')
      .findOne(
        { _id: new ObjectId(parentId), placeId: placeObjectId },
        { projection: { parentId: 1 } },
      );
    if (!parent) return { notFound: 'parent' };
    threadId = parent.parentId ?? parent._id;
  }

  const result = await db.collection('placeComments').insertOne({
    placeId: placeObjectId,
    parentId: threadId,
    userId: user.id,
    content,
    upVotes: [],
    downVotes: [],
    deleted: false,
    created_at: new Date().toISOString(),
    updated_at: null,
  });
  return { id: result.insertedId };
}

export async function updatePlaceComment(commentId, content) {
  const result = await client
    .db()
    .collection('placeComments')
    .updateOne(
      { _id: new ObjectId(commentId), deleted: { $ne: true } },
      { $set: { content, updated_at: new Date().toISOString() } },
    );
  return result.matchedCount > 0;
}

// Takes the comment document (the route has already loaded it to check who
// owns it). Returns 'soft-deleted' or 'deleted'.
export async function deletePlaceComment(comment) {
  const comments = client.db().collection('placeComments');

  if (!comment.parentId) {
    const replies = await comments.countDocuments({
      placeId: comment.placeId,
      parentId: comment._id,
    });
    if (replies > 0) {
      await comments.updateOne(
        { _id: comment._id },
        {
          $set: {
            deleted: true,
            content: '',
            userId: null,
            upVotes: [],
            downVotes: [],
            updated_at: new Date().toISOString(),
          },
        },
      );
      return 'soft-deleted';
    }
    await comments.deleteOne({ _id: comment._id });
    return 'deleted';
  }

  await comments.deleteOne({ _id: comment._id });
  // That may have been the last reply holding up a "Comment deleted" placeholder.
  const placeholder = await comments.findOne({
    _id: comment.parentId,
    deleted: true,
  });
  if (
    placeholder &&
    (await comments.countDocuments({
      placeId: comment.placeId,
      parentId: placeholder._id,
    })) === 0
  ) {
    await comments.deleteOne({ _id: placeholder._id });
  }
  return 'deleted';
}

// Same shape as the SLIC comment vote: one vote per driver per comment.
// 'up' or 'down' sets it (moving it off the other side); null clears it,
// which is how tapping your own vote again takes it back. Returns false for
// a missing or deleted comment.
export async function votePlaceComment(commentId, voteType, userId) {
  const update =
    voteType === null
      ? { $pull: { upVotes: userId, downVotes: userId } }
      : {
          $addToSet: { [voteType === 'up' ? 'upVotes' : 'downVotes']: userId },
          $pull: { [voteType === 'up' ? 'downVotes' : 'upVotes']: userId },
        };
  const result = await client
    .db()
    .collection('placeComments')
    .updateOne({ _id: new ObjectId(commentId), deleted: { $ne: true } }, update);
  return result.matchedCount > 0;
}

// Account deletion (usersApi.deleteUserAccount). The driver's comments go —
// or become placeholders where others replied — their votes are pulled, and
// places they added stay as shared knowledge with no name attached.
export async function deleteUserPlaceData(userId) {
  const db = client.db();
  const comments = db.collection('placeComments');

  const mine = await comments.find({ userId }).toArray();
  // Replies first, so a top-level comment's reply count afterwards only
  // counts other drivers' replies.
  const ordered = [
    ...mine.filter((comment) => comment.parentId),
    ...mine.filter((comment) => !comment.parentId),
  ];
  let deletedPlaceComments = 0;
  let placeholderPlaceComments = 0;
  for (const comment of ordered) {
    const outcome = await deletePlaceComment(comment);
    if (outcome === 'soft-deleted') placeholderPlaceComments += 1;
    else deletedPlaceComments += 1;
  }

  const votes = await comments.updateMany(
    { $or: [{ upVotes: userId }, { downVotes: userId }] },
    { $pull: { upVotes: userId, downVotes: userId } },
  );
  const places = await db
    .collection('places')
    .updateMany({ createdBy: userId }, { $set: { createdBy: null } });
  await db
    .collection('places')
    .updateMany({ updatedBy: userId }, { $set: { updatedBy: null } });

  return {
    deletedPlaceComments,
    placeholderPlaceComments,
    placeVotesPulled: votes.modifiedCount,
    placesUnattributed: places.modifiedCount,
  };
}
