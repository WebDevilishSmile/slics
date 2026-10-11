import { createHash, randomBytes } from 'node:crypto';
import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';
import { hashPassword } from '@/lib/password';

// Password reset links (docs/PASSWORD-RESET.md), one live row per account in
// `password-resets`:
// `{ userId: ObjectId, tokenHash, via: 'admin' | 'script' | 'email', createdAt,
//    expiresAt: Date, createdBy: { id, name } | null }`.
// The token itself is never stored: only its SHA-256, so a database read
// can't reset anyone's password. The link carries it in the URL fragment
// (`/reset-password#<token>`), which browsers never send to the server.
// A TTL index on `expiresAt` deletes the expired ones.

const resets = () => client.db().collection('password-resets');

// 32 random bytes as base64url: 43 characters.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export const isResetToken = (token) => typeof token === 'string' && TOKEN_PATTERN.test(token);

export const resetUrl = (origin, token) => `${origin}/reset-password#${token}`;

/**
 * Makes a reset link for `userId`, valid for `ttlMs`, and returns its raw
 * token, which isn't kept anywhere. Any older link for the account stops
 * working. `actor` is the admin's session user, or null.
 */
export async function createPasswordReset(userId, { via, ttlMs, actor = null }) {
  const owner = new ObjectId(userId);
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  await resets().deleteMany({ userId: owner });
  await resets().insertOne({
    userId: owner,
    tokenHash: hashToken(token),
    via,
    createdAt: now.toISOString(),
    expiresAt,
    createdBy: actor ? { id: actor.id, name: actor.name ?? null } : null,
  });
  return { token, expiresAt };
}

/**
 * Sets a new password from a reset link. The link is used up first, so it
 * works once even if two tabs submit it. The password is changed, and the
 * session version bumped so every device signed in to the account is signed
 * out on its next request (auth.js). Returns `{ ok: true }` or `{ error }`
 * with one message for a wrong, used or expired link: it never says whether
 * the account exists. `password` has already passed `passwordProblem`.
 */
export async function redeemPasswordReset(token, password) {
  const reset = await resets().findOneAndDelete({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!reset) return { error: 'This link has expired or was already used.' };

  const now = new Date().toISOString();
  const { matchedCount } = await client
    .db()
    .collection('users')
    .updateOne(
      { _id: reset.userId },
      {
        $set: { password: await hashPassword(password), passwordChangedAt: now },
        $inc: { sessionVersion: 1 },
      },
    );
  if (matchedCount === 0) return { error: 'This link has expired or was already used.' };
  return { ok: true };
}

// Account deletion: the account's link goes too.
export async function deleteUserPasswordResets(userId) {
  const { deletedCount } = await resets().deleteMany({ userId: new ObjectId(userId) });
  return { deletedPasswordResets: deletedCount };
}
