// Tags every per-hub doc as BETPA's (`hubId: 'betpa'`) and every SLIC as on
// BETPA's list (`hubs: ['betpa']`), docs/MULTI-HUB.md stage 1. Nothing reads
// either field until stage 2, and a missing `hubId` already means BETPA
// (hubFilter, lib/hubScope.js), so running it changes nothing drivers see.
//
//   npm run hub:backfill -- --dev --dry-run   # count what it would tag on the dev copy (DEV_MONGODB_URI)
//   npm run hub:backfill -- --dev             # tag the dev copy
//   npm run hub:backfill -- --dry-run         # count on production (MONGODB_URI), change nothing
//   npm run hub:backfill                      # tag production
//   npm run hub:backfill -- --undo [--dev]    # take back only what a run tagged
//
// Additive: it only sets the fields where they're missing, and marks each doc
// it touched (`hubIdBackfilledAt`, `hubsBackfilledAt`, the run's time), so
// --undo removes exactly those and never a `hubId` the app wrote itself. Safe
// to run again: a second run finds nothing to tag. Each run is written to
// `admin_audit` first, with no actor and only counts.
import { MongoClient } from 'mongodb';

import { DEFAULT_HUB_ID } from '../lib/hubScope.js';

// Every collection that's per hub (MULTI-HUB.md, "The model"). `sync-state`
// and `cover-notices` aren't here: they're keyed state, and BETPA keeps the
// keys it has (hubKey, lib/hubScope.js).
export const PER_HUB_COLLECTIONS = [
  'drivers',
  'driver-claims',
  'cover-bid-jobs',
  'cover-bid-picks',
  'cover-bid-pick-events',
  'cover-job-changes',
  'cover-bid-job-hides',
  'cover-bid-days',
  'cover-preferences',
  'cover-list-totals',
  'cover-disputes',
  'cover-reports',
  'sheet-jobs',
  'sheet-job-changes',
  'slic-reports',
  // Always written with a hubId (lib/db/slicRoutes.js), listed so a run
  // counts it like the rest (docs/SLIC-DIRECTIONS.md).
  'slic-routes',
  'route-suggestions',
];

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const UNDO = args.includes('--undo');
const DEV = args.includes('--dev');
const SCRIPT = 'scripts/backfillHubId.mjs';

const MISSING_HUB = { hubId: { $exists: false } };
const MISSING_HUBS = { hubs: { $exists: false } };
const TAGGED_HUB = { hubIdBackfilledAt: { $exists: true } };
const TAGGED_HUBS = { hubsBackfilledAt: { $exists: true } };

function target() {
  const uri = DEV ? process.env.DEV_MONGODB_URI : process.env.MONGODB_URI;
  if (!uri) throw new Error(`${DEV ? 'DEV_MONGODB_URI' : 'MONGODB_URI'} is not set.`);
  return uri;
}

async function counts(db) {
  const rows = [];
  for (const name of PER_HUB_COLLECTIONS) {
    const collection = db.collection(name);
    const [total, missing, tagged] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments(MISSING_HUB),
      collection.countDocuments(TAGGED_HUB),
    ]);
    rows.push({ name, field: 'hubId', total, missing, tagged });
  }
  const slics = db.collection('slics');
  const [total, missing, tagged] = await Promise.all([
    slics.countDocuments(),
    slics.countDocuments(MISSING_HUBS),
    slics.countDocuments(TAGGED_HUBS),
  ]);
  rows.push({ name: 'slics', field: 'hubs', total, missing, tagged });
  return rows;
}

function print(rows) {
  for (const row of rows) {
    console.log(
      `  ${row.name.padEnd(22)} ${row.field.padEnd(6)} ${String(row.total).padStart(6)} docs · ${String(row.missing).padStart(6)} untagged · ${String(row.tagged).padStart(6)} tagged by a run`,
    );
  }
}

async function main() {
  const client = new MongoClient(target());
  await client.connect();
  const db = client.db();
  console.log(`${DEV ? 'Dev copy' : 'PRODUCTION'} (database "${db.databaseName}").`);
  if (DEV && !db.databaseName.includes('dev')) {
    throw new Error(`--dev expects a database whose name contains "dev", not "${db.databaseName}".`);
  }

  try {
    const before = await counts(db);
    print(before);
    const sum = (key) => before.reduce((total, row) => total + row[key], 0);

    if (UNDO) {
      console.log(`--undo would untag ${sum('tagged')} docs.`);
      if (DRY_RUN || sum('tagged') === 0) return;
      await db.collection('admin_audit').insertOne({
        actorId: null,
        actorName: SCRIPT,
        action: 'hubId.backfillUndone',
        targetType: 'hub',
        targetId: DEFAULT_HUB_ID,
        targetName: null,
        from: Object.fromEntries(before.map((row) => [row.name, row.tagged])),
        to: null,
        at: new Date(),
      });
      for (const name of PER_HUB_COLLECTIONS) {
        await db.collection(name).updateMany(TAGGED_HUB, { $unset: { hubId: '', hubIdBackfilledAt: '' } });
      }
      await db.collection('slics').updateMany(TAGGED_HUBS, { $unset: { hubs: '', hubsBackfilledAt: '' } });
    } else {
      console.log(`Would tag ${sum('missing')} docs as ${DEFAULT_HUB_ID}'s.`);
      if (DRY_RUN || sum('missing') === 0) return;
      const at = new Date();
      await db.collection('admin_audit').insertOne({
        actorId: null,
        actorName: SCRIPT,
        action: 'hubId.backfilled',
        targetType: 'hub',
        targetId: DEFAULT_HUB_ID,
        targetName: null,
        from: null,
        to: Object.fromEntries(before.map((row) => [row.name, row.missing])),
        at,
      });
      for (const name of PER_HUB_COLLECTIONS) {
        await db
          .collection(name)
          .updateMany(MISSING_HUB, { $set: { hubId: DEFAULT_HUB_ID, hubIdBackfilledAt: at } });
      }
      await db.collection('slics').updateMany(MISSING_HUBS, { $set: { hubs: [DEFAULT_HUB_ID], hubsBackfilledAt: at } });
    }

    console.log('After:');
    print(await counts(db));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
