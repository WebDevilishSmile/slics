import client from '@/lib/db/client';
import { PUSH_TYPES } from '@/constants';
import { getLastSentByType, getPushStats } from '@/lib/db/pushLog';
import { coverDriverFilter, resolvePushPrefs } from '@/lib/db/users';
import { getFeatures, getRoleAreas } from '@/lib/db/appSettings';

// Everything the super admin's notifications page shows, read-only
// (/admin/super/notifications, docs/SUPER-ADMIN-HUB.md stage C): every admin's
// devices and chosen kinds, each kind's reach, and the send stats. Drivers
// (docs/PUSH-NOTIFICATIONS.md, stage 2) are counts only, never a list; so are
// the verified cover drivers the Covers kinds go to (stage 3). A
// device's endpoint is a capability URL, so only its push service leaves the
// server.

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

// Accounts that aren't admins' with a device on, and how many devices.
// `devices` holds every subscription's `userId`.
function driverCounts(devices, adminIds) {
  const theirs = devices.filter((device) => !adminIds.has(String(device.userId)));
  return { accounts: new Set(theirs.map((device) => String(device.userId))).size, devices: theirs.length };
}

// → { configured, stats, admins: [{ _id, name, superAdmin, devices: [{
//     service, since, lastSentAt }], prefs }], drivers: { accounts, devices },
//     kinds: [{ key, label, group, audience, eligible, on, reachable,
//     sentWeek, lastAt }] }
export async function getNotificationsOverview() {
  const db = client.db();
  const [admins, devices, stats, lastSent, roleAreas, features] = await Promise.all([
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
    getRoleAreas(),
    getFeatures(),
  ]);
  // The verified cover drivers, for the Covers kinds' counts: their choices
  // only, never who they are.
  const coverDrivers = await db
    .collection('users')
    .find(coverDriverFilter(features, roleAreas), { projection: { pushPrefs: 1 } })
    .toArray();
  const withDevice = new Set(devices.map((device) => String(device.userId)));

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
      // An admin kind counts only with its tool (docs/STAFF-ROLES.md); a super
      // admin has every one.
      prefs: resolvePushPrefs(admin.pushPrefs, {
        admin: true,
        superAdmin,
        areas: superAdmin ? undefined : roleAreas.admin,
      }),
    };
  });
  // Super admins first, then by name, like the Admins page.
  rows.sort((a, b) => b.superAdmin - a.superAdmin || a.name.localeCompare(b.name));

  const kinds = PUSH_TYPES.map((type) => {
    if (type.audience === 'coverDriver') {
      const on = coverDrivers.filter((driver) =>
        typeof driver.pushPrefs?.[type.key] === 'boolean' ? driver.pushPrefs[type.key] : type.defaultOn,
      );
      return {
        key: type.key,
        label: type.label,
        group: type.group,
        audience: type.audience,
        eligible: coverDrivers.length,
        on: on.length,
        reachable: on.filter((driver) => withDevice.has(String(driver._id))).length,
        sentWeek: stats.byType[type.key]?.sends ?? 0,
        lastAt: lastSent[type.key] ?? null,
      };
    }
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
    drivers: driverCounts(devices, adminIds),
    kinds,
  };
}

// The hub card's line: admins and drivers with a device on, sends this week,
// and the failures not cleared yet (lib/db/pushLog.js). → { adminsOn,
// devices, driversOn, sentWeek, openFailed, cleared, lastFailureAt }
export async function getNotificationsSummary() {
  const db = client.db();
  const [admins, stats, all] = await Promise.all([
    db.collection('users').find({ role: 'admin' }, { projection: { _id: 1 } }).toArray(),
    getPushStats(),
    db.collection('push-subscriptions').find({}, { projection: { userId: 1 } }).toArray(),
  ]);
  const adminIds = new Set(admins.map((admin) => String(admin._id)));
  const devices = all.filter((device) => adminIds.has(String(device.userId)));
  return {
    configured: pushConfigured(),
    adminsOn: new Set(devices.map((device) => String(device.userId))).size,
    devices: devices.length,
    driversOn: driverCounts(all, adminIds).accounts,
    sentWeek: stats.week.sends,
    openFailed: stats.open.failed,
    cleared: Boolean(stats.cleared),
    lastFailureAt: stats.lastFailure && !stats.lastFailure.cleared ? stats.lastFailure.at : null,
  };
}
