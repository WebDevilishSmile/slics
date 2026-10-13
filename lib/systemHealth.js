import client from '@/lib/db/client';
import { INDEXES } from '@/lib/db/indexSpecs.mjs';
import { getPushStats } from '@/lib/db/pushLog';
import { pushConfigured } from '@/lib/db/pushOverview';
import { getSheetSyncHealth } from '@/lib/db/syncState';
import { todayInNewYork } from '@/lib/onCallSheet';

// The super admin's health page (/admin/super/health, docs/SUPER-ADMIN-HUB.md
// stage E): one read of everything the app depends on, each check 'ok',
// 'warning', 'error' or 'info' (nothing to judge). Read-only.
//
// Keys are reported as set or not, never their values or lengths: this page
// is HTML like any other, and a secret in it would be one screenshot from
// leaking.

const HOUR_MS = 60 * 60 * 1000;
// The daily cron reads the sheet once a day; past this, it missed a run.
const SHEET_STALE_MS = 26 * HOUR_MS;
const RANK = { error: 3, warning: 2, ok: 1, info: 0 };

export const worstStatus = (statuses) =>
  statuses.reduce((worst, status) => (RANK[status] > RANK[worst] ? status : worst), 'info');

// Every key in .env.example, grouped by what breaks without it. `optional`:
// the app runs without it, with that feature quietly off.
const KEY_GROUPS = [
  { title: 'Database', keys: ['MONGODB_URI'] },
  { title: 'Sign-in', keys: ['AUTH_SECRET', 'AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET'] },
  {
    title: 'On-call sheet',
    keys: ['GOOGLE_SHEETS_API_KEY', 'ON_CALL_SHEET_ID', 'ON_CALL_SHEET_WEBHOOK_SECRET', 'CRON_SECRET'],
  },
  { title: 'Buy Me a Coffee', keys: ['BMC_WEBHOOK_SECRET'] },
  { title: 'Directions PDFs', keys: ['BLOB_READ_WRITE_TOKEN'] },
  { title: 'Email', keys: ['RESEND_API_KEY'], optional: true },
  { title: 'Push notifications', keys: ['NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'] },
];

const isSet = (name) => Boolean(process.env[name]);

function keysSection() {
  const items = KEY_GROUPS.map((group) => {
    const missing = group.keys.filter((name) => !isSet(name));
    let status = 'ok';
    if (missing.length > 0) status = group.optional ? 'warning' : 'error';
    return {
      label: group.title,
      status,
      detail: missing.length === 0 ? 'All set' : `Not set: ${missing.join(', ')}`,
      keys: group.keys.map((name) => ({ name, set: isSet(name) })),
    };
  });
  const missing = items.filter((item) => item.status !== 'ok').length;
  return {
    key: 'keys',
    title: 'Keys',
    status: worstStatus(items.map((item) => item.status)),
    summary: missing === 0 ? 'Every key is set.' : `${missing} group${missing === 1 ? '' : 's'} missing a key.`,
    items,
  };
}

function deploySection() {
  const env = process.env.VERCEL_ENV;
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  const message = process.env.VERCEL_GIT_COMMIT_MESSAGE?.split('\n')[0];
  const items = env
    ? [
        { label: 'Environment', status: 'info', detail: env },
        ...(sha ? [{ label: 'Commit', status: 'info', detail: `${sha.slice(0, 7)}${message ? ` · ${message}` : ''}` }] : []),
        ...(process.env.VERCEL_GIT_COMMIT_REF
          ? [{ label: 'Branch', status: 'info', detail: process.env.VERCEL_GIT_COMMIT_REF }]
          : []),
        ...(process.env.VERCEL_REGION ? [{ label: 'Region', status: 'info', detail: process.env.VERCEL_REGION }] : []),
      ]
    : [{ label: 'Environment', status: 'info', detail: `Not on Vercel (${process.env.NODE_ENV})` }];
  return {
    key: 'deploy',
    title: 'Deploy',
    status: 'info',
    summary: env ? `${env}${sha ? `, ${sha.slice(0, 7)}` : ''}` : 'Running locally.',
    items,
  };
}

async function databaseSection(db) {
  const started = Date.now();
  await db.command({ ping: 1 });
  const ms = Date.now() - started;
  return {
    key: 'database',
    title: 'Database',
    status: ms > 1500 ? 'warning' : 'ok',
    summary: `Answered in ${ms} ms.`,
    items: [{ label: 'Ping', status: ms > 1500 ? 'warning' : 'ok', detail: `${ms} ms` }],
  };
}

