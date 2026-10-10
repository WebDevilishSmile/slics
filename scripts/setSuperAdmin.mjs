// Grants or revokes super admin (lib/authz.js). The app never changes it, so
// this is the only way, and it needs the database credentials.
//
//   node --env-file=.env scripts/setSuperAdmin.mjs <email> --dry-run   # show the account, change nothing
//   node --env-file=.env scripts/setSuperAdmin.mjs <email>             # make them super admin (and admin)
//   node --env-file=.env scripts/setSuperAdmin.mjs <email> --undo      # take super admin away (stays admin)
//
// Each change is written to `admin_audit` first, with no actor.
import { MongoClient } from 'mongodb';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const UNDO = args.includes('--undo');
const email = args.find((arg) => !arg.startsWith('--'));

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set.');
  if (!email) throw new Error('Pass the account email.');

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  try {
    const user = await db
      .collection('users')
      .findOne(
        { email: email.trim() },
        { projection: { name: 1, role: 1, superAdmin: 1 }, collation: { locale: 'en', strength: 2 } },
      );
    if (!user) throw new Error('No account with that email.');

    const before = { role: user.role ?? 'user', superAdmin: user.superAdmin === true };
    const after = UNDO ? { role: before.role, superAdmin: false } : { role: 'admin', superAdmin: true };
    console.log(`${user.name} (${user._id}): ${JSON.stringify(before)} → ${JSON.stringify(after)}`);

    if (before.superAdmin === after.superAdmin && before.role === after.role) {
      console.log('Nothing to change.');
      return;
    }
    if (DRY_RUN) return;

    await db.collection('admin_audit').insertOne({
      actorId: null,
      actorName: 'scripts/setSuperAdmin.mjs',
      action: UNDO ? 'superAdmin.revoked' : 'superAdmin.granted',
      targetType: 'user',
      targetId: String(user._id),
      targetName: user.name ?? null,
      from: before,
      to: after,
      at: new Date(),
    });
    await db
      .collection('users')
      .updateOne(
        { _id: user._id },
        UNDO ? { $unset: { superAdmin: '' } } : { $set: { role: 'admin', superAdmin: true } },
      );
    console.log('Done. It applies on their next request.');
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
