import client from '@/lib/db/client';
import { ObjectId } from 'mongodb';
import { toUserStamp } from '@/lib/db/slics';
import { isValidLatLng } from '@/utils/geo';
import { GYM_COMMENT_MAX_LENGTH, GYM_STATUSES } from '@/utils/variables';

// Data access for the admin-only Planet Fitness page (/admin/planet-fitness):
// gyms with room for a tractor trailer, tagged with the SLICs they're on the
// way to, plus plain-text comments on each. The comments live in their own
// `gymComments` collection rather than `comments`, which is keyed by numSlic
// everywhere it's read (admin list, profile, cascade).
//
// The write functions take the output of validateGym / validateGymComment;
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

// Normalizes a gym from a request body. Returns `{ gym }` or `{ error }` with a
// message fit to show the user. Every field is replaced, so PATCH takes the
// whole gym (the edit form always sends every field).
export function validateGym(input) {
  if (!input || typeof input !== 'object') {
    return { error: 'Invalid gym data.' };
  }

  const address = input.address || {};
  const open24h = input.open24h === true;
  const gym = {
    name: cleanText(input.name),
    address: {
      street: cleanText(address.street),
      city: cleanText(address.city),
      state: cleanText(address.state).toUpperCase(),
      zip: cleanText(address.zip),
    },
    phone: cleanText(input.phone),
    status: input.status ?? 'confirmed',
    open24h,
    hours: open24h ? '' : cleanText(input.hours),
    parking: null,
    slics: [],
    lastVisited: null,
  };

  if (
    !gym.name ||
    !gym.address.street ||
    !gym.address.city ||
    !gym.address.state
  ) {
    return { error: 'Name, street, city and state are required.' };
  }

  const lengths = {
    name: gym.name,
    street: gym.address.street,
    city: gym.address.city,
    state: gym.address.state,
    zip: gym.address.zip,
    phone: gym.phone,
    hours: gym.hours,
  };
  for (const [field, value] of Object.entries(lengths)) {
    if (value.length > MAX_LENGTHS[field]) {
      return {
        error: `${field[0].toUpperCase()}${field.slice(1)} must be ${MAX_LENGTHS[field]} characters or fewer.`,
      };
    }
  }

  if (!GYM_STATUSES.some(({ value }) => value === gym.status)) {
    return { error: 'Unknown status.' };
  }

  if (input.parking != null) {
    const parking = { lat: input.parking.lat, lng: input.parking.lng };
    if (!isValidLatLng(parking)) {
      return { error: 'The parking pin is not a valid latitude/longitude.' };
    }
    gym.parking = parking;
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
    gym.slics = slics;
  }

  if (input.lastVisited != null) {
    const visited = new Date(input.lastVisited);
    if (Number.isNaN(visited.getTime())) {
      return { error: 'Invalid last-visited date.' };
    }
    gym.lastVisited = visited.toISOString();
  }

  return { gym };
}

export function validateGymComment(content) {
  const text = cleanText(content);
  if (!text) return { error: "Comment can't be empty." };
  if (text.length > GYM_COMMENT_MAX_LENGTH) {
    return {
      error: `Comments must be ${GYM_COMMENT_MAX_LENGTH} characters or fewer.`,
    };
  }
  return { content: text };
}

// Every gym with its comments (newest first), ordered by state, city, name.
export async function getAllGyms() {
  try {
    const gyms = await client
      .db()
      .collection('gyms')
      .aggregate([
        { $sort: { 'address.state': 1, 'address.city': 1, name: 1 } },
        {
          $lookup: {
            from: 'gymComments',
            localField: '_id',
            foreignField: 'gymId',
            as: 'comments',
          },
        },
      ])
      .toArray();

    // ISO strings sort chronologically as plain strings.
    for (const gym of gyms) {
      gym.comments.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    return gyms;
  } catch (error) {
    console.error('Error fetching gyms:', error);
    throw error;
  }
}

export async function createGym(gym, user) {
  const result = await client
    .db()
    .collection('gyms')
    .insertOne({
      ...gym,
      created_at: new Date().toISOString(),
      createdBy: toUserStamp(user),
      updated_at: null,
      updatedBy: null,
    });
  return result.insertedId;
}

// Returns false when no gym has that id.
export async function updateGym(gymId, gym, user) {
  const result = await client
    .db()
    .collection('gyms')
    .updateOne(
      { _id: new ObjectId(gymId) },
      {
        $set: {
          ...gym,
          updated_at: new Date().toISOString(),
          updatedBy: toUserStamp(user),
        },
      },
    );
  return result.matchedCount > 0;
}

export async function markGymVisited(gymId) {
  const result = await client
    .db()
    .collection('gyms')
    .updateOne(
      { _id: new ObjectId(gymId) },
      { $set: { lastVisited: new Date().toISOString() } },
    );
  return result.matchedCount > 0;
}

// Deletes the gym first: if the comment cleanup then fails, the leftovers are
// unreachable orphans rather than comments lost from a gym that still exists.
export async function deleteGym(gymId) {
  const db = client.db();
  const _id = new ObjectId(gymId);

  const result = await db.collection('gyms').deleteOne({ _id });
  if (result.deletedCount === 0) return false;

  await db.collection('gymComments').deleteMany({ gymId: _id });
  return true;
}

// Returns the new comment's id, or null when the gym doesn't exist.
export async function addGymComment(gymId, content, user) {
  const db = client.db();
  const _id = new ObjectId(gymId);

  const gym = await db
    .collection('gyms')
    .findOne({ _id }, { projection: { _id: 1 } });
  if (!gym) return null;

  const result = await db.collection('gymComments').insertOne({
    gymId: _id,
    userId: user.id,
    userName: user.name || null,
    content,
    created_at: new Date().toISOString(),
    updated_at: null,
  });
  return result.insertedId;
}

export async function updateGymComment(commentId, content) {
  const result = await client
    .db()
    .collection('gymComments')
    .updateOne(
      { _id: new ObjectId(commentId) },
      { $set: { content, updated_at: new Date().toISOString() } },
    );
  return result.matchedCount > 0;
}

export async function deleteGymComment(commentId) {
  const result = await client
    .db()
    .collection('gymComments')
    .deleteOne({ _id: new ObjectId(commentId) });
  return result.deletedCount > 0;
}
