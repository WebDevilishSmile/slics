import client from '@/lib/db/client';
import { ObjectId } from 'mongodb';
import { isValidLatLng } from '@/utils/geo';
import { SLIC_COMMENT_MAX_LENGTH } from '@/constants';

// SLIC comments ("driver tips"), one document per comment or reply:
// `{ numSlic, userId (string), content, upVotes: [userId], downVotes: [userId],
// created_at }`. Fields added with threads and plain text (all optional, so
// older documents read as before):
// - `parentId`: the top-level comment a reply belongs to. Threads are one
//   level deep; a reply to a reply is filed under the same top-level comment.
//   Replies keep `numSlic`, so per-SLIC counts and the profile list include them.
// - `format: 'text'`: plain text. Comments without it are Tiptap HTML from
//   before 2026-10-07 and still render as HTML.
// - `updated_at`: set on edit.
// - `pin: { lat, lng }`: a spot the tip points at (a gate, a dock, where to
//   park), pasted from Google Maps or taken from GPS. Since 2026-10-08. A
//   comment with a pin may have empty `content`.
// - `deleted: true`: a top-level comment removed while it still has replies.
//   It stays as a "Comment deleted" placeholder (empty content, no author) and
//   goes once its last reply does. Every read below skips it except the thread.

const comments = () => client.db().collection('comments');
const LIVE = { deleted: { $ne: true } };

// Trims, normalizes line endings and enforces the length limit. A tip with a
// pin may have no text (`allowEmpty`): the pin is the tip. Returns
// `{ content }` or `{ error }` with a message for a 400.
export function validateSlicComment(value, { allowEmpty = false } = {}) {
  const text = typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : '';
  if (!text) {
    return allowEmpty ? { content: '' } : { error: 'Write a tip or add a pin.' };
  }
  if (text.length > SLIC_COMMENT_MAX_LENGTH) {
    return {
      error: `Comments must be ${SLIC_COMMENT_MAX_LENGTH} characters or fewer.`,
    };
  }
  return { content: text };
}

// A comment's pin from a request body. `undefined` leaves an existing pin as
// it is (an edit that doesn't mention it), null removes it. Returns `{ pin }`
// or `{ error }` with a message for a 400.
export function validateCommentPin(value) {
  if (value === undefined || value === null) return { pin: value };
  const pin = { lat: value.lat, lng: value.lng };
  if (!isValidLatLng(pin)) return { error: "The pin isn't a valid location." };
  return {
    pin: { lat: Number(pin.lat.toFixed(6)), lng: Number(pin.lng.toFixed(6)) },
  };
}

