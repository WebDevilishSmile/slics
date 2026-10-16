import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';
import { getPendingClaimCount } from '@/lib/db/driverClaims';
import { countSlicsAndPdfs } from '@/lib/db/slics';
import { getOpenReportSummary } from '@/lib/db/slicReports';

// The numbers on the super admin hub (/admin/super, docs/SUPER-ADMIN-HUB.md
// stage B): the "At a glance" tiles and the usage charts. Read-only, super
// admin only, computed on each visit.
//
// Sign-ups and tips are dated by `_id`: `created_at` is a Date on some rows
// and a string on others (docs/DATA-MODEL.md, "Dates come in three forms").
// Days and weeks are the drivers' (America/New_York); a week runs Sunday to
// Saturday, named by its Saturday like the on-call sheet's W/E.

const TIME_ZONE = 'America/New_York';
const DAY_MS = 24 * 60 * 60 * 1000;
const USAGE_DAYS = 30;
const SIGN_UP_WEEKS = 12;
const TOP_SLICS = 10;

const daysAgo = (days) => new Date(Date.now() - days * DAY_MS);
const idSince = (date) => ObjectId.createFromTime(Math.floor(date.getTime() / 1000));

// Today as 'YYYY-MM-DD' in New York, and date arithmetic on such strings (as
// UTC midnights, so no daylight-saving drift).
const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date());
const parseKey = (key) => new Date(`${key}T00:00:00Z`);
const toKey = (date) => date.toISOString().slice(0, 10);
const addDays = (key, days) => toKey(new Date(parseKey(key).getTime() + days * DAY_MS));

// How many drivers looked something up since `since`. A $group, not
// .distinct(): the shared client runs Stable API v1 strict, which has no
// `distinct` command (lib/db/client.js).
const activeDrivers = (views, since) =>
  views
    .aggregate([
      { $match: { viewedAt: { $gte: since } } },
      { $group: { _id: '$userId' } },
      { $count: 'drivers' },
    ])
    .next()
    .then((row) => row?.drivers ?? 0);

// → { accounts, newAccounts, activeWeek, activeMonth, lookups: { day, week,
//     month }, tips: { week, month }, openReports, pendingClaims, members,
//     slics, pdfs, places }
export async function getGlanceNumbers() {
  const db = client.db();
  const users = db.collection('users');
  const views = db.collection('slicViews');
  const comments = db.collection('comments');
  const week = daysAgo(7);
  const month = daysAgo(30);

  const [
    accounts,
    newAccounts,
    lookupsDay,
    lookupsWeek,
    lookupsMonth,
    activeWeek,
    activeMonth,
    tipsWeek,
    tipsMonth,
    reports,
    pendingClaims,
    members,
    slics,
    places,
  ] = await Promise.all([
    users.countDocuments(),
    users.countDocuments({ _id: { $gte: idSince(week) } }),
    views.countDocuments({ viewedAt: { $gte: daysAgo(1) } }),
    views.countDocuments({ viewedAt: { $gte: week } }),
    views.countDocuments({ viewedAt: { $gte: month } }),
    activeDrivers(views, week),
    activeDrivers(views, month),
    comments.countDocuments({ _id: { $gte: idSince(week) }, deleted: { $ne: true } }),
    comments.countDocuments({ _id: { $gte: idSince(month) }, deleted: { $ne: true } }),
    getOpenReportSummary(),
    getPendingClaimCount(),
    users.countDocuments({ bmcMember: true }),
    countSlicsAndPdfs(),
    db.collection('places').countDocuments(),
  ]);

  return {
    accounts,
    newAccounts,
    activeWeek,
    activeMonth,
    lookups: { day: lookupsDay, week: lookupsWeek, month: lookupsMonth },
    tips: { week: tipsWeek, month: tipsMonth },
    openReports: reports.count,
    pendingClaims,
    members,
    slics: slics.total,
    pdfs: slics.withPdf,
    places,
  };
}

// → { lookupsByDay: [{ date: 'YYYY-MM-DD', count }] (USAGE_DAYS, oldest
//     first, today last), signUpsByWeek: [{ weekEnding: 'YYYY-MM-DD', count }]
//     (SIGN_UP_WEEKS, this week last), topSlics: [{ numSlic, name, count }] }
export async function getUsageSeries() {
  const db = client.db();
  const today = todayKey();

  const firstDay = addDays(today, -(USAGE_DAYS - 1));
  // This week's Sunday, then back to the first week shown.
  const thisSunday = addDays(today, -parseKey(today).getUTCDay());
  const firstSunday = addDays(thisSunday, -7 * (SIGN_UP_WEEKS - 1));

  const [days, weeks, top] = await Promise.all([
    db
      .collection('slicViews')
      .aggregate([
        // A day's slack on the bound; the keys below pick the exact days.
        { $match: { viewedAt: { $gte: new Date(parseKey(firstDay).getTime() - DAY_MS) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$viewedAt', timezone: TIME_ZONE } },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
    db
      .collection('users')
      .aggregate([
        { $match: { _id: { $gte: idSince(new Date(parseKey(firstSunday).getTime() - DAY_MS)) } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: {
                  $dateTrunc: {
                    date: { $toDate: '$_id' },
                    unit: 'week',
                    timezone: TIME_ZONE,
                    startOfWeek: 'sunday',
                  },
                },
                timezone: TIME_ZONE,
              },
            },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
    db
      .collection('slicViews')
      .aggregate([
        { $match: { viewedAt: { $gte: daysAgo(30) } } },
        { $group: { _id: '$numSlic', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: TOP_SLICS },
        {
          $lookup: {
            from: 'slics',
            localField: '_id',
            foreignField: 'numSlic',
            as: 'slic',
            pipeline: [{ $project: { name: 1, alphaSlic: 1 } }, { $limit: 1 }],
          },
        },
      ])
      .toArray(),
  ]);

  const dayCounts = new Map(days.map((row) => [row._id, row.count]));
  const weekCounts = new Map(weeks.map((row) => [row._id, row.count]));

  return {
    lookupsByDay: Array.from({ length: USAGE_DAYS }, (_, index) => {
      const date = addDays(firstDay, index);
      return { date, count: dayCounts.get(date) ?? 0 };
    }),
    signUpsByWeek: Array.from({ length: SIGN_UP_WEEKS }, (_, index) => {
      const sunday = addDays(firstSunday, index * 7);
      return { weekEnding: addDays(sunday, 6), count: weekCounts.get(sunday) ?? 0 };
    }),
    topSlics: top.map((row) => ({
      numSlic: String(row._id),
      name: row.slic[0]?.name || row.slic[0]?.alphaSlic || null,
      count: row.count,
    })),
  };
}

// For the Admins card: how many admins, how many of them are super admins, and
// how many dispatchers (docs/STAFF-ROLES.md).
export async function getAdminCounts() {
  const users = client.db().collection('users');
  const [admins, superAdmins, dispatch] = await Promise.all([
    users.countDocuments({ role: 'admin' }),
    users.countDocuments({ role: 'admin', superAdmin: true }),
    users.countDocuments({ role: 'dispatch' }),
  ]);
  return { admins, superAdmins, dispatch };
}
