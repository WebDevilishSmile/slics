// Prints a one-time password reset link for a password account
// (docs/PASSWORD-RESET.md). It's for the accounts /admin/users won't make
// one for: a super admin's, your own. It needs the database credentials, so
// only someone who has them can run it.
//
//   node --env-file=.env scripts/passwordResetLink.mjs <email> --dry-run   # show the account, make nothing
//   node --env-file=.env scripts/passwordResetLink.mjs <email>             # make a link (24 hours, works once)
//   ... --origin http://localhost:3000                                     # for a local server
//
// Same rows as lib/db/passwordResets.js: only the token's hash is stored, and
// any older link for the account stops working. Logged in `admin_audit`
// first, with no actor.
import { createHash, randomBytes } from 'node:crypto';
import { MongoClient } from 'mongodb';

const LINK_TTL_MS = 24 * 60 * 60 * 1000;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const originIndex = args.indexOf('--origin');
const origin = originIndex >= 0 ? args[originIndex + 1] : 'https://slics.vercel.app';
const email = args.find((arg, i) => !arg.startsWith('--') && (originIndex < 0 || i !== originIndex + 1));

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set.');
  if (!email) throw new Error('Pass the account email.');
  if (!/^https?:\/\/[^/]+$/.test(origin ?? '')) throw new Error('--origin is a scheme and host, like https://slics.vercel.app');

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  try {
    const user = await db
      .collection('users')
      .findOne(
        { email: email.trim() },
        { projection: { name: 1, role: 1, superAdmin: 1, password: 1 }, collation: { locale: 'en', strength: 2 } },
      );
    if (!user) throw new Error('No account with that email.');
    if (typeof user.password !== 'string') {
      throw new Error('That account signs in with Google, so it has no password to reset.');
    }
    console.log(`${user.name} (${user._id}), ${user.superAdmin ? 'super admin' : user.role ?? 'user'}`);
    if (DRY_RUN) return;

    await db.collection('admin_audit').insertOne({
      actorId: null,
      actorName: 'scripts/passwordResetLink.mjs',
      action: 'password.resetLinkCreated',
      targetType: 'user',
      targetId: String(user._id),
      targetName: user.name ?? null,
      from: null,
      to: null,
      at: new Date(),
    });

    const token = randomBytes(32).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LINK_TTL_MS);
    await db.collection('password-resets').deleteMany({ userId: user._id });
    await db.collection('password-resets').insertOne({
      userId: user._id,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      via: 'script',
      createdAt: now.toISOString(),
      expiresAt,
      createdBy: null,
    });

    console.log(`\n${origin}/reset-password#${token}\n`);
    console.log(`Works once, until ${expiresAt.toLocaleString()}. Don't paste it anywhere it's kept.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