// `userId` strings → `{ firstName, image }`, in one query (comments store the
// id as a string, users are keyed by ObjectId).
async function getAuthors(userIds) {
  const ids = [...new Set(userIds.filter((id) => id && ObjectId.isValid(id)))];
  if (ids.length === 0) return new Map();
  const users = await client
    .db()
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

/**
 * The tips for one SLIC as the viewer sees them: top-level comments by score
 * (up − down) then newest, each with its replies oldest-first. Rows carry the
 * author's first name and avatar, vote counts, `myVote` and `isMine`; other
 * drivers' user ids never leave the server. Replies whose top-level comment
 * is gone (older data) hang under a "Comment deleted" placeholder.
 */
export async function getSlicThread(numSlic, viewerId) {
  const docs = await comments().find({ numSlic }).toArray();
  const authors = await getAuthors(docs.map((doc) => doc.userId));

  const shape = (doc) => {
    const upVotes = doc.upVotes || [];
    const downVotes = doc.downVotes || [];
    return {
      _id: doc._id.toString(),
      parentId: doc.parentId ? doc.parentId.toString() : null,
      author: doc.userId ? (authors.get(doc.userId.toString()) ?? null) : null,
      isMine: Boolean(viewerId) && doc.userId?.toString() === viewerId,
      content: doc.deleted ? '' : doc.content,
      format: doc.format === 'text' ? 'text' : 'html',
      deleted: Boolean(doc.deleted),
      pin: doc.deleted ? null : (doc.pin ?? null),
      upCount: upVotes.length,
      downCount: downVotes.length,
      myVote: upVotes.includes(viewerId)
        ? 'up'
        : downVotes.includes(viewerId)
          ? 'down'
          : null,
      created_at: doc.created_at,
      updated_at: doc.updated_at || null,
    };
  };

  const topLevel = new Map();
  const repliesByParent = new Map();
  for (const comment of docs.map(shape)) {
    if (!comment.parentId) {
      topLevel.set(comment._id, comment);
    } else {
      if (!repliesByParent.has(comment.parentId)) repliesByParent.set(comment.parentId, []);
      repliesByParent.get(comment.parentId).push(comment);
    }
  }

  // Dates, not strings: older comments may not store ISO timestamps.
  const time = (comment) => new Date(comment.created_at).getTime() || 0;
  const byCreated = (a, b) => time(a) - time(b);
  for (const [parentId, replies] of repliesByParent) {
    replies.sort(byCreated);
    if (!topLevel.has(parentId)) {
      topLevel.set(parentId, {
        _id: parentId,
        parentId: null,
        author: null,
        isMine: false,
        content: '',
        format: 'text',
        deleted: true,
        pin: null,
        upCount: 0,
        downCount: 0,
        myVote: null,
        created_at: replies[0].created_at,
        updated_at: null,
      });
    }
  }

  const score = (comment) => comment.upCount - comment.downCount;
  return [...topLevel.values()]
    .map((comment) => ({ ...comment, replies: repliesByParent.get(comment._id) ?? [] }))
    .sort((a, b) => score(b) - score(a) || byCreated(b, a));
}

// Returns `{ id }`, or `{ notFound: 'parent' }` when `parentId` doesn't name a
// live comment on the same SLIC.
export async function createComment({ numSlic, parentId, content, pin, userId }) {
  let threadId = null;
  if (parentId) {
    const parent = await comments().findOne(
      { _id: new ObjectId(parentId), numSlic },
      { projection: { parentId: 1 } },
    );
    if (!parent) return { notFound: 'parent' };
    threadId = parent.parentId ?? parent._id;
  }

  const result = await comments().insertOne({
    created_at: new Date().toISOString(),
    numSlic,
    parentId: threadId,
    userId,
    content,
    format: 'text',
    ...(pin ? { pin } : {}),
    upVotes: [],
    downVotes: [],
  });
  return { id: result.insertedId };
}

// A live comment document, or null.
export async function getCommentById(commentId) {
  return comments().findOne({ _id: new ObjectId(commentId), ...LIVE });
}

// Saves an edit as plain text (an edited HTML comment becomes plain text).
// `pin` as validateCommentPin returns it: undefined keeps the pin, null
// removes it.
export async function updateCommentContent(commentId, content, pin) {
  const update = {
    $set: { content, format: 'text', updated_at: new Date().toISOString() },
  };
  if (pin) update.$set.pin = pin;
  else if (pin === null) update.$unset = { pin: '' };

  const result = await comments().updateOne(
    { _id: new ObjectId(commentId), ...LIVE },
    update,
  );
  return result.matchedCount > 0;
}

/**
 * Deletes a comment document (the route has loaded it to check ownership).
 * A top-level comment with replies becomes a placeholder; deleting the last
 * reply under a placeholder removes the placeholder too. Returns
 * 'soft-deleted' or 'deleted'.
 */
export async function deleteSlicComment(comment) {
  if (!comment.parentId) {
    const replies = await comments().countDocuments({ parentId: comment._id });
    if (replies > 0) {
      await comments().updateOne(
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
          $unset: { pin: '' },
        },
      );
      return 'soft-deleted';
    }
    await comments().deleteOne({ _id: comment._id });
    return 'deleted';
  }

  await comments().deleteOne({ _id: comment._id });
  const placeholder = await comments().findOne({ _id: comment.parentId, deleted: true });
  if (placeholder && (await comments().countDocuments({ parentId: placeholder._id })) === 0) {
    await comments().deleteOne({ _id: placeholder._id });
  }
  return 'deleted';
}