async function sheetSection(db) {
  const today = todayInNewYork();
  const [health, jobs, weeks] = await Promise.all([
    getSheetSyncHealth({ today }),
    db.collection('sync-state').findOne({ _id: 'jobs' }),
    db
      .collection('sync-state')
      .find({ _id: { $gte: `week:${today}`, $lt: 'week;' } })
      .sort({ _id: 1 })
      .toArray(),
  ]);

  const lastRead = jobs?.lastSyncedAt ? new Date(jobs.lastSyncedAt) : null;
  const stale = !lastRead || Date.now() - lastRead.getTime() > SHEET_STALE_MS;
  const items = [
    {
      label: 'Jobs tab',
      status: stale ? 'warning' : 'ok',
      detail: lastRead ? `Last read${jobs.lastSource ? ` by ${jobs.lastSource}` : ''}` : 'Never read',
      at: lastRead?.toISOString() ?? null,
    },
    {
      label: "The sheet's ping",
      status: health.lastPingAt ? 'ok' : 'warning',
      detail: health.lastPingAt ? 'Last ping' : 'No ping yet',
      at: health.lastPingAt ?? null,
    },
    ...weeks.map((week) => ({
      label: `Cover week ${week._id.slice(5)}`,
      status: week.lastOutcome && week.lastOutcome !== 'ok' && week.lastOutcome !== 'uploaded' ? 'warning' : 'ok',
      detail: week.lastRunAt ? `Last read (${week.lastOutcome ?? 'unknown'})` : 'Not read automatically yet',
      at: week.lastRunAt ?? null,
    })),
    ...health.errors.map((error) => ({
      label: `Failed: ${error.target}`,
      status: 'error',
      detail: error.message,
      at: error.at,
    })),
  ];
  const status = worstStatus(items.map((item) => item.status));
  return {
    key: 'sheet',
    title: 'On-call sheet',
    status,
    summary:
      health.errors.length > 0
        ? `${health.errors.length} read${health.errors.length === 1 ? '' : 's'} failed.`
        : stale
          ? 'The Jobs tab hasn’t been read in over a day.'
          : 'Reading normally.',
    items,
  };
}

async function pushSection(db) {
  const [stats, devices] = await Promise.all([
    getPushStats(),
    db.collection('push-subscriptions').countDocuments(),
  ]);
  const configured = pushConfigured();
  // Failures this week that haven't been cleared on the notifications page;
  // gone devices aren't failures (lib/db/pushLog.js).
  const failing = stats.open.failed > 0;
  const items = [
    { label: 'Keys', status: configured ? 'ok' : 'error', detail: configured ? 'Set' : 'Not set: nothing can be sent' },
    { label: 'Devices', status: 'info', detail: `${devices} turned on` },
    {
      label: 'Last 7 days',
      status: failing ? 'warning' : 'ok',
      detail: `${stats.week.sends} send${stats.week.sends === 1 ? '' : 's'}, ${stats.week.sent} delivered to the push service, ${stats.week.errored} failed${stats.week.gone ? `, ${stats.week.gone} gone` : ''}${stats.week.errored && !failing ? ' (cleared)' : ''}`,
    },
    ...(stats.lastFailure
      ? [
          {
            label: 'Last failure',
            status: 'info',
            detail: `"${stats.lastFailure.title}" · ${stats.lastFailure.errors.map((error) => `${error.host} ${error.status ?? ''}`.trim()).join(', ') || `${stats.lastFailure.errored} failed`}${stats.lastFailure.cleared ? ' · cleared' : ''}`,
            at: stats.lastFailure.at,
          },
        ]
      : []),
  ];
  return {
    key: 'push',
    title: 'Push notifications',
    status: worstStatus(items.map((item) => item.status)),
    summary: !configured ? 'Keys not set.' : failing ? `${stats.open.failed} failed ${stats.cleared ? 'since cleared' : 'this week'}.` : 'Sending normally.',
    items,
    href: '/admin/super/notifications',
  };
}

function emailSection() {
  const set = isSet('RESEND_API_KEY');
  return {
    key: 'email',
    title: 'Email',
    status: set ? 'ok' : 'warning',
    summary: set ? 'Resend is set up.' : 'Not set: password reset emails aren’t sent.',
    items: [
      { label: 'Resend', status: set ? 'ok' : 'warning', detail: set ? 'Key set' : 'Key not set' },
      { label: 'Sends', status: 'info', detail: 'Not logged by the app; see Resend’s dashboard.' },
    ],
  };
}

