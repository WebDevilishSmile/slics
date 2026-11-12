import crypto from 'crypto';

// Constant-time comparison of a received secret with the expected one, for
// webhook and cron routes. Hashing first gives both sides the same length,
// which timingSafeEqual needs. Server-only.
const sha256 = (value) => crypto.createHash('sha256').update(value).digest();

export function secretsMatch(given, expected) {
  return crypto.timingSafeEqual(sha256(given), sha256(expected));
}

// The same, against a stored SHA-256 (64 hex characters) instead of the
// secret itself: a hub's sheet webhook (`hub-configs` `sheet.webhookSecretHash`,
// docs/MULTI-HUB.md). False for a malformed hash.
export function secretMatchesHash(given, hashHex) {
  if (typeof hashHex !== 'string' || !/^[0-9a-f]{64}$/.test(hashHex)) return false;
  return crypto.timingSafeEqual(sha256(given), Buffer.from(hashHex, 'hex'));
}

// What gets stored for a secret: its SHA-256 as hex (scripts/seedHubConfig.mjs
// computes the same).
export const hashSecret = (secret) => sha256(secret).toString('hex');
