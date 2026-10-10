import crypto from 'crypto';

// Constant-time comparison of a received secret with the expected one, for
// webhook and cron routes. Hashing first gives both sides the same length,
// which timingSafeEqual needs. Server-only.
export function secretsMatch(given, expected) {
  const hash = (value) => crypto.createHash('sha256').update(value).digest();
  return crypto.timingSafeEqual(hash(given), hash(expected));
}
