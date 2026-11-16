// How many accounts SLICs can already place in a home building, and how
// active the rest are (docs/MULTI-HUB.md "Home base", step 1). Reads only:
// it writes nothing, not even to admin_audit, and prints counts, never a
// name or an email.
//
//   npm run hubs:census             # production (MONGODB_URI)
//   npm run hubs:census -- --dev    # the dev copy (DEV_MONGODB_URI)
//
// Each account lands in the first group that fits:
//   staff     role dispatch or admin, or a super admin: BETPA's
//   verified  linked to a name on BETPA's on-call sheet (users.driver)
//   unknown   everyone else, split by their latest SLIC lookup (slicViews)
// Then, once drivers have answered, users.homeBase by building and source.
import { MongoClient } from 'mongodb';

const DEV = process.argv.slice(2).includes('--dev');
const DAY_MS = 24 * 60 * 60 * 1000;

function target() {
  const uri = DEV ? process.env.DEV_MONGODB_URI : process.env.MONGODB_URI;
  if (!uri) throw new Error(`${DEV ? 'DEV_MONGODB_URI' : 'MONGODB_URI'} is not set.`);
  return uri;
}

function groupOf(user) {
  if (user.superAdmin === true || user.role === 'admin' || user.role === 'dispatch') return 'staff';
  if (user.driver?.verifiedAt) return 'verified';
  return 'unknown';
}

// A created_at is a Date on newer rows and a string (ISO or MM/DD/YY) on
// older ones (CLAUDE.md); anything unreadable is "unknown".
function joinedAt(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function activityOf(lastView, now) {
  if (!lastView) return 'never';
  const days = (now - lastView.getTime()) / DAY_MS;
  if (days <= 30) return 'last 30 days';
  if (days <= 180) return '30–180 days ago';
  return 'over 180 days ago';
}

const ACTIVITY = ['last 30 days', '30–180 days ago', 'over 180 days ago', 'never'];

const pct = (part, whole) => (whole ? `${Math.round((part / whole) * 100)}%` : '–');
const line = (label, count, whole) =>
  console.log(`  ${label.padEnd(26)} ${String(count).padStart(5)}${whole === undefined ? '' : `  ${pct(count, whole).padStart(4)}`}`);

async function main() {
  const client = new MongoClient(target());
  await client.connect();
  const db = client.db();
  console.log(`${DEV ? 'Dev copy' : 'PRODUCTION'} (database "${db.databaseName}"), read only.\n`);

  try {
    const now = Date.now();
    const users = await db
      .collection('users')
      .find({}, { projection: { role: 1, superAdmin: 1, 'driver.verifiedAt': 1, homeBase: 1, created_at: 1 } })
      .toArray();

    // The latest lookup per account, in one pass over slicViews.
    const latest = new Map();
    const views = await db
      .collection('slicViews')
      .aggregate([{ $group: { _id: '$userId', last: { $max: '$viewedAt' } } }])
      .toArray();
    for (const row of views) {
      if (row._id && row.last) latest.set(String(row._id), new Date(row.last));
    }

    const groups = { staff: 0, verified: 0, unknown: 0 };
    const unknownByActivity = Object.fromEntries(ACTIVITY.map((key) => [key, 0]));
    const unknownJoinedRecently = { count: 0 };
    const answered = new Map();
    let answeredTotal = 0;

    for (const user of users) {
      const group = groupOf(user);
      groups[group] += 1;
      if (group === 'unknown') {
        unknownByActivity[activityOf(latest.get(String(user._id)), now)] += 1;
        const joined = joinedAt(user.created_at);
        if (joined && now - joined.getTime() <= 30 * DAY_MS) unknownJoinedRecently.count += 1;
      }
      const base = user.homeBase;
      if (base?.numSlic) {
        answeredTotal += 1;
        const key = `${base.alphaSlic ?? '?'} ${base.numSlic}${base.listed === false ? ' (not on the list)' : ''}`;
        const entry = answered.get(key) ?? { total: 0, sources: {} };
        entry.total += 1;
        entry.sources[base.source ?? '?'] = (entry.sources[base.source ?? '?'] ?? 0) + 1;
        answered.set(key, entry);
      }
    }

    const total = users.length;
    console.log('Accounts');
    line('total', total);
    line('staff (BETPA)', groups.staff, total);
    line('verified drivers (BETPA)', groups.verified, total);
    line('unknown', groups.unknown, total);

    console.log('\nUnknown accounts, by their latest lookup');
    for (const key of ACTIVITY) line(key, unknownByActivity[key], groups.unknown);
    line('joined in the last 30 days', unknownJoinedRecently.count, groups.unknown);

    console.log('\nHome building answers (users.homeBase)');
    if (!answeredTotal) {
      console.log('  none yet');
    } else {
      for (const [key, entry] of [...answered].sort((a, b) => b[1].total - a[1].total)) {
        const sources = Object.entries(entry.sources).map(([source, count]) => `${source} ${count}`).join(', ');
        console.log(`  ${key.padEnd(34)} ${String(entry.total).padStart(5)}  (${sources})`);
      }
      line('not answered', total - answeredTotal, total);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