/**
 * One vote per driver per comment. `voteType` 'up' or 'down' sets it (moving
 * it off the other side); null clears it, which is how tapping your own vote
 * again takes it back. Returns false for a missing or deleted comment.
 */
export async function voteComment(commentId, voteType, userId) {
  const update =
    voteType === null
      ? { $pull: { upVotes: userId, downVotes: userId } }
      : {
          $addToSet: { [voteType === 'up' ? 'upVotes' : 'downVotes']: userId },
          $pull: { [voteType === 'up' ? 'downVotes' : 'upVotes']: userId },
        };
  const result = await comments().updateOne(
    { _id: new ObjectId(commentId), ...LIVE },
    update,
  );
  return result.matchedCount > 0;
}

// Account deletion (usersApi.deleteUserAccount): the driver's comments go, or
// become placeholders where other drivers replied. Replies first, so a
// top-level comment's reply count afterwards only counts other drivers'.
export async function deleteUserSlicComments(userId) {
  const mine = await comments().find({ userId }).toArray();
  const ordered = [
    ...mine.filter((comment) => comment.parentId),
    ...mine.filter((comment) => !comment.parentId),
  ];
  let deleted = 0;
  let placeholders = 0;
  for (const comment of ordered) {
    if ((await deleteSlicComment(comment)) === 'soft-deleted') placeholders += 1;
    else deleted += 1;
  }
  return { deletedComments: deleted, placeholderComments: placeholders };
}

export async function getAllComments() {
  try {
    const all = await comments().find(LIVE).toArray();

    // Sort: by upVotes length descending, then by createdAt descending
    all.sort((a, b) => {
      const aVotes = a.upVotes?.length || 0;
      const bVotes = b.upVotes?.length || 0;

      if (bVotes !== aVotes) return bVotes - aVotes;

      return new Date(b.created_at) - new Date(a.created_at);
    });

    return all;
  } catch (error) {
    console.error('Error fetching all comments:', error);
    throw error;
  }
}

// Live comments and replies on one SLIC (the /home tip count and the SLIC
// page); the threaded view is getSlicThread.
export async function getCommentsBySlic(numSlic) {
  try {
    if (!numSlic) {
      throw new Error('Slic ID is required');
    }
    return await comments()
      .find({ numSlic, ...LIVE })
      .sort({ created_at: -1 })
      .toArray();
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

/**
 * Resolves a comment's upVotes/downVotes (arrays of user-ID strings) into
 * public profiles. Projects to { _id, name, image } only — same rule as
 * getPublicUserById — because the full user document carries the password
 * hash and email. Returns null if the comment doesn't exist.
 */
export async function getCommentVoters(commentId) {
  try {
    if (!commentId || !ObjectId.isValid(commentId)) {
      return null;
    }

    const db = client.db();
    const comment = await db
      .collection('comments')
      .findOne(
        { _id: new ObjectId(commentId) },
        { projection: { upVotes: 1, downVotes: 1 } }
      );

    if (!comment) {
      return null;
    }

    const upVotes = (comment.upVotes ?? []).filter((id) => ObjectId.isValid(id));
    const downVotes = (comment.downVotes ?? []).filter((id) =>
      ObjectId.isValid(id)
    );

    const uniqueIds = [...new Set([...upVotes, ...downVotes])];
    const users =
      uniqueIds.length === 0
        ? []
        : await db
            .collection('users')
            .find(
              { _id: { $in: uniqueIds.map((id) => new ObjectId(id)) } },
              { projection: { name: 1, image: 1 } }
            )
            .toArray();

    const usersById = Object.fromEntries(
      users.map((u) => [u._id.toString(), u])
    );

    // Keep vote order; drop IDs whose user no longer exists.
    const toProfiles = (ids) => ids.map((id) => usersById[id]).filter(Boolean);

    return {
      upVoters: toProfiles(upVotes),
      downVoters: toProfiles(downVotes),
    };
  } catch (error) {
    console.error('Error fetching comment voters:', error);
    throw error;
  }
}

export async function getCommentsByUserId(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const mine = await comments().find({ userId, ...LIVE }).toArray();
    mine.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return mine;
  } catch (error) {
    console.error('Error fetching comments by user ID:', error);
    throw error;
  }
}