async function pdfSection(db) {
  const slics = db.collection('slics');
  const [migrated, legacy] = await Promise.all([
    slics.countDocuments({ pdfUrl: { $nin: [null, ''] } }),
    slics.countDocuments({ pdf: true, pdfUrl: { $in: [null, ''] } }),
  ]);
  return {
    key: 'pdfs',
    title: 'Directions PDFs',
    status: legacy > 0 ? 'warning' : 'ok',
    summary: legacy > 0 ? `${legacy} still on the old Supabase bucket.` : 'All on Vercel Blob.',
    items: [
      { label: 'On Vercel Blob', status: 'ok', detail: String(migrated) },
      {
        label: 'Still on Supabase',
        status: legacy > 0 ? 'warning' : 'ok',
        detail: legacy > 0 ? `${legacy} (npm run pdfs:migrate)` : 'None',
      },
    ],
  };
}

const keyOf = (spec) => JSON.stringify(Object.entries(spec));

async function indexSection(db) {
  const collections = [...new Set(INDEXES.map((index) => index.collection))];
  const live = new Map(
    await Promise.all(
      collections.map(async (name) => {
        try {
          const indexes = await db.collection(name).indexes();
          return [name, new Set(indexes.map((index) => keyOf(index.key)))];
        } catch (error) {
          // A collection that doesn't exist yet has no indexes.
          if (error?.code === 26 || error?.codeName === 'NamespaceNotFound') return [name, new Set()];
          throw error;
        }
      }),
    ),
  );
  const missing = INDEXES.filter((index) => !live.get(index.collection).has(keyOf(index.spec)));
  return {
    key: 'indexes',
    title: 'Indexes',
    status: missing.length > 0 ? 'warning' : 'ok',
    summary:
      missing.length > 0
        ? `${missing.length} not created yet: run npm run db:indexes.`
        : `All ${INDEXES.length} created.`,
    items:
      missing.length > 0
        ? missing.map((index) => ({
            label: index.collection,
            status: 'warning',
            detail: `${Object.entries(index.spec)
              .map(([field, order]) => `${field} ${order}`)
              .join(', ')}${index.options?.unique ? ' (unique)' : ''}${index.options?.expireAfterSeconds !== undefined ? ' (TTL)' : ''}`,
          }))
        : [{ label: 'Every index', status: 'ok', detail: `${INDEXES.length} on ${collections.length} collections` }],
  };
}

async function leftoversSection(db) {
  const names = ['cover', 'bid-jobs'];
  const counts = await Promise.all(names.map((name) => db.collection(name).estimatedDocumentCount()));
  const items = names.map((name, index) => ({
    label: name,
    status: 'info',
    detail: counts[index] > 0 ? `${counts[index]} rows, unused, waiting to be dropped` : 'Empty or gone',
  }));
  return {
    key: 'leftovers',
    title: 'Unused collections',
    status: 'info',
    summary: counts.some((count) => count > 0) ? 'Old collections waiting to be dropped (TODOS.md).' : 'None left.',
    items,
  };
}

// → { checkedAt, status (the worst), sections: [{ key, title, status, summary,
//     items: [{ label, status, detail, at?, keys? }], href? }] }
export async function getSystemHealth() {
  const db = client.db();
  // A check that throws becomes an error in its own section, not a broken page.
  const guard = (key, title, run) =>
    Promise.resolve()
      .then(run)
      .catch((error) => {
        console.error(`Health check ${key} failed:`, error);
        return {
          key,
          title,
          status: 'error',
          summary: 'This check failed to run.',
          items: [{ label: 'Error', status: 'error', detail: 'See the server logs.' }],
        };
      });

  const sections = await Promise.all([
    guard('deploy', 'Deploy', deploySection),
    guard('database', 'Database', () => databaseSection(db)),
    guard('keys', 'Keys', keysSection),
    guard('sheet', 'On-call sheet', () => sheetSection(db)),
    guard('push', 'Push notifications', () => pushSection(db)),
    guard('email', 'Email', emailSection),
    guard('pdfs', 'Directions PDFs', () => pdfSection(db)),
    guard('indexes', 'Indexes', () => indexSection(db)),
    guard('leftovers', 'Unused collections', () => leftoversSection(db)),
  ]);

  return {
    checkedAt: new Date().toISOString(),
    status: worstStatus(sections.map((section) => section.status)),
    sections,
  };
}
