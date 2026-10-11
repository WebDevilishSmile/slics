import bcrypt from 'bcryptjs';

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/constants';

// The one rule for a new password: sign-up (app/api/auth/register) and a
// reset (lib/db/passwordResets.js) both go through it. bcrypt only reads the
// first 72 bytes, so the cap keeps a long passphrase from being silently cut
// (docs/SECURITY.md #8).
const BCRYPT_COST = 12;

// A message for a 400, or null when the password is fine.
export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  return null;
}

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST);
}
