import webpush from 'web-push';

import { getPushSubscriptions, recordPushResults } from '@/lib/db/pushSubscriptions';
import { getAdminIds } from '@/lib/db/users';

// Sends web push notifications (docs/PUSH-NOTIFICATIONS.md). A push is only a
// nudge: everything it says is also in the app, so these never throw. A
// failure is logged and the request that triggered it carries on, like
// lib/rateLimit.js failing open. Routes call them inside `after()`
// (next/server) so the response doesn't wait for the push services.
//
// A payload is `{ title, body, url, tag }`, which public/sw.js shows. Keep it
// lock-screen safe: a SLIC number and what happened, never an address, a phone
// number or another driver's name. `tag` makes a newer notification replace
// an older one with the same tag instead of stacking.

// A push the device can't take within this long isn't worth showing.
const TTL_SECONDS = 12 * 60 * 60;
const TIMEOUT_MS = 10_000;

function vapidDetails() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    console.error('Push is off: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY or VAPID_SUBJECT is not set.');
    return null;
  }
  return { subject, publicKey, privateKey };
}

// The push service's Topic header replaces a push it hasn't delivered yet
// with a newer one; it allows at most 32 URL-safe characters.
const topicFor = (tag) => (typeof tag === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(tag) ? tag : undefined);

/**
 * Sends `payload` to every device of `userIds`. `payload` can also be a
 * function of a user id returning the payload, or null to skip that user; it's
 * called only for users with a device. Returns `{ sent, failed }`.
 */
export async function sendPush(userIds, payload) {
  try {
    const vapid = vapidDetails();
    if (!vapid) return { sent: 0, failed: 0 };

    const subscriptions = await getPushSubscriptions(userIds);
    if (subscriptions.length === 0) return { sent: 0, failed: 0 };

    const byUser = new Map();
    for (const subscription of subscriptions) {
      const userId = subscription.userId.toString();
      byUser.set(userId, [...(byUser.get(userId) ?? []), subscription]);
    }
    const sends = [];
    for (const [userId, devices] of byUser) {
      const message = typeof payload === 'function' ? await payload(userId) : payload;
      if (!message) continue;
      const body = JSON.stringify(message);
      const options = { vapidDetails: vapid, TTL: TTL_SECONDS, timeout: TIMEOUT_MS, topic: topicFor(message.tag) };
      for (const { endpoint, keys } of devices) {
        sends.push(
          webpush
            .sendNotification({ endpoint, keys }, body, options)
            .then(() => ({ endpoint, ok: true }))
            .catch((error) => ({ endpoint, ok: false, error })),
        );
      }
    }

    const results = await Promise.all(sends);
    const sent = [];
    const gone = [];
    for (const result of results) {
      if (result.ok) {
        sent.push(result.endpoint);
      } else if (result.error?.statusCode === 404 || result.error?.statusCode === 410) {
        // Unsubscribed, expired, or the app was removed from the home screen.
        gone.push(result.endpoint);
      } else {
        console.error(
          `Push to ${new URL(result.endpoint).hostname} failed:`,
          result.error?.statusCode ?? '',
          result.error?.body || result.error?.message || result.error,
        );
      }
    }
    await recordPushResults({ gone, sent });
    return { sent: sent.length, failed: results.length - sent.length };
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return { sent: 0, failed: 0 };
  }
}

// Every admin's devices, except `except` (the admin whose action set it off).
export async function sendPushToAdmins(payload, { except } = {}) {
  try {
    const adminIds = (await getAdminIds()).filter((id) => id !== except);
    return await sendPush(adminIds, payload);
  } catch (error) {
    console.error('Error sending push notifications to admins:', error);
    return { sent: 0, failed: 0 };
  }
}
