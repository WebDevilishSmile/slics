// Fills in the home building SLICs already knows (docs/MULTI-HUB.md "Home
// base", step 2): staff (dispatch, admin, super admin) and verified drivers
// (a name on BETPA's on-call sheet) work out of BETPA 1809. Everyone else is
// asked on /home (step 3). Nothing reads `users.homeBase` but the census and
// the admin pages, so running it changes nothing drivers see.
//
//   npm run hubs:home-base -- --dev --dry-run   # count on the dev copy (DEV_MONGODB_URI)
//   npm run hubs:home-base -- --dev             # fill in the dev copy
//   npm run hubs:home-base -- --dry-run         # count on production (MONGODB_URI), change nothing
//   npm run hubs:home-base                      # fill in production
//   npm run hubs:home-base -- --undo [--dev]    # take back only what a run wrote
//
// Additive: it writes only where `homeBase` is missing, so it never replaces
// an answer, and marks each account it filled (`homeBaseBackfilledAt`, the
// same time as `homeBase.at`). --undo removes the home base only where it's
// still the one a run wrote; one changed since (by the driver or an admin)
// keeps it and loses just the marker. Safe to run again. Each run is written
// to `admin_audit` first, with no actor and only counts. Prints counts, never
// a name or an email.
import { MongoClient } from 'mongodb';

import { betpaHomeBase } from '../lib/homeBase.js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const UNDO = args.includes('--undo');
const DEV = args.includes('--dev');
const SCRIPT = 'scripts/backfillHomeBase.mjs';

// The census's groups (scripts/hubsCensus.mjs), in its order: staff first.
const STAFF = { $or: [{ superAdmin: true }, { role: { $in: ['admin', 'dispatch'] } }] };
const VERIFIED = { 'driver.verifiedAt': { $exists: true, $ne: null } };
const MISSING = { homeBase: { $exists: false } };
const MARKED = { homeBaseBackfilledAt: { $exists: true } };
// Still the home base a run wrote: nothing has replaced it since.
const UNCHANGED = { $expr: { $eq: ['$homeBase.at', '$homeBaseBackfilledAt'] } };

function target() {
  const uri = DEV ? process.env.DEV_MONGODB_URI : process.env.MONGODB_URI;
  if (!uri) throw new Error(`${DEV ? 'DEV_MONGODB_URI' : 'MONGODB_URI'} is not set.`);
  return uri;
}

async function counts(users) {
  const [total, answered, staff, verified, marked, unchanged] = await Promise.all([
    users.countDocuments(),
    users.countDocuments({ homeBase: { $exists: true } }),
    users.countDocuments({ ...MISSING, ...STAFF }),
    users.countDocuments({ ...MISSING, ...VERIFIED, $nor: [STAFF] }),
    users.countDocuments(MARKED),
    users.countDocuments({ ...MARKED, ...UNCHANGED }),
  ]);
  return { total, answered, staff, verified, marked, unchanged };
}

function print(row) {
  console.log(`  accounts                    ${String(row.total).padStart(5)}`);
  console.log(`  with a home base            ${String(row.answered).padStart(5)}`);
  console.log(`  staff without one           ${String(row.staff).padStart(5)}`);
  console.log(`  verified drivers without    ${String(row.verified).padStart(5)}`);
  console.log(`  filled by a run             ${String(row.marked).padStart(5)}  (${row.unchanged} unchanged since)`);
}

async function main() {
  const client = new MongoClient(target());
  await client.connect();
  const db = client.db();
  console.log(`${DEV ? 'Dev copy' : 'PRODUCTION'} (database "${db.databaseName}").`);
  if (DEV && !db.databaseName.includes('dev')) {
    throw new Error(`--dev expects a database whose name contains "dev", not "${db.databaseName}".`);
  }
  const users = db.collection('users');

  try {
    const before = await counts(users);
    print(before);

    if (UNDO) {
      console.log(
        `--undo would remove ${before.unchanged} home bases and the marker on ${before.marked - before.unchanged} changed since.`,
      );
      if (DRY_RUN || before.marked === 0) return;
      await db.collection('admin_audit').insertOne({
        actorId: null,
        actorName: SCRIPT,
        action: 'homeBase.backfillUndone',
        targetType: 'users',
        targetId: null,
        targetName: null,
        from: { removed: before.unchanged, kept: before.marked - before.unchanged },
        to: null,
        at: new Date(),
      });
      await users.updateMany({ ...MARKED, ...UNCHANGED }, { $unset: { homeBase: '', homeBaseBackfilledAt: '' } });
      await users.updateMany(MARKED, { $unset: { homeBaseBackfilledAt: '' } });
    } else {
      console.log(`Would fill in BETPA 1809 for ${before.staff} staff and ${before.verified} verified drivers.`);
      if (DRY_RUN || before.staff + before.verified === 0) return;
      const at = new Date();
      await db.collection('admin_audit').insertOne({
        actorId: null,
        actorName: SCRIPT,
        action: 'homeBase.backfilled',
        targetType: 'users',
        targetId: null,
        targetName: null,
        from: null,
        to: { staff: before.staff, sheet: before.verified },
        at,
      });
      await users.updateMany(
        { ...MISSING, ...STAFF },
        { $set: { homeBase: betpaHomeBase('staff', at), homeBaseBackfilledAt: at } },
      );
      await users.updateMany(
        { ...MISSING, ...VERIFIED },
        { $set: { homeBase: betpaHomeBase('sheet', at), homeBaseBackfilledAt: at } },
      );
    }

    console.log('After:');
    print(await counts(users));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
