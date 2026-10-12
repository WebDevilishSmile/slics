import client from '@/lib/db/client';
import { PUSH_TYPES } from '@/constants';
import { getLastSentByType, getPushStats } from '@/lib/db/pushLog';
import { resolvePushPrefs } from '@/lib/db/users';

// Everything the super admin's notifications page shows, read-only
// (/admin/super/notifications, docs/SUPER-ADMIN-HUB.md stage C): every admin's
// devices and chosen kinds, each kind's reach, and the send stats. A device's
// endpoint is a capability URL, so only its push service leaves the server.

const SERVICES = [
  ['push.apple.com', 'Apple'],
  ['fcm.googleapis.com', 'Google'],
  ['android.googleapis.com', 'Google'],
  ['updates.push.services.mozilla.com', 'Mozilla'],
  ['notify.windows.com', 'Windows'],
];

// The push service behind a subscription: Apple (iPhone, iPad, Mac Safari),
// Google (Chrome, Edge on Android, Samsung, Opera), Mozilla (Firefox),
// Windows (Edge on Windows).
export function pushService(endpoint) {
  try {
    const { hostname } = new URL(endpoint);
    const match = SERVICES.find(([host]) => hostname === host || hostname.endsWith(`.${host}`));
    return match ? match[1] : 'Other';
  } catch {
    return 'Other';
  }
}

// Whether the server can send at all: all three VAPID keys are set. Never
// their values.
export const pushConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT,
  );

const iso = (value) => (value instanceof Date ? value.toISOString() : (value ?? null));

// → { configured, stats, admins: [{ _id, name, superAdmin, devices: [{
//     service, since, lastSentAt }], prefs }], otherDevices, kinds: [{ key,
//     label, group, audience, eligible, on, reachable, sentWeek, lastAt }] }
export async function getNotificationsOverview() {
  const db = client.db();
  const [admins, devices, stats, lastSent] = await Promise.all([
    db
      .collection('users')
      .find({ role: 'admin' }, { projection: { name: 1, superAdmin: 1, pushPrefs: 1 } })
      .sort({ name: 1 })
      .toArray(),
    db
      .collection('push-subscriptions')
      .find({}, { projection: { userId: 1, endpoint: 1, createdAt: 1, lastSentAt: 1 } })
      .toArray(),
    getPushStats(),
    getLastSentByType(),
  ]);

  const adminIds = new Set(admins.map((admin) => String(admin._id)));
  const rows = admins.map((admin) => {
    const id = String(admin._id);
    const superAdmin = admin.superAdmin === true;
    return {
      _id: id,
      name: admin.name || 'Unnamed admin',
      superAdmin,
      devices: devices
        .filter((device) => String(device.userId) === id)
        .map((device) => ({
          service: pushService(device.endpoint),
          since: iso(device.createdAt),
          lastSentAt: iso(device.lastSentAt),
        })),
      prefs: resolvePushPrefs(admin.pushPrefs, { superAdmin }),
    };
  });
  // Super admins first, then by name, like the Admins page.
  rows.sort((a, b) => b.superAdmin - a.superAdmin || a.name.localeCompare(b.name));

  const kinds = PUSH_TYPES.map((type) => {
    const eligible = rows.filter((admin) => Object.hasOwn(admin.prefs, type.key));
    const on = eligible.filter((admin) => admin.prefs[type.key]);
    return {
      key: type.key,
      label: type.label,
      group: type.group,
      audience: type.audience,
      eligible: eligible.length,
      on: on.length,
      // Chose it and have a device to get it on.
      reachable: on.filter((admin) => admin.devices.length > 0).length,
      sentWeek: stats.byType[type.key]?.sends ?? 0,
      lastAt: lastSent[type.key] ?? null,
    };
  });

  return {
    configured: pushConfigured(),
    stats,
    admins: rows,
    // Devices on accounts that aren't admins (none until stage 2).
    otherDevices: devices.filter((device) => !adminIds.has(String(device.userId))).length,
    kinds,
  };
}

// The hub card's line: admins with a device on, sends this week, and the
// newest failure. → { adminsOn, devices, sentWeek, failedWeek, lastFailureAt }
export async function getNotificationsSummary() {
  const db = client.db();
  const [admins, stats] = await Promise.all([
    db.collection('users').find({ role: 'admin' }, { projection: { _id: 1 } }).toArray(),
    getPushStats(),
  ]);
  const devices = await db
    .collection('push-subscriptions')
    .find({ userId: { $in: admins.map((admin) => admin._id) } }, { projection: { userId: 1 } })
    .toArray();
  return {
    configured: pushConfigured(),
    adminsOn: new Set(devices.map((device) => String(device.userId))).size,
    devices: devices.length,
    sentWeek: stats.week.sends,
    failedWeek: stats.week.failed,
    lastFailureAt: stats.lastFailure?.at ?? null,
  };
}
