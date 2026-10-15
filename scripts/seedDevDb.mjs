// Copies production into the dev database with the people taken out
// (docs/DEV-DATABASE.md), so `npm run dev` and Vercel Preview can run against
// realistic data without touching or showing anyone's details.
//
//   npm run db:dev-seed -- --dry-run   # read production, scrub, report; write nothing
//   npm run db:dev-seed                # replace the dev database with a fresh scrubbed copy
//
// Reads production with MONGODB_URI (only `find`, never a write) and writes
// with DEV_MONGODB_URI, whose database must be a different one with "dev" in
// its name. Every run drops the dev collections it writes and starts over;
// production is never written, so there's nothing to undo there.
//
// What it does with each collection is in PLAN below:
//   keep        copied as is (SLICs, hubs, places, tips…)
//   scrub       copied with people swapped for made-up ones, the same way
//               everywhere, so a driver on the Jobs tab is the same made-up
//               driver on the cover tabs, the roster and an account's link
//   drop        not copied (OAuth tokens, sessions, push addresses, money,
//               employee IDs, rate limits, the old cover/bid lists)
// Then it adds two test accounts (TEST_ACCOUNT_EMAIL/TEST_ACCOUNT_PASSWORD
// from .env.local): an admin linked to a driver who's covering this week, and
// a plain driver linked to one who works their own job, and builds the
// indexes (lib/db/indexSpecs.mjs).
import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';

const DRY_RUN = process.argv.includes('--dry-run');

const PLAN = {
  keep: [
    'allHubs', 'slics', 'app-settings', 'places', 'placeComments', 'comments', 'gyms',
    'gymComments', 'slicViews', 'slic_history', 'slic-reports', 'admin_audit', 'push-log',
    'sync-state', 'cover-job-changes', 'cover-preferences', 'cover-bid-job-hides',
  ],
  scrub: ['users', 'drivers', 'sheet-jobs', 'sheet-job-changes', 'cover-bid-jobs', 'cover-bid-picks', 'cover-bid-pick-events'],
  drop: [
    'accounts', 'sessions', 'verification_tokens', 'push-subscriptions', 'password-resets',
    'rateLimits', 'bmc-events', 'driver-claims', 'cover-disputes', 'bid-drivers', 'bid-jobs',
    'bid-sleepers', 'cover',
  ],
};

// Made-up names, combined by index so there's always one more.
const LASTS = [
  'ADAMS', 'BAKER', 'CARTER', 'DAVIS', 'EVANS', 'FOSTER', 'GRAY', 'HAYES', 'IRWIN', 'JONES',
  'KELLY', 'LANE', 'MOORE', 'NASH', 'OWENS', 'PRICE', 'QUINN', 'REED', 'STONE', 'TATE',
  'UPTON', 'VANCE', 'WARD', 'YATES', 'ZIMMER', 'BLAKE', 'CROSS', 'DRAKE', 'ELLIS', 'FLYNN',
];
const FIRSTS = [
  'ALEX', 'BLAIR', 'CASEY', 'DANA', 'EMERY', 'FRANKIE', 'GLEN', 'HARPER', 'JESSE', 'KAI',
  'LEE', 'MORGAN', 'NOEL', 'OAKLEY', 'PAT', 'QUINCY', 'RILEY', 'SAM', 'TAYLOR', 'VAL',
];
const nth = (list, i) => `${list[i % list.length]}${i >= list.length ? Math.floor(i / list.length) + 1 : ''}`;

// The same normal form as lib/driverNames.js driverNameKey.
const nameKey = (name) =>
  String(name ?? '').toUpperCase().replace(/\./g, '').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').trim();

