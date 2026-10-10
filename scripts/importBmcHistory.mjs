// One-off import: Buy Me a Coffee history from before the webhook kept a record
// (docs/BMC-SUPPORT.md, "History import"). The input is a JSON file of what the
// buymeacoffee MCP tools returned: `supports` (get-recent-supports, donations)
// and `subscriptions` (get-recent-memberships, memberships and monthly
// supporters). It holds emails, so keep it out of the repo.
//
//   node --env-file=.env scripts/importBmcHistory.mjs <file> --dry-run   # summary, change nothing
//   node --env-file=.env scripts/importBmcHistory.mjs <file>             # write the rows
//   node --env-file=.env scripts/importBmcHistory.mjs --undo             # delete every imported row
//
// Additive and safe to re-run:
//   - each row's `key` comes from BMC's own id, and rows are upserted by it, so
//     a second run inserts nothing
//   - rows carry `source: 'import'`, which is all --undo deletes
//   - `thankedAt` is set, so nobody gets a backdated thank-you on /home
//   - never touches `users` (`bmcMember` stays as it is)
import { MongoClient } from 'mongodb';

const COLLECTION = 'bmc-events';
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const UNDO = args.includes('--undo');
const file = args.find((arg) => !arg.startsWith('--'));

// BMC's stand-ins for a supporter who gave no name.
const PLACEHOLDER_NAMES = new Set(['someone', 'defaults.someone']);

const normalizeEmail = (email) =>
  typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
const nameOf = (name) =>
  typeof name === 'string' && name.trim() && !PLACEHOLDER_NAMES.has(name.trim().toLowerCase())
    ? name.trim()
    : null;
const at = (seconds) => new Date(seconds * 1000);

// The webhook's event names (membership.*) and BMC's for the others.
function rowsFrom({ supports = [], subscriptions = [] }) {
  const rows = [];
  const skipped = [];

  for (const support of supports) {
    if (support.is_refunded) {
      skipped.push(`support ${support.id} (refunded)`);
      continue;
    }
    rows.push({
      key: `import:support:${support.id}`,
      externalId: String(support.id),
      type: 'donation.created',
      email: normalizeEmail(support.supporter_email),
      supporterName: nameOf(support.supporter_name),
      amount: support.total_amount,
      currency: support.currency ?? null,
      message: support.support_note || null,
      coffees: support.coffee_count ?? null,
      receivedAt: at(support.created_on),
    });
  }

  for (const sub of subscriptions) {
    const prefix = sub.object === 'monthly_supporter' ? 'recurring_donation' : 'membership';
    const shared = {
      externalId: String(sub.id),
      email: normalizeEmail(sub.supporter_email),
      supporterName: nameOf(sub.supporter_name),
      currency: sub.currency ?? null,
      period: sub.duration_type ?? null,
    };
    rows.push({
      ...shared,
      key: `import:${sub.object}:${sub.id}:started`,
      type: `${prefix}.started`,
      // One period's price. Renewals aren't in what BMC returns.
      amount: sub.amount,
      message: sub.support_note || null,
      receivedAt: at(sub.started_at),
    });
    if (sub.canceled_at) {
      rows.push({
        ...shared,
        key: `import:${sub.object}:${sub.id}:cancelled`,
        type: `${prefix}.cancelled`,
        amount: null,
        message: null,
        receivedAt: at(sub.canceled_at),
        endsAt: sub.current_period_end ? at(sub.current_period_end) : null,
      });
    }
  }

  return { rows, skipped };
}

const day = (date) => date.toISOString().slice(0, 10);

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set.');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const events = db.collection(COLLECTION);

  try {
    if (UNDO) {
      const count = await events.countDocuments({ source: 'import' });
      if (DRY_RUN) {
        console.log(`Would delete ${count} imported rows.`);
        return;
      }
      const { deletedCount } = await events.deleteMany({ source: 'import' });
      console.log(`Deleted ${deletedCount} imported rows.`);
      return;
    }

    if (!file) throw new Error('Pass the JSON file from the buymeacoffee MCP tools.');
    const { readFile } = await import('node:fs/promises');
    const { rows, skipped } = rowsFrom(JSON.parse(await readFile(file, 'utf8')));

    // Same lookup as findUserIdByEmail (lib/db/bmcEvents.js).
    const users = db.collection('users');
    const userIds = new Map();
    for (const email of new Set(rows.map((row) => row.email).filter(Boolean))) {
      const user = await users.findOne(
        { email },
        { projection: { _id: 1 }, collation: { locale: 'en', strength: 2 } },
      );
      userIds.set(email, user?._id ?? null);
    }

    const existingKeys = new Set(
      (await events.find({ key: { $in: rows.map((row) => row.key) } }, { projection: { key: 1 } }).toArray()).map(
        (row) => row.key,
      ),
    );
    const fresh = rows.filter((row) => !existingKeys.has(row.key));

    // Webhook rows for the same email within a day of an imported row: the same
    // support arriving both ways. Reported, not skipped, so you decide.
    const webhookRows = await events
      .find({ source: { $ne: 'import' } }, { projection: { email: 1, type: 1, receivedAt: 1 } })
      .toArray();
    const overlaps = fresh.filter((row) =>
      webhookRows.some(
        (hook) =>
          hook.email &&
          hook.email === row.email &&
          Math.abs(new Date(hook.receivedAt) - row.receivedAt) < 24 * 60 * 60 * 1000,
      ),
    );

    // Summary. Counts and totals only; no emails.
    const byType = {};
    const totals = {};
    for (const row of fresh) {
      byType[row.type] = (byType[row.type] ?? 0) + 1;
      if (typeof row.amount === 'number') {
        totals[row.currency ?? '?'] = (totals[row.currency ?? '?'] ?? 0) + row.amount;
      }
    }
    const dates = fresh.map((row) => row.receivedAt).sort((a, b) => a - b);
    const emails = new Set(fresh.map((row) => row.email).filter(Boolean));
    const matched = [...emails].filter((email) => userIds.get(email));

    console.log(`${DRY_RUN ? '[dry run] ' : ''}${fresh.length} rows to import (${existingKeys.size} already imported).`);
    for (const [type, count] of Object.entries(byType).sort()) console.log(`  ${type}: ${count}`);
    if (dates.length) console.log(`Dates: ${day(dates[0])} to ${day(dates.at(-1))}`);
    for (const [currency, total] of Object.entries(totals)) console.log(`Total ${currency}: ${total}`);
    console.log(`Supporters: ${emails.size}, with an account: ${matched.length}`);
    console.log(`Webhook rows already in ${COLLECTION}: ${webhookRows.length}`);
    for (const row of overlaps) {
      console.log(`  Possible overlap: ${row.type} on ${day(row.receivedAt)} (${row.key})`);
    }
    for (const line of skipped) console.log(`Skipped: ${line}`);

    if (DRY_RUN || !fresh.length) return;

    const importedAt = new Date();
    const { upsertedCount } = await events.bulkWrite(
      fresh.map((row) => ({
        updateOne: {
          filter: { key: row.key },
          update: {
            $setOnInsert: {
              ...row,
              userId: userIds.get(row.email) ?? null,
              source: 'import',
              importedAt,
              thankedAt: importedAt,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    console.log(`Inserted ${upsertedCount} rows.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
