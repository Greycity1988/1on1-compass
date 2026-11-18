import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  KEYS,
  MIN_PIN_LENGTH,
  clearFailedLogins,
  fail,
  getRedis,
  isLeader,
  isLockedOut,
  issueSession,
  loadAuth,
  makeAuth,
  noStore,
  readBody,
  recordFailedLogin,
  verifyPin,
} from './_lib/server.js';

/**
 * POST { action: 'login', pin }              -> { token, expiresAt }
 * POST { action: 'change', current, next }   -> { token, expiresAt }  (leader session required)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res);
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');
  const redis = getRedis();
  if (!redis) return fail(res, 503, 'storage_not_configured');

  try {
    const body = readBody(req);
    const auth = await loadAuth(redis);
    if (!auth) return fail(res, 409, 'setup_required');

    if (body.action === 'login') {
      if (await isLockedOut(redis, req)) return fail(res, 429, 'too_many_attempts');
      if (typeof body.pin !== 'string' || !verifyPin(auth, body.pin)) {
        await recordFailedLogin(redis, req);
        return fail(res, 401, 'wrong_pin');
      }
      await clearFailedLogins(redis, req);
      return res.status(200).json(issueSession(auth));
    }

    if (body.action === 'change') {
      if (!(await isLeader(req, redis))) return fail(res, 401, 'unauthorized');
      if (await isLockedOut(redis, req)) return fail(res, 429, 'too_many_attempts');
      if (typeof body.current !== 'string' || !verifyPin(auth, body.current)) {
        await recordFailedLogin(redis, req);
        return fail(res, 403, 'wrong_pin');
      }
      const next = typeof body.next === 'string' ? body.next.trim() : '';
      if (next.length < MIN_PIN_LENGTH || next.length > 64) return fail(res, 400, 'weak_pin');
      const record = makeAuth(next);
      await redis.set(KEYS.auth, record);
      return res.status(200).json(issueSession(record));
    }

    return fail(res, 400, 'unknown_action');
  } catch (err) {
    console.error('auth handler failed', err);
    return fail(res, 500, 'server_error');
  }
}