// A driver's name as the sheet writes it, split into its last-name part and
// the rest: "DOE, JANE M" → DOE / [JANE, M]; "Jane Doe" → DOE / [JANE]; "DOE" → DOE / [].
function splitName(name) {
  const key = nameKey(name);
  if (!key) return null;
  if (key.includes(',')) {
    const [last, rest] = key.split(',', 2);
    return { last, firsts: rest.split(' ').filter(Boolean), comma: true };
  }
  const words = key.split(' ');
  return words.length === 1
    ? { last: words[0], firsts: [], comma: true }
    : { last: words[words.length - 1], firsts: words.slice(0, -1), comma: false };
}

// One made-up last name per real one, one first name per real first name.
function nameMapper(realNames) {
  const lasts = new Map();
  const firsts = new Map();
  // Last names as "LAST, FIRST" writes them, so "VAN DYKE" alone on a cover
  // job is read as one last name, not a first and a last.
  const commaLasts = new Set([...realNames].map(nameKey).filter((key) => key.includes(',')).map((key) => key.split(',')[0]));
  const parse = (name) => (commaLasts.has(nameKey(name)) ? { last: nameKey(name), firsts: [], comma: true } : splitName(name));
  for (const name of realNames) {
    const parts = parse(name);
    if (!parts) continue;
    if (!lasts.has(parts.last)) lasts.set(parts.last, nth(LASTS, lasts.size));
    for (const first of parts.firsts) if (!firsts.has(first)) firsts.set(first, nth(FIRSTS, firsts.size));
  }
  const known = new Set([...realNames].map(nameKey).filter(Boolean));
  // Writes the made-up name in the original's shape and case.
  const map = (name) => {
    const parts = parse(name);
    if (!parts) return name;
    const last = lasts.get(parts.last) ?? nth(LASTS, lasts.size + parts.last.length);
    const rest = parts.firsts.map((first) => firsts.get(first) ?? 'X');
    const out = parts.comma ? [last, rest.join(' ')].filter(Boolean).join(', ') : [...rest, last].join(' ');
    const original = String(name);
    return original === original.toUpperCase() ? out : out.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };
  // Only a string that is one of the names: other fields' values pass through.
  const mapIfName = (value) => (typeof value === 'string' && known.has(nameKey(value)) ? map(value) : value);
  return { map, mapIfName, count: lasts.size };
}

const isObjectId = (value) => value instanceof ObjectId || (typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value));

