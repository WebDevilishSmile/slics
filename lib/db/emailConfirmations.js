import { createHash, randomBytes } from 'node:crypto';
import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';
import { EMAIL_CONFIRM_LINK_HOURS } from '@/constants';

// Links that confirm a password account's email (docs/SECURITY.md #8 step 2),
// one live row per account in `email-confirmations`:
// `{ userId: ObjectId, email, tokenHash, createdAt, expiresAt: Date }`.
// Sent at sign-up (app/api/auth/register) and from /profile
// (app/api/users/me/email-confirmation), used on /confirm-email. Like a reset
// link (lib/db/passwordResets.js), only the token's SHA-256 is stored and the
// link carries it in the URL fragment, which browsers never send to the
// server. A TTL index on `expiresAt` deletes the expired ones.
//
// Confirming is soft: the account works without it. It's what lets the app
// trust the address: a Buy Me a Coffee membership finds the account, and the
// password stays when the same email signs in with Google
// (lib/db/accountLinking.js).

const confirmations = () => client.db().collection('email-confirmations');

// 32 random bytes as base64url: 43 characters.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export const isConfirmToken = (token) => typeof token === 'string' && TOKEN_PATTERN.test(token);

export const confirmUrl = (origin, token) => `${origin}/confirm-email#${token}`;

/**
 * Makes a confirmation link for `userId`'s `email` and returns its raw token,
 * which isn't kept anywhere. Any older link for the account stops working.
 */
export async function createEmailConfirmation(userId, email) {
  const owner = new ObjectId(userId);
  const token = randomBytes(32).toString('base64url');
  const now = new Date();

  await confirmations().deleteMany({ userId: owner });
  await confirmations().insertOne({
    userId: owner,
    email,
    tokenHash: hashToken(token),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + EMAIL_CONFIRM_LINK_HOURS * 60 * 60 * 1000),
  });
  return { token };
}

/**
 * Confirms the email a link was sent to. The link is used up first, so it
 * works once. The account must still have that email: a link to an address
 * the account no longer has confirms nothing. Returns `{ ok: true, userId,
 * email }` or `{ error }`, one message for a wrong, used or expired link.
 */
export async function redeemEmailConfirmation(token) {
  const row = await confirmations().findOneAndDelete({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!row) return { error: 'This link has expired or was already used.' };

  // A Date, as Auth.js's adapter writes it.
  const { matchedCount } = await client
    .db()
    .collection('users')
    .updateOne({ _id: row.userId, email: row.email }, { $set: { emailVerified: new Date() } });
  if (matchedCount === 0) return { error: 'This link has expired or was already used.' };
  return { ok: true, userId: String(row.userId), email: row.email };
}

// Once the email is confirmed another way (a Google sign-in), or with the
// account, its links go.
export async function deleteUserEmailConfirmations(userId) {
  const { deletedCount } = await confirmations().deleteMany({ userId: new ObjectId(userId) });
  return { deletedEmailConfirmations: deletedCount };
}
