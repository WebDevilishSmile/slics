import client from '@/lib/db/client';
import { ObjectId } from 'mongodb';

// Web push subscriptions (docs/PUSH-NOTIFICATIONS.md), one document per
// browser on one device in `push-subscriptions`:
// `{ userId: ObjectId, endpoint, keys: { p256dh, auth }, createdAt,
//    updatedAt, lastSentAt? }` (ISO strings).
// `endpoint` is unique: the push service's address for that browser. It moves
// to whoever saved it last, so a shared device follows its latest account.
// lib/push.js sends to them and deletes the ones the push service says are gone.

const subscriptions = () => client.db().collection('push-subscriptions');

// The push services browsers subscribe with. The server POSTs to the endpoint
// on every send, so anything else would let a caller point it at any URL.
// Chrome, Edge (Android), Samsung and Opera use FCM; Firefox, Mozilla's;
// Safari, Apple's; Edge on Windows, WNS.
const PUSH_HOSTS = [
  'fcm.googleapis.com',
  'android.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.apple.com',
  'notify.windows.com',
];
const KEY = /^[A-Za-z0-9_-]{16,128}={0,2}$/;

const isPushHost = (hostname) =>
  PUSH_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));

// A `PushSubscription.toJSON()` from the browser → `{ subscription: { endpoint,
// keys } }` or `{ error }` with a message for a 400.
export function validatePushSubscription(body) {
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    return { error: 'Invalid push subscription.' };
  }
  if (url.protocol !== 'https:' || endpoint.length > 1024 || !isPushHost(url.hostname)) {
    return { error: 'Invalid push subscription.' };
  }

  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (typeof p256dh !== 'string' || typeof auth !== 'string' || !KEY.test(p256dh) || !KEY.test(auth)) {
    return { error: 'Invalid push subscription.' };
  }

  return { subscription: { endpoint, keys: { p256dh, auth } } };
}

// Saves a device's subscription for `userId`, or moves it to them.
export async function savePushSubscription(userId, { endpoint, keys }) {
  const now = new Date().toISOString();
  await subscriptions().updateOne(
    { endpoint },
    {
      $set: { userId: new ObjectId(userId), keys, updatedAt: now },
      $setOnInsert: { endpoint, createdAt: now },
    },
    { upsert: true },
  );
}

// Removes one device, only when it's `userId`'s. Returns whether it was.
export async function deletePushSubscription(endpoint, userId) {
  const { deletedCount } = await subscriptions().deleteOne({
    endpoint,
    userId: new ObjectId(userId),
  });
  return deletedCount > 0;
}

// Every device of these users (ids as strings or ObjectIds).
export async function getPushSubscriptions(userIds) {
  const ids = userIds.filter((id) => id && ObjectId.isValid(id)).map((id) => new ObjectId(id));
  if (ids.length === 0) return [];
  return subscriptions()
    .find({ userId: { $in: ids } }, { projection: { userId: 1, endpoint: 1, keys: 1 } })
    .toArray();
}

// lib/push.js after a send: drop the endpoints the push service said are
// gone, stamp the ones it took.
export async function recordPushResults({ gone, sent }) {
  const now = new Date().toISOString();
  await Promise.all([
    gone.length ? subscriptions().deleteMany({ endpoint: { $in: gone } }) : null,
    sent.length
      ? subscriptions().updateMany({ endpoint: { $in: sent } }, { $set: { lastSentAt: now } })
      : null,
  ]);
}

// Account deletion: every device goes.
export async function deleteUserPushSubscriptions(userId) {
  const { deletedCount } = await subscriptions().deleteMany({ userId: new ObjectId(userId) });
  return { deletedPushSubscriptions: deletedCount };
}