async function main() {
  const source = process.env.MONGODB_URI;
  const target = process.env.DEV_MONGODB_URI;
  if (!source) throw new Error('MONGODB_URI is not set.');
  if (!DRY_RUN && !target) throw new Error('DEV_MONGODB_URI is not set (see docs/DEV-DATABASE.md).');

  const opts = { serverApi: { version: ServerApiVersion.v1, strict: true } };
  const from = new MongoClient(source, opts);
  await from.connect();
  const prod = from.db();
  let to = null;
  let dev = null;
  if (!DRY_RUN) {
    to = new MongoClient(target, opts);
    await to.connect();
    dev = to.db();
    if (dev.databaseName === prod.databaseName || !/dev/i.test(dev.databaseName)) {
      throw new Error(`Refusing to write to "${dev.databaseName}": it must be a database with "dev" in its name, not "${prod.databaseName}".`);
    }
  }

  try {
    const read = (name) => prod.collection(name).find({}).toArray();
    const data = {};
    for (const name of [...PLAN.keep, ...PLAN.scrub]) data[name] = await read(name);

    // Every real driver name, from everywhere one is written.
    const realNames = new Set([
      ...data['sheet-jobs'].map((row) => row.driver),
      ...data['cover-bid-picks'].flatMap((week) => week.rows.map((row) => row.name)),
      ...data['cover-bid-jobs'].flatMap((job) => [job.name, job.assignedDriver]),
      ...data.drivers.map((row) => row.name),
      ...data.users.map((user) => user.driver?.name),
      ...data['cover-bid-pick-events'].map((row) => row.name),
    ].filter(Boolean));
    const drivers = nameMapper(realNames);

    // Accounts get made-up display names by position.
    const userNames = new Map(
      data.users.map((user, i) => [String(user._id), `${nth(FIRSTS, i).charAt(0)}${nth(FIRSTS, i).slice(1).toLowerCase()} ${nth(LASTS, i + 7).charAt(0)}${nth(LASTS, i + 7).slice(1).toLowerCase()}`]),
    );
    const userName = (id) => userNames.get(String(id)) ?? 'Admin';

    // A stamp ({ id, name[, email] }) anywhere in a document: the account's
    // made-up name, no email.
    const scrubStamps = (value) => {
      if (Array.isArray(value)) return value.map(scrubStamps);
      if (!value || typeof value !== 'object' || value instanceof Date || value._bsontype) return value;
      const out = {};
      for (const [key, inner] of Object.entries(value)) out[key] = scrubStamps(inner);
      if ('name' in out && ('email' in out || ('id' in out && isObjectId(out.id)))) {
        out.name = out.id ? userName(out.id) : 'Admin';
        if ('email' in out) out.email = null;
      }
      return out;
    };

    const out = {};
    for (const name of PLAN.keep) out[name] = data[name].map(scrubStamps);
    // Fields in kept collections that hold a person or their words about something private.
    out['slicViews'] = out['slicViews'].map(({ note, ...row }) => row);
    out['slic-reports'] = out['slic-reports'].map((row) => ({ ...row, note: row.note ? '(note removed in the dev copy)' : row.note }));
    out['gymComments'] = out['gymComments'].map((row) => ({ ...row, userName: userName(row.userId) }));
    // An audit row's from/to is a role, a flag, a driver's name (driver.verified)
    // or a supporter's details (support.*).
    const auditValue = (row, value) =>
      String(row.action).startsWith('support.') && typeof value === 'string'
        ? '(removed in the dev copy)'
        : drivers.mapIfName(value);
    out['admin_audit'] = out['admin_audit'].map((row) => ({
      ...row,
      actorName: row.actorId ? userName(row.actorId) : row.actorName,
      targetName:
        row.targetType === 'user' ? userName(row.targetId) : row.targetType === 'driver' ? drivers.mapIfName(row.targetName) : row.targetName,
      from: auditValue(row, row.from),
      to: auditValue(row, row.to),
    }));
    // A cover job's `name` change is who picked it.
    out['cover-job-changes'] = out['cover-job-changes'].map((row) => ({
      ...row,
      from: drivers.mapIfName(row.from),
      to: drivers.mapIfName(row.to),
    }));

    out.users = data.users.map((user, i) => {
      const { password, driverId, image, phone, ...rest } = scrubStamps(user);
      const [first, last] = userName(user._id).split(' ');
      const driver = user.driver
        ? { ...scrubStamps(user.driver), name: drivers.map(user.driver.name), key: nameKey(drivers.map(user.driver.name)) }
        : undefined;
      return {
        ...rest,
        name: userName(user._id),
        firstName: first,
        lastName: last,
        email: `user${i + 1}@example.test`,
        ...(driver ? { driver } : {}),
      };
    });
    out.drivers = data.drivers.map((row) => ({
      ...row,
      name: drivers.map(row.name),
      employeeId: null,
      phone: null,
      sheetKey: row.sheetKey ? nameKey(drivers.mapIfName(row.sheetKey) === row.sheetKey ? drivers.map(row.sheetKey) : drivers.mapIfName(row.sheetKey)) : row.sheetKey,
      notSheetKeys: (row.notSheetKeys ?? []).map((key) => nameKey(drivers.map(key))),
    }));
    out['sheet-jobs'] = data['sheet-jobs'].map((row) => ({ ...row, driver: row.driver ? drivers.map(row.driver) : row.driver }));
    out['sheet-job-changes'] = data['sheet-job-changes'].map((row) => ({
      ...row,
      from: drivers.mapIfName(row.from),
      to: drivers.mapIfName(row.to),
    }));
    out['cover-bid-jobs'] = data['cover-bid-jobs'].map((job) => ({
      ...scrubStamps(job),
      name: job.name ? drivers.map(job.name) : job.name,
      assignedDriver: job.assignedDriver ? drivers.map(job.assignedDriver) : job.assignedDriver,
    }));
    out['cover-bid-picks'] = data['cover-bid-picks'].map((week) => ({
      ...scrubStamps(week),
      rows: week.rows.map((row) => ({ ...row, name: drivers.map(row.name) })),
    }));
    out['cover-bid-pick-events'] = data['cover-bid-pick-events'].map((row) => ({
      ...row,
      name: drivers.map(row.name),
      from: drivers.mapIfName(row.from),
      to: drivers.mapIfName(row.to),
    }));

    // Nothing real may be left: every account's email and name, every driver's name.
    const real = new Set([
      ...data.users.flatMap((user) => [user.email, user.name, user.firstName, user.lastName, user.phone].filter((v) => v && String(v).length > 3)),
      ...[...realNames].filter((name) => String(name).length > 3),
      ...data.drivers.flatMap((row) => [row.employeeId, row.phone].filter(Boolean)),
    ].map((value) => nameKey(value)));
    // Where, never what: the collection and the field path of each leak.
    const leakPaths = new Map();
    // A made-up name can match a real one by chance ("Moore"); that isn't a leak.
    const madeUp = new Set([...userNames.values()].flatMap((name) => [name, ...name.split(' ')]).map(nameKey));
    const check = (value, path) => {
      // A SLIC's own old values (slic_history's changes) are SLIC data.
      if (path.startsWith('slic_history.changes')) return;
      if (typeof value === 'string') {
        if (real.has(nameKey(value)) && !madeUp.has(nameKey(value))) leakPaths.set(path, (leakPaths.get(path) ?? 0) + 1);
      } else if (Array.isArray(value)) value.forEach((inner) => check(inner, `${path}[]`));
      else if (value && typeof value === 'object' && !(value instanceof Date) && !value._bsontype) {
        for (const [key, inner] of Object.entries(value)) check(inner, `${path}.${key}`);
      }
    };
    // Tips, comments and place names are drivers' public words, copied as they are.
    const skip = new Set(['comments', 'placeComments', 'places', 'gyms', 'allHubs', 'slics', 'push-log', 'sync-state']);
    for (const [name, rows] of Object.entries(out)) if (!skip.has(name)) rows.forEach((row) => check(row, name));
    const leaks = [...leakPaths.values()].reduce((sum, n) => sum + n, 0);

    for (const name of [...PLAN.keep, ...PLAN.scrub]) {
      console.log(`${PLAN.scrub.includes(name) ? 'scrub' : 'keep '}  ${String(out[name].length).padStart(6)}  ${name}`);
    }

    // The swap has to keep the sheets agreeing with each other, or the dev
    // copy can't show anyone's This week: these counts should match.
    const matches = (set) => {
      const jobsTab = new Set(set['sheet-jobs'].map((row) => nameKey(row.driver)).filter(Boolean));
      const picks = set['cover-bid-picks'].flatMap((week) => week.rows.map((row) => nameKey(row.name)));
      const lastOfPick = new Set(picks.map((key) => key.split(',')[0]));
      return {
        pickNamesOnJobsTab: picks.filter((key) => jobsTab.has(key)).length,
        coverJobNamesOnPicks: set['cover-bid-jobs'].filter((job) => job.name && lastOfPick.has(nameKey(job.name).split(',')[0])).length,
        accountLinksOnPicksOrJobsTab: set.users.filter((user) => user.driver?.key && (picks.includes(user.driver.key) || jobsTab.has(user.driver.key))).length,
      };
    };
    console.log('names that line up, before:', JSON.stringify(matches(data)), 'after:', JSON.stringify(matches(out)));
    for (const name of PLAN.drop) console.log(`drop   ${String(await prod.collection(name).estimatedDocumentCount()).padStart(6)}  ${name}`);
    console.log(`${drivers.count} driver last names swapped; real values left in scrubbed fields: ${leaks}`);
    for (const [path, n] of leakPaths) console.log(`  ${n} at ${path}`);
    if (leaks > 0) throw new Error('Real names or emails would be copied. Nothing was written.');

    if (DRY_RUN) {
      console.log('Dry run: nothing written.');
      return;
    }

    for (const name of [...PLAN.keep, ...PLAN.scrub]) {
      await dev.collection(name).drop().catch(() => {});
      if (out[name].length > 0) await dev.collection(name).insertMany(out[name]);
    }
    for (const name of PLAN.drop) await dev.collection(name).drop().catch(() => {});

    await addTestAccounts(dev);

    const { INDEXES } = await import('../lib/db/indexSpecs.mjs');
    for (const { collection, spec, options } of INDEXES) await dev.collection(collection).createIndex(spec, options);
    console.log(`Wrote "${dev.databaseName}" and built ${INDEXES.length} indexes.`);
  } finally {
    await from.close();
    await to?.close();
  }
}

