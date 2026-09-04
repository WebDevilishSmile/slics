import client from '@/lib/db';

const COLLECTION = 'rateLimits';

// The TTL index is what actually cleans up spent windows. Created once per
// process, lazily — createIndex is a no-op once it exists.
let indexReady = null;

function ensureIndex(db) {
  if (!indexReady) {
    indexReady = db
      .collection(COLLECTION)
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
      .catch((error) => {
        indexReady = null; // let a later request retry
        console.error('Could not create rateLimits TTL index:', error);
      });
  }
  return indexReady;
}

/**
 * Fixed-window rate limiter backed by MongoDB, so the count is shared across
 * every serverless instance (an in-process Map would not be).
 *
 * Deliberately FAILS OPEN: if Mongo is unreachable the request is allowed
 * through. A limiter outage must never take down sign-up or commenting.
 *
 * @param {string} key    caller-namespaced identity, e.g. `register:1.2.3.4`
 * @param {number} limit  requests allowed per window
 * @param {number} windowMs window length in milliseconds
 */
export async function checkRateLimit({ key, limit, windowMs }) {
  try {
    const db = client.db();
    await ensureIndex(db);

    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const resetAt = windowStart + windowMs;

    const doc = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: `${key}:${windowStart}` },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(resetAt) } },
      { upsert: true, returnDocument: 'after' }
    );

    const count = doc?.count ?? 1;

    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
    };
  } catch (error) {
    console.error('Rate limit check failed, allowing request:', error);
    return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/**
 * Best-effort client IP. On Vercel the real address is the first entry in
 * x-forwarded-for; everything after it is proxy chain.
 */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
