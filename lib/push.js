import { createHash } from 'crypto';
import webpush from 'web-push';

import { recordPushSend } from '@/lib/db/pushLog';
import { getPushSubscriptions, recordPushResults } from '@/lib/db/pushSubscriptions';
import { getPushAudience } from '@/lib/db/users';

// Sends web push notifications (docs/PUSH-NOTIFICATIONS.md). A push is only a
// nudge: everything it says is also in the app, so these never throw. A
// failure is logged and the request that triggered it carries on, like
// lib/rateLimit.js failing open. Routes call lib/pushEvents.js, which writes
// each kind's payload, inside `after()` (next/server) so the response doesn't
// wait for the push services. Every send that reached a device (and every
// test, sample and written message) gets a row in `push-log`.
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
// with a newer one. It must be base64url, at most 32 characters, and Apple
// decodes it: a length no base64 can have (13, 21: 'driver-claims',
// 'cover-jobs-2026-10-24') is refused with 400 BadWebPushTopic, so those
// kinds never reached an iPhone. A hash of the tag is always 32 characters
// (24 bytes), and the same tag still gives the same topic.
const topicFor = (tag) =>
  typeof tag === 'string' && tag
    ? createHash('sha256').update(tag).digest('base64url').slice(0, 32)
    : undefined;

/**
 * Sends `payload` to every device of `userIds`. `payload` can also be a
 * function of a user id returning the payload, or null to skip that user; it's
 * called only for users with a device. `meta` says what the send was
 * (`{ type, source, by }`) for the send log. Returns `{ sent, failed }`.
 */
export async function sendPush(userIds, payload, meta = {}) {
  const { type = null, source = 'event', by = null } = meta;
  // An event nobody chose, or whose admins have no device, isn't logged; a
  // test, sample or written message always is, so "0 devices" shows.
  const logSend = (row) =>
    row.devices > 0 || source !== 'event'
      ? recordPushSend({ type, source, by, ...row })
      : null;

  try {
    const vapid = vapidDetails();
    if (!vapid) return { sent: 0, failed: 0 };

    const subscriptions = await getPushSubscriptions(userIds);
    if (subscriptions.length === 0) {
      await logSend({
        title: typeof payload === 'function' ? '' : (payload?.title ?? ''),
        recipients: 0,
        devices: 0,
        sent: 0,
        failed: 0,
        gone: 0,
        errors: [],
      });
      return { sent: 0, failed: 0 };
    }

    const byUser = new Map();
    for (const subscription of subscriptions) {
      const userId = subscription.userId.toString();
      byUser.set(userId, [...(byUser.get(userId) ?? []), subscription]);
    }
    const sends = [];
    let title = null;
    let recipients = 0;
    for (const [userId, devices] of byUser) {
      const message = typeof payload === 'function' ? await payload(userId) : payload;
      if (!message) continue;
      title ??= message.title ?? '';
      recipients += 1;
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
    const errors = [];
    for (const result of results) {
      if (result.ok) {
        sent.push(result.endpoint);
      } else if (result.error?.statusCode === 404 || result.error?.statusCode === 410) {
        // Unsubscribed, expired, or the app was removed from the home screen.
        gone.push(result.endpoint);
      } else {
        const host = new URL(result.endpoint).hostname;
        errors.push({ host, status: result.error?.statusCode ?? null });
        console.error(
          `Push to ${host} failed:`,
          result.error?.statusCode ?? '',
          result.error?.body || result.error?.message || result.error,
        );
      }
    }
    await recordPushResults({ gone, sent });
    // Only when someone was sent something: a payload function that skipped
    // everyone (job changes with nothing unseen) isn't a send.
    if (results.length > 0 || source !== 'event') {
      await logSend({
        title: title ?? '',
        recipients,
        devices: results.length,
        sent: sent.length,
        failed: results.length - sent.length,
        gone: gone.length,
        errors: errors.slice(0, 5),
      });
    }
    return { sent: sent.length, failed: results.length - sent.length };
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return { sent: 0, failed: 0 };
  }
}

// The devices of every admin who chose notifications of kind `type`
// (PUSH_TYPES in constants.js), except `except`: the admin whose action set it
// off, or an array of ids (also the ones a driver push just went to, so nobody
// gets two for one reply). lib/pushEvents.js is the only caller: it writes the
// payloads.
export async function sendPushToAdmins(type, payload, { except } = {}) {
  try {
    const skip = new Set([except ?? []].flat().map(String));
    const adminIds = (await getPushAudience(type)).filter((id) => !skip.has(id));
    return await sendPush(adminIds, payload, { type, source: 'event' });
  } catch (error) {
    console.error('Error sending push notifications to admins:', error);
    return { sent: 0, failed: 0 };
  }
}