// Two accounts to sign in with on the dev copy, both with TEST_ACCOUNT_PASSWORD:
// TEST_ACCOUNT_EMAIL as a super admin (on the copy only, so its switches and hub
// pages can be tried) linked to a driver covering a job in the newest posted
// week, and a "+driver" address as a plain user linked to a
// driver on their own job. Linked names that another account already has are
// skipped (the key is unique).
async function addTestAccounts(dev) {
  const email = process.env.TEST_ACCOUNT_EMAIL;
  const password = process.env.TEST_ACCOUNT_PASSWORD;
  if (!email || !password) {
    console.log('No TEST_ACCOUNT_EMAIL/TEST_ACCOUNT_PASSWORD: no test accounts added.');
    return;
  }
  const linked = new Set((await dev.collection('users').find({ 'driver.key': { $exists: true } }).toArray()).map((user) => user.driver.key));
  const week = await dev.collection('cover-bid-picks').find({}).sort({ weekEnding: -1 }).limit(1).next();
  const jobs = week ? await dev.collection('cover-bid-jobs').find({ weekEnding: week.weekEnding }).toArray() : [];
  const jobNumbers = new Set(jobs.map((job) => String(job.jobNumber ?? '').trim().toUpperCase()));
  const coverRow = week?.rows.find((row) => jobNumbers.has(String(row.job ?? '').trim().toUpperCase()) && !linked.has(nameKey(row.name)));
  const sheetJob = await dev.collection('sheet-jobs').findOne({ removedAt: { $exists: false }, driver: { $nin: ['', null] }, description: { $ne: '' } });

  const hash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  const [local, domain] = email.split('@');
  const accounts = [
    { email, firstName: 'Claude', lastName: 'Test', role: 'admin', superAdmin: true, linkTo: coverRow?.name },
    { email: `${local}+driver@${domain}`, firstName: 'Claude', lastName: 'Driver', role: 'user', linkTo: sheetJob?.driver },
  ];
  for (const account of accounts) {
    const key = account.linkTo ? nameKey(account.linkTo) : null;
    await dev.collection('users').deleteOne({ email: account.email });
    await dev.collection('users').insertOne({
      name: `${account.firstName} ${account.lastName}`,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      password: hash,
      role: account.role,
      ...(account.superAdmin ? { superAdmin: true } : {}),
      bmcMember: false,
      created_at: now,
      ...(key && !linked.has(key)
        ? { driver: { name: account.linkTo, key, verifiedAt: now, verifiedBy: { id: null, name: 'seedDevDb' } } }
        : {}),
    });
    if (key) linked.add(key);
    console.log(`Test account ${account.email}: ${account.superAdmin ? 'super admin' : account.role}${key ? ', linked to a driver' : ''}.`);
  }
}

main().catch((error) => {
  console.error('Error seeding the dev database:', error.message);
  process.exit(1);
});
